import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { PlanSyncService } from '@/services/plan-sync.service';

interface User {
  id: string;
  email: string;
  name: string;
}

interface LicenseStatus {
  isValid: boolean;
  isInstalled: boolean;
  plan?: string;
  expiresAt?: string;
}

interface AuthContextType {
  user: User | null;
  licenseStatus: LicenseStatus | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkLicenseStatus: () => Promise<void>;
  refreshLicenseStatus: (forceUpdate?: boolean) => Promise<void>;
  isFirstInstallation: () => Promise<boolean>;
  hasLocalUsers: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Sempre verificar status da licença
        await checkLicenseStatus();
      } catch (error) {
        console.error('Erro ao verificar status de autenticação:', error);
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const checkLicenseStatus = useCallback(async () => {
    console.log('🔍 Verificando status da licença - DIRETO do client-local...');
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      console.log('🏢 Tenant ID:', tenantId);
      
      // SEMPRE limpar estado antes de nova consulta
      setLicenseStatus(null);
      
      // Consulta DIRETA ao client-local - SEM CACHE
      const statusResponse = await fetch(`http://localhost:3001/licensing/status?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...(tenantId && { 'x-tenant-id': tenantId })
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Status request failed: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('📊 Status data from client-local:', statusData);
      
      const installResponse = await fetch(`http://localhost:3001/licensing/install-status?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...(tenantId && { 'x-tenant-id': tenantId })
        }
      });
      
      if (!installResponse.ok) {
        throw new Error(`Install status request failed: ${installResponse.status}`);
      }
      
      const installData = await installResponse.json();
      console.log('🔧 Install data from client-local:', installData);
      
      const newLicenseStatus = {
        isValid: statusData.valid || false,
        isInstalled: installData.isInstalled || false,
        plan: installData.planKey, // USAR install-status que tem dados mais confiáveis
        expiresAt: installData.expiresAt || statusData.expiresAt
      };
      
      console.log('✅ Novo license status:', newLicenseStatus);
      setLicenseStatus(newLicenseStatus);
      
    } catch (error) {
      console.error('❌ Erro ao verificar status da licença:', error);
      setLicenseStatus({
        isValid: false,
        isInstalled: false
      });
    }
  }, []);

  const refreshLicenseStatus = useCallback(async (forceUpdate: boolean = false) => {
    console.log('🔄 Forçando atualização do status da licença...', forceUpdate ? '(FORCE UPDATE)' : '');
    
    if (forceUpdate) {
      // Limpar cache local antes de fazer nova consulta
      console.log('🧹 Limpando cache local de licença...');
      setLicenseStatus(null);
    }
    
    await checkLicenseStatus();
  }, [checkLicenseStatus]);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 INÍCIO DO LOGIN - Email:', email);
    setIsLoading(true);
    
    try {
      // ETAPA 1: Tentar autenticação no Hub (verificar cadastro + licenças)
      console.log('📡 ETAPA 1: Tentando autenticação no Hub...');
      let hubResponse;
      let hubAvailable = true;
      
      try {
        console.log('🌐 Fazendo requisição para Hub: http://localhost:8081/public/login');
        hubResponse = await fetch('http://localhost:8081/public/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
        });
        console.log('📡 Resposta do Hub - Status:', hubResponse.status, 'OK:', hubResponse.ok);
      } catch (hubError) {
        console.warn('❌ Hub não disponível:', hubError);
        hubAvailable = false;
        
        // Mostrar mensagem informativa sobre tentativa offline
        toast({
          title: "Servidor principal indisponível",
          description: "Tentando fazer login offline com dados em cache...",
          variant: "default",
        });
      }

      // ETAPA 2: Se Hub disponível, processar resposta
      if (hubAvailable && hubResponse?.ok) {
        console.log('✅ Hub disponível e resposta OK - processando...');
        const result = await hubResponse.json();
        console.log('📋 Dados do usuário recebidos do Hub:', {
          userId: result.user?.id,
          email: result.user?.email,
          displayName: result.user?.displayName,
          tenantId: result.user?.tenant?.id
        });
        
        const userData: User = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0]
        };
        
        // Sincronizar dados com client-local
        console.log('🔄 Sincronizando dados com client-local...');
        try {
          const syncResponse = await fetch('http://localhost:3001/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              hubUserId: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
              tenantId: result.user.tenant.id,
              active: true,
            }),
          });
          console.log('🔄 Sincronização - Status:', syncResponse.status, 'OK:', syncResponse.ok);
        } catch (syncError) {
          console.warn('⚠️ Erro na sincronização com client-local:', syncError);
        }

        // Verificar licenças no Hub
        console.log('🎫 Verificando licenças no Hub...');
        try {
          const licenseUrl = `http://localhost:8081/licenses/validate?tenantId=${result.user.tenant.id}`;
          console.log('🎫 URL de validação de licença:', licenseUrl);
          const licenseResponse = await fetch(licenseUrl);
          console.log('🎫 Resposta da licença - Status:', licenseResponse.status, 'OK:', licenseResponse.ok);
          
          if (licenseResponse.ok) {
            const licenseData = await licenseResponse.json();
            console.log('🎫 Dados da licença:', {
              valid: licenseData.valid,
              licensed: licenseData.licensed,
              planKey: licenseData.planKey,
              expiresAt: licenseData.expiresAt
            });
            
            // Se tem licença válida, fazer login normalmente
              if (licenseData.valid && licenseData.licensed) {
                console.log('✅ Licença válida - fazendo login completo...');
                setUser(userData);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                localStorage.setItem('tenant_id', result.user.tenant.id);
                
                // Ativar licença no client-local para gerar e persistir JWT token
                try {
                  console.log('🔑 Ativando licença no client-local...');
                  const activateResponse = await fetch('http://localhost:3001/licensing/activate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      tenantId: result.user.tenant.id,
                      deviceId: 'web-client', // ou gerar um deviceId único
                    }),
                  });
                  
                  if (activateResponse.ok) {
                    const activateResult = await activateResponse.json();
                    console.log('🔑 Licença ativada com sucesso:', activateResult);
                  } else {
                    console.warn('⚠️ Erro na ativação da licença:', activateResponse.status);
                  }
                } catch (activateError) {
                  console.warn('⚠️ Erro ao ativar licença:', activateError);
                }
                
                // Persistir licença no client-local para uso offline futuro
                try {
                  console.log('💾 Persistindo licença no client-local...');
                  await fetch('http://localhost:3001/licensing/persist', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      tenantId: result.user.tenant.id,
                      userId: result.user.id,
                      licenseData: licenseData
                    }),
                  });
                  console.log('💾 Licença persistida com sucesso');
                } catch (persistError) {
                  console.warn('⚠️ Erro ao persistir licença localmente:', persistError);
                }
                
                // 🔄 SINCRONIZAÇÃO DE PLANOS APÓS LOGIN
                try {
                  console.log('🔄 Iniciando sincronização de planos após login...');
                  const syncResult = await PlanSyncService.syncPlansAfterLogin(
                    result.user.tenant.id,
                    result.user.id
                  );
                  
                  if (syncResult.success) {
                    console.log('✅ Sincronização de planos concluída:', syncResult.message);
                    toast({
                      title: "Sincronização concluída",
                      description: `Planos sincronizados com sucesso. Plano atual: ${syncResult.planKey}`,
                      variant: "default",
                    });
                  } else {
                    console.warn('⚠️ Sincronização parcial:', syncResult.message);
                    toast({
                      title: "Sincronização parcial",
                      description: syncResult.message,
                      variant: "default",
                    });
                  }
                } catch (syncError) {
                  console.error('❌ Erro na sincronização de planos:', syncError);
                  toast({
                    title: "Erro na sincronização",
                    description: "Não foi possível sincronizar os planos. O sistema funcionará normalmente.",
                    variant: "default",
                  });
                }
                
                // Forçar atualização do status da licença após login bem-sucedido
                console.log('🔄 Forçando atualização do cache de licença após login...');
                await checkLicenseStatus();
                
                console.log('🎉 LOGIN CONCLUÍDO COM SUCESSO!');
                return true;
            } else {
              console.log('⚠️ Hub online mas licença vencida/inexistente - mostrando modal de planos');
              // Hub online mas licença vencida/inexistente - mostrar modal de planos
              setUser(userData);
              localStorage.setItem('auth_user', JSON.stringify(userData));
              localStorage.setItem('tenant_id', result.user.tenant.id);
              localStorage.setItem('show_plans_modal', 'true');
              
              toast({
                title: "Licença necessária",
                description: "Selecione um plano para continuar usando o sistema.",
                variant: "default",
              });
              
              // Forçar atualização do status da licença após login (mesmo sem licença válida)
              console.log('🔄 Forçando atualização do cache de licença após login...');
              await checkLicenseStatus();
              
              console.log('🎉 LOGIN CONCLUÍDO - mas precisa selecionar plano');
              return true; // Login bem-sucedido, mas precisa selecionar plano
            }
          }
        } catch (licenseError) {
          console.warn('❌ Erro ao verificar licenças no Hub:', licenseError);
          // Continuar com verificação offline
        }
      }

      // ETAPA 3: Hub offline ou com problema - verificar client-local
      console.log('🔄 ETAPA 3: Hub offline ou com problema - verificando client-local...');
      if (!hubAvailable || !hubResponse?.ok) {
        console.log('💻 Tentando login offline no client-local...');
        try {
          const offlineResponse = await fetch('http://localhost:3001/auth/offline-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          console.log('💻 Resposta offline - Status:', offlineResponse.status, 'OK:', offlineResponse.ok);

          if (offlineResponse.ok) {
            const offlineResult = await offlineResponse.json();
            console.log('💻 Dados do usuário offline:', offlineResult.user);
            
            if (offlineResult.success) {
              console.log('✅ Login offline bem-sucedido');
              const userData: User = {
                id: offlineResult.user.id,
                email: offlineResult.user.email,
                name: offlineResult.user.displayName || offlineResult.user.email.split('@')[0]
              };
              
              setUser(userData);
              localStorage.setItem('auth_user', JSON.stringify(userData));
              
              // Definir status de licença offline
              setLicenseStatus({
                isValid: true,
                isInstalled: true,
                plan: offlineResult.license?.planKey || 'starter',
                expiresAt: offlineResult.license?.expiresAt
              });
              
              toast({
                title: "Login offline realizado",
                description: "Conectado usando dados em cache. Funcionalidade limitada.",
                variant: "default",
              });
              
              // Forçar atualização do status da licença após login offline
              console.log('🔄 Forçando atualização do cache de licença após login offline...');
              await checkLicenseStatus();
              
              return true;
            } else {
              // Mostrar mensagem específica do serviço offline
              toast({
                title: "Login offline falhou",
                description: offlineResult.message || "Não foi possível fazer login offline.",
                variant: "destructive",
              });
            }
          } else {
            // Tratar diferentes códigos de status HTTP
            if (offlineResponse.status === 404) {
              toast({
                title: "Serviço offline não encontrado",
                description: "O endpoint de login offline não está disponível. Verifique se o client-local está atualizado.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Erro no serviço offline",
                description: `Falha na comunicação com o serviço local (${offlineResponse.status}).`,
                variant: "destructive",
              });
            }
          }
        } catch (offlineError) {
          console.warn('❌ Erro na verificação offline:', offlineError);
          
          // Mostrar mensagem específica baseada no tipo de erro
          if (offlineError instanceof TypeError && offlineError.message.includes('fetch')) {
            toast({
              title: "Serviço offline indisponível",
              description: "O serviço local não está funcionando. Verifique se o client-local está rodando.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro no login offline",
              description: "Não foi possível fazer login offline. Tente conectar-se à internet.",
              variant: "destructive",
            });
          }
        }
      }

      // ETAPA 4: Login falhou em todas as tentativas
      console.log('❌ ETAPA 4: Login falhou em todas as tentativas');
      if (hubAvailable && hubResponse && !hubResponse.ok) {
        console.log('❌ Hub disponível mas resposta não OK - Status:', hubResponse.status);
        if (hubResponse.status === 401) {
          console.log('🔒 Credenciais inválidas (401)');
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else {
          console.log('👤 Usuário não encontrado - marcando flag');
          // Usuário não encontrado - permitir login mas marcar para mostrar aviso
          localStorage.setItem('user_not_found', 'true');
          
          toast({
            title: "Usuário não encontrado",
            description: "Usuário não está registrado no sistema.",
            variant: "destructive",
          });
        }
      } else {
        // Caso geral de falha no login
        toast({
          title: "Falha no login",
          description: "Não foi possível fazer login. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      }
      
      console.log('❌ LOGIN FALHOU - retornando false');
      return false;
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO LOGIN:', error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar aos serviços. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      console.log('🏁 Finalizando processo de login...');
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('🚪 Iniciando logout - limpando cache...');
    
    // Limpar estado do React
    setUser(null);
    setLicenseStatus(null);
    
    // Limpar localStorage completamente
    localStorage.clear();
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 Cache limpo - redirecionando para login...');
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    
    // Navegar para login e forçar refresh da página para garantir estado limpo
    navigate('/erp/login');
    
    // Pequeno delay para garantir que a navegação aconteça antes do reload
    setTimeout(() => {
      console.log('🔄 Forçando reload da página para garantir estado limpo...');
      window.location.reload();
    }, 100);
  };

  const isFirstInstallation = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/users/has-users');
      if (response.ok) {
        const data = await response.json();
        return !data.hasUsers;
      }
      return true; // Se não conseguir verificar, assume primeira instalação
    } catch (error) {
      console.error('Erro ao verificar primeira instalação:', error);
      return true;
    }
  };

  const hasLocalUsers = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3001/users/has-users');
      if (response.ok) {
        const data = await response.json();
        return data.hasUsers;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar usuários locais:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    licenseStatus,
    isLoading,
    login,
    logout,
    checkLicenseStatus,
    isFirstInstallation,
    hasLocalUsers
  };

  return (
    <AuthContext.Provider value={{
      user,
      licenseStatus,
      isLoading,
      login,
      logout,
      checkLicenseStatus,
      refreshLicenseStatus,
      isFirstInstallation,
      hasLocalUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}