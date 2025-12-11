import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { PlanSyncService } from '@/services/plan-sync.service';
import { API_URLS, ENDPOINTS } from '../lib/env';
// Limite de dias offline configurável via env; padrão 5
const OFFLINE_MAX_DAYS = Math.max(0, Number(import.meta.env.VITE_OFFLINE_MAX_DAYS ?? 5));
// Timeout do login no Hub (Render pode ter cold-start). Padrão 45s.
const HUB_LOGIN_TIMEOUT_MS = Math.max(10000, Number(import.meta.env.VITE_HUB_LOGIN_TIMEOUT_MS ?? 45000));
// Timeout das checagens de saúde do Hub. Recomendado 15–20s; padrão 20s.
const HUB_HEALTH_TIMEOUT_MS = Math.max(10000, Number(import.meta.env.VITE_HUB_HEALTH_TIMEOUT_MS ?? 20000));
// Intervalo de polling do health. Padrão: 20s. Primeiro check acontece somente após este delay.
const HUB_HEALTH_POLL_INTERVAL_MS = Math.max(5000, Number(import.meta.env.VITE_HUB_HEALTH_POLL_INTERVAL_MS ?? 20000));

interface User {
  id: string;
  email: string;
  name: string;
  // Opcional: papel do usuário (para controle de permissões no frontend)
  roleId?: string;
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
  loginWithPin: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  switchAccountByEmail: (email: string) => Promise<boolean>;
  checkLicenseStatus: () => Promise<void>;
  refreshLicenseStatus: (forceUpdate?: boolean) => Promise<void>;
  isFirstInstallation: () => Promise<boolean>;
  hasLocalUsers: () => Promise<boolean>;
  isHubOnline: boolean;
  hubLastCheck: string | null;
  checkHubConnectivity: () => Promise<boolean>;
  syncLicenseWithHub: () => Promise<void>;
  // Novos campos expostos para UI
  licenseCacheUpdatedAt: string | null;
  licenseCacheLastChecked: string | null;
  offlineDaysLeft: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Novos estados para timestamps e dias offline restantes
  const [licenseCacheUpdatedAt, setLicenseCacheUpdatedAt] = useState<string | null>(null);
  const [licenseCacheLastChecked, setLicenseCacheLastChecked] = useState<string | null>(null);
  const [offlineDaysLeft, setOfflineDaysLeft] = useState<number | null>(null);
  const navigate = useNavigate();
  const hasInitCheckRef = useRef(false);

  // Pequena utilidade para fetch com timeout explícito
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  // Verificar se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        const licenseCheck = checkLicenseStatus();
        await Promise.race([
          licenseCheck,
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch (error) {
        console.error('Erro ao verificar status de autenticação:', error);
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasInitCheckRef.current) {
      return;
    }
    hasInitCheckRef.current = true;
    checkAuthStatus();
  }, []);

  const checkLicenseStatus = useCallback(async () => {
    console.log('🔍 Verificando status da licença - DIRETO do client-local...');
    
    try {
      const tenantId = localStorage.getItem('tenant_id');
      console.log('🏢 Tenant ID:', tenantId);
      
      // Não limpar imediatamente para evitar flicker; atualize ao final
      
      // Consulta direta ao client-local (8081). Evita HTML do ERP em produção.
      let statusResponse: Response = await fetchWithTimeout(`${API_URLS.CLIENT_LOCAL}/licensing/status?t=${Date.now()}`, {
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
      }, 10000);
      
      if (!statusResponse.ok) {
        throw new Error(`Status request failed: ${statusResponse.status}`);
      }
      
      const statusData = await parseJsonSafe(statusResponse, '/licensing/status');
      console.log('📊 Status data from client-local:', statusData);

      // Atualizar timestamps e calcular dias offline restantes
      try {
        const updatedAt = statusData.updatedAt || null;
        const lastChecked = statusData.lastChecked || null;
        setLicenseCacheUpdatedAt(updatedAt);
        setLicenseCacheLastChecked(lastChecked);
        const ts = updatedAt || lastChecked;
        if (ts) {
          const last = new Date(ts).getTime();
          const days = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
          setOfflineDaysLeft(Math.max(0, OFFLINE_MAX_DAYS - days));
        } else {
          setOfflineDaysLeft(null);
        }
      } catch (e) {
        console.warn('⚠️ Falha ao calcular dias offline restantes', e);
      }
      
      let installResponse: Response;
      try {
        installResponse = await fetchWithTimeout(`${API_URLS.CLIENT_LOCAL}/licensing/install-status?t=${Date.now()}`, {
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
        }, 6000);
      } catch (e) {
        console.warn('Falha via proxy /licensing/install-status; tentando direto no client-local', e);
        installResponse = await fetchWithTimeout(`${API_URLS.CLIENT_LOCAL}/licensing/install-status?t=${Date.now()}`, {
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
        }, 8000);
      }
      
      if (!installResponse.ok) {
        throw new Error(`Install status request failed: ${installResponse.status}`);
      }
      
      const installData = await parseJsonSafe(installResponse, '/licensing/install-status');
      console.log('🔧 Install data from client-local:', installData);
      
      // Normalizar planos e escolher o mais "alto" entre Hub e client-local
      const normalizePlan = (raw?: string): 'starter' | 'pro' | 'max' | undefined => {
        if (!raw) return undefined;
        const s = String(raw).toLowerCase();
        const map: Record<string, 'starter' | 'pro' | 'max'> = {
          starter: 'starter', basico: 'starter', básico: 'starter', basic: 'starter',
          pro: 'pro', profissional: 'pro',
          max: 'max', enterprise: 'max', development: 'max'
        };
        return map[s] || (['starter','pro','max'].includes(s) ? (s as 'starter'|'pro'|'max') : undefined);
      };
      // Sempre priorizar o plano do Hub como fonte da verdade.
      const hubPlan = normalizePlan(statusData.planKey);
      const localPlan = normalizePlan(installData.planKey);
      const chosenPlan = hubPlan || localPlan;

      const newLicenseStatus = {
        isValid: Boolean(statusData.valid),
        // Considera instalado se qualquer fonte indicar instalação
        isInstalled: Boolean(installData.isInstalled) || Boolean(statusData.canStart),
        // Escolhe o plano mais permissivo entre Hub e client-local para ambiente de desenvolvimento
        plan: chosenPlan,
        expiresAt: installData.expiresAt || statusData.expiresAt
      } as LicenseStatus;
      
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
      // Limpar com cuidado para evitar flapping visual
      console.log('🧹 Preparando atualização do cache de licença...');
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
      // Considerar Hub disponível quando houver URL resolvida (env ou runtime default)
      const hubConfigured = Boolean(API_URLS.HUB);
      let hubAvailable = hubConfigured;
      
      if (hubAvailable) {
        try {
          console.log('🌐 Fazendo requisição para Hub:', ENDPOINTS.HUB_LOGIN);
          // Aumenta timeout (configurável) para evitar abortos em cold-start do provider
          hubResponse = await fetchWithTimeout(ENDPOINTS.HUB_LOGIN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          }, HUB_LOGIN_TIMEOUT_MS);
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
      } else {
        console.log('ℹ️ Hub não configurado ou apontando para localhost padrão; seguindo fluxo offline.');
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
          const syncResponse = await fetch(ENDPOINTS.CLIENT_USERS_SYNC, {
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
          const licenseUrl = `${ENDPOINTS.HUB_LICENSES_VALIDATE}?tenantId=${result.user.tenant.id}`;
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
                localStorage.setItem('2f.tenantId', result.user.tenant.id);

                // Persistir credenciais para uso offline
                try {
                  console.log('💾 Persistindo credenciais offline no client-local...');
                  const persistAuthRes = await fetch(ENDPOINTS.CLIENT_AUTH_PERSIST, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: result.user.email,
                      password: password,
                      tenantId: result.user.tenant.id,
                      displayName: result.user.displayName,
                      hubUserId: result.user.id,
                    }),
                  });
                  if (persistAuthRes.ok) {
                    const persistJson = await persistAuthRes.json();
                    console.log('💾 Credenciais offline persistidas:', persistJson);
                  } else {
                    console.warn('⚠️ Falha ao persistir credenciais offline:', persistAuthRes.status);
                  }
                } catch (persistErr) {
                  console.warn('⚠️ Erro ao persistir credenciais offline:', persistErr);
                }
                
                // Ativar licença no client-local para gerar e persistir JWT token
                try {
                  console.log('🔑 Ativando licença no client-local...');
                  const activateResponse = await fetch(ENDPOINTS.CLIENT_LICENSING_ACTIVATE, {
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
                  await fetch(ENDPOINTS.CLIENT_LICENSING_PERSIST, {
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
              localStorage.setItem('2f.tenantId', result.user.tenant.id);
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

      // Curto-circuito: se Hub respondeu 401, tratar como credenciais inválidas e não seguir para offline
      if (hubAvailable && hubResponse && !hubResponse.ok && hubResponse.status === 401) {
        console.log('🔒 Credenciais inválidas (401) - abortando fluxo offline');
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
        console.log('❌ LOGIN FALHOU - retornando false');
        return false;
      }

      // ETAPA 3: Hub offline ou erro de servidor - verificar client-local
      console.log('🔄 ETAPA 3: Hub offline ou com problema - verificando client-local...');
      if (!hubAvailable || (hubResponse && !hubResponse.ok && hubResponse.status >= 500)) {
        console.log(`💻 Verificando restrição de login offline (máximo ${OFFLINE_MAX_DAYS} dias sem Hub)...`);

        // Buscar timestamps do cache para calcular dias sem Hub
        let offlineDaysLeft: number | null = null;
        try {
          let tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('2f.tenantId') || '';

          // Se não houver tenantId, tentar resolver via lookup por e-mail no client-local
          if (!tenantId) {
            try {
              const lookupUrl = `${API_URLS.CLIENT_LOCAL}/users/lookup/by-email?email=${encodeURIComponent(email)}`;
              console.log('🔎 Resolvendo tenantId via lookup de usuário:', lookupUrl);
              const lookupRes = await fetch(lookupUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
              });
              if (lookupRes.ok) {
                const userJson = await lookupRes.json();
                if (userJson?.tenantId) {
                  tenantId = String(userJson.tenantId);
                  console.log('🔎 tenantId resolvido via lookup:', tenantId);
                } else {
                  console.warn('⚠️ Lookup de usuário não retornou tenantId');
                }
              } else {
                console.warn('⚠️ Falha no lookup de usuário por email', lookupRes.status);
              }
            } catch (lookupErr) {
              console.warn('⚠️ Erro ao resolver tenantId via lookup:', lookupErr);
            }
          }

          const statusRes = await fetch(`${API_URLS.CLIENT_LOCAL}/licensing/status?t=${Date.now()}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              ...(tenantId && { 'x-tenant-id': tenantId })
            }
          });
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            const ts = statusJson.updatedAt || statusJson.lastChecked;
            if (ts) {
              const last = new Date(ts).getTime();
              const now = Date.now();
              const days = Math.floor((now - last) / (24 * 60 * 60 * 1000));
              offlineDaysLeft = Math.max(0, OFFLINE_MAX_DAYS - days);
              console.log(`📉 Dias sem Hub desde última atualização: ${days}d (restam ${offlineDaysLeft}d)`);
            } else {
              console.warn('⚠️ Não há timestamps no status da licença (updatedAt/lastChecked)');
            }
          } else {
            console.warn('⚠️ Falha ao obter /licensing/status para cálculo offline', statusRes.status);
          }
        } catch (e) {
          console.warn('⚠️ Erro ao calcular dias offline permitidos', e);
        }

        console.log('💻 Tentando login offline no client-local...');
        try {
          const offlineResponse = await fetch(`${API_URLS.CLIENT_LOCAL}/auth/offline-login`, {
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
              if (offlineResult.user?.tenantId) {
                localStorage.setItem('tenant_id', String(offlineResult.user.tenantId));
                localStorage.setItem('2f.tenantId', String(offlineResult.user.tenantId));
              }
              
              // Definir status de licença offline
              setLicenseStatus({
                isValid: true,
                isInstalled: true,
                plan: offlineResult.license?.planKey || 'starter',
                expiresAt: offlineResult.license?.expiresAt
              });
              
              toast({
                title: 'Login offline realizado',
                description: offlineDaysLeft != null ? `Conectado usando cache. Restam ${offlineDaysLeft} dias sem Hub (máximo ${OFFLINE_MAX_DAYS}).` : 'Conectado usando dados em cache. Funcionalidade limitada.',
                variant: 'default',
              });
              
              // Forçar atualização do status da licença após login offline
              console.log('🔄 Forçando atualização do cache de licença após login offline...');
              await checkLicenseStatus();
              
              return true;
            } else {
              // Mostrar mensagem específica do serviço offline
              toast({
                title: 'Login offline falhou',
                description: offlineResult.message || 'Não foi possível fazer login offline.',
                variant: 'destructive',
              });
            }
          } else {
            // Tratar diferentes códigos de status HTTP
            if (offlineResponse.status === 404) {
              toast({
                title: 'Serviço offline não encontrado',
                description: 'O endpoint de login offline não está disponível. Verifique se o client-local está atualizado.',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Erro no serviço offline',
                description: `Falha na comunicação com o serviço local (${offlineResponse.status}).`,
                variant: 'destructive',
              });
            }
          }
        } catch (offlineError) {
          console.warn('❌ Erro na verificação offline:', offlineError);
          
          // Mostrar mensagem específica baseada no tipo de erro
          if (offlineError instanceof TypeError && offlineError.message.includes('fetch')) {
            toast({
              title: 'Serviço offline indisponível',
              description: 'O serviço local não está funcionando. Verifique se o client-local está rodando.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro no login offline',
              description: 'Não foi possível fazer login offline. Tente conectar-se à internet.',
              variant: 'destructive',
            });
          }
        }
      }

      // ETAPA 4: Login falhou em todas as tentativas
      console.log('❌ ETAPA 4: Login falhou em todas as tentativas');
      if (hubAvailable && hubResponse && !hubResponse.ok) {
        console.log('❌ Hub disponível mas resposta não OK - Status:', hubResponse.status);
        if (hubResponse.status !== 401) {
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

  // Login rápido por PIN (via client-local, centralizando regras de licença/bloqueios)
  const loginWithPin = async (email: string, pin: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cleanPin = String(pin).replace(/\D/g, '');
      if (cleanPin.length !== 4) {
        toast({ title: 'PIN inválido', description: 'Informe 4 dígitos.', variant: 'destructive' });
        return false;
      }
      // Não enviar tenantId para evitar mismatch; backend usa tenantId do usuário local
      const payload: any = { email, pin: cleanPin };

      const res = await fetchWithTimeout(ENDPOINTS.CLIENT_AUTH_OFFLINE_PIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 8000);

      if (!res.ok) {
        if (res.status === 401) {
          const data = await parseJsonSafe(res, '/auth/offline-pin-login');
          // Fallback: se for mismatch de tenant, tentar sem tenantId (já estamos sem, mas mantém robustez)
          if (String(data?.message || '').toLowerCase().includes('tenantid informado não corresponde')) {
            const retry = await fetchWithTimeout(ENDPOINTS.CLIENT_AUTH_OFFLINE_PIN_LOGIN, {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, pin: cleanPin })
            }, 8000);
            if (!retry.ok) {
              const retryData = await parseJsonSafe(retry, '/auth/offline-pin-login');
              toast({ title: 'Login por PIN falhou', description: retryData?.message || 'PIN inválido ou restrições offline.', variant: 'destructive' });
              return false;
            }
            const retryResult = await parseJsonSafe(retry, '/auth/offline-pin-login');
            if (!retryResult?.success || !retryResult?.user) {
              toast({ title: 'Login por PIN falhou', description: retryResult?.message || 'Não foi possível autenticar.', variant: 'destructive' });
              return false;
            }
            const nextUserRetry: User = {
              id: String(retryResult.user.id),
              email: String(retryResult.user.email),
              name: String(retryResult.user.displayName || String(retryResult.user.email).split('@')[0]),
              roleId: typeof retryResult.user.role === 'string' ? String(retryResult.user.role) : undefined,
            };
            localStorage.setItem('auth_user', JSON.stringify(nextUserRetry));
            if (retryResult.user?.tenantId) {
              localStorage.setItem('tenant_id', String(retryResult.user.tenantId));
              localStorage.setItem('2f.tenantId', String(retryResult.user.tenantId));
            }
            setUser(nextUserRetry);
            setLicenseStatus({ isValid: true, isInstalled: true, plan: retryResult.license?.planKey || 'starter', expiresAt: retryResult.license?.expiresAt });
            toast({ title: 'Login por PIN', description: `Conectado como ${nextUserRetry.name || nextUserRetry.email}` });
            await checkLicenseStatus();
            return true;
          }
          toast({ title: 'Login por PIN falhou', description: data?.message || 'PIN inválido ou restrições offline.', variant: 'destructive' });
          return false;
        }
        toast({ title: 'Serviço offline indisponível', description: `Falha ao comunicar com client-local (${res.status}).`, variant: 'destructive' });
        return false;
      }

      const result = await parseJsonSafe(res, '/auth/offline-pin-login');
      if (!result?.success || !result?.user) {
        toast({ title: 'Login por PIN falhou', description: result?.message || 'Não foi possível autenticar.', variant: 'destructive' });
        return false;
      }

      const nextUser: User = {
        id: String(result.user.id),
        email: String(result.user.email),
        name: String(result.user.displayName || String(result.user.email).split('@')[0]),
        roleId: typeof result.user.role === 'string' ? String(result.user.role) : undefined,
      };
      // Persistir no localStorage incluindo roleId para cálculo de permissões
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      if (result.user?.tenantId) {
        localStorage.setItem('tenant_id', String(result.user.tenantId));
        localStorage.setItem('2f.tenantId', String(result.user.tenantId));
      }
      setUser(nextUser);

      // Atualizar status de licença com base no retorno e sincronizar cache
      setLicenseStatus({
        isValid: true,
        isInstalled: true,
        plan: result.license?.planKey || 'starter',
        expiresAt: result.license?.expiresAt
      });

      toast({ title: 'Login por PIN', description: `Conectado como ${nextUser.name || nextUser.email}` });

      // Forçar atualização de status de licença (menus/permissões atualizados)
      await checkLicenseStatus();
      return true;
    } catch (err) {
      console.error('loginWithPin error', err);
      toast({ title: 'Erro no login por PIN', description: 'Tente novamente mais tarde.', variant: 'destructive' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Trocar conta rapidamente usando usuários locais (sem revalidação de licença)
  const switchAccountByEmail = useCallback(async (email: string) => {
    try {
      // Buscar usuários locais no settings-api para obter nome/id
      const mod = await import('../lib/settings-api');
      const users = await mod.getUsers();
      const found = users.find(u => u.email === email);
      if (!found) return false;
      const nextUser: User = { id: found.id, email: found.email, name: found.nome };
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      setUser(nextUser);
      toast({ title: 'Conta alternada', description: `Agora usando ${nextUser.name || nextUser.email}` });
      return true;
    } catch (err) {
      console.error('switchAccountByEmail error', err);
      toast({ title: 'Erro ao trocar conta', description: 'Tente novamente mais tarde', variant: 'destructive' });
      return false;
    }
  }, []);

  const logout = () => {
    console.log('🚪 Iniciando logout - limpando cache...');
    
    // Limpar estado do React
    setUser(null);
    setLicenseStatus(null);
    
    // Limpar apenas chaves de autenticação e estado transitório
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('2f.tenantId');
      localStorage.removeItem('show_plans_modal');
      localStorage.removeItem('license_expired_offline');
      localStorage.removeItem('user_not_found');
      // Importante: NÃO limpar dados de configurações (ex: 2f.settings.users, roles, etc.)
    } catch (e) {
      console.warn('Erro ao limpar chaves de autenticação do localStorage', e);
    }
    
    // Limpar sessionStorage
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Erro ao limpar sessionStorage', e);
    }
    
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

  const parseJsonSafe = async (res: Response, endpointDesc: string) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Non-JSON response from ${endpointDesc}: ${ct} - ${text.slice(0, 60)}`);
    }
    return res.json();
  };

  const isFirstInstallation = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${ENDPOINTS.CLIENT_USERS_HAS_USERS}?t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const ct = response.headers.get('content-type') || '';
      if (response.ok && ct.includes('application/json')) {
        const data = await response.json();
        return !data.hasUsers;
      }
      console.warn('isFirstInstallation: resposta não-JSON ou não-OK para /users/has-users', ct, response.status);
      return true; // Se não conseguir verificar, assume primeira instalação
    } catch (error) {
      console.error('Erro ao verificar primeira instalação:', error);
      return true;
    }
  };

  const hasLocalUsers = async (): Promise<boolean> => {
    try {
      const response = await fetch(ENDPOINTS.CLIENT_USERS_HAS_USERS);
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

  // Hub connectivity + license sync
  const [isHubOnline, setIsHubOnline] = useState<boolean>(false);
  const [hubLastCheck, setHubLastCheck] = useState<string | null>(null);
  // Evitar chamadas concorrentes e múltiplos intervals em Strict Mode
  const healthCheckInFlightRef = useRef(false);
  const healthPollStartedRef = useRef(false);

  const checkHubConnectivity = useCallback(async (): Promise<boolean> => {
    // Evitar requisição ao Hub se não houver URL resolvida (env ou default runtime)
    const hubConfigured = Boolean(API_URLS.HUB);
    if (!hubConfigured) {
      setIsHubOnline(false);
      return false;
    }

    try {
      if (healthCheckInFlightRef.current) {
        // Já existe uma checagem em andamento; evita overlapping
        return isHubOnline;
      }
      healthCheckInFlightRef.current = true;
      // Timeout maior (20s por padrão) para validar o health com folga
      const res = await fetchWithTimeout(`${ENDPOINTS.HUB_HEALTH}?t=${Date.now()}`, { method: 'GET' }, HUB_HEALTH_TIMEOUT_MS);
      const ok = res.ok;
      setIsHubOnline(ok);
      if (ok) setHubLastCheck(new Date().toISOString());
      healthCheckInFlightRef.current = false;
      return ok;
    } catch (e) {
      setIsHubOnline(false);
      healthCheckInFlightRef.current = false;
      return false;
    }
  }, [fetchWithTimeout]);

  const syncLicenseWithHub = useCallback(async (): Promise<void> => {
    const tenantId = localStorage.getItem('tenant_id') || localStorage.getItem('2f.tenantId') || '';
    try {
      const res = await fetchWithTimeout(`${ENDPOINTS.HUB_LICENSES_VALIDATE}?tenantId=${tenantId}&t=${Date.now()}`, { method: 'GET' }, 5000);
      if (!res.ok) {
        setIsHubOnline(false);
        return;
      }
      const data = await res.json();
      const planKey = (data?.license?.planKey || data?.planKey || 'starter').toLowerCase();
      const expiresAt = data?.license?.expiresAt || data?.expiresAt || undefined;
      const valid = Boolean(data?.valid || data?.licensed);

      setLicenseStatus({
        isValid: valid,
        isInstalled: true,
        plan: planKey,
        expiresAt
      });

      setIsHubOnline(true);
      const nowIso = new Date().toISOString();
      setHubLastCheck(nowIso);
      setLicenseCacheUpdatedAt(nowIso);
      setOfflineDaysLeft(OFFLINE_MAX_DAYS);

      try {
        await fetch(`${API_URLS.CLIENT_LOCAL}/licensing/update-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            planKey,
            expiresAt,
            valid,
            lastChecked: nowIso,
            updatedAt: nowIso
          })
        });
      } catch (e) {
        console.warn('Falha ao atualizar cache de licença no client-local', e);
      }
    } catch (error) {
      console.warn('Erro ao sincronizar licença com Hub', error);
      setIsHubOnline(false);
    }
  }, [fetchWithTimeout]);

  // Polling: aguarda 20s e então verifica; repete a cada 20s. Evita duplicidade em Strict Mode.
  useEffect(() => {
    if (healthPollStartedRef.current) return; // Evita iniciar múltiplas vezes
    healthPollStartedRef.current = true;

    let intervalId: number | undefined;
    let firstTimeoutId: number | undefined;

    firstTimeoutId = window.setTimeout(() => {
      checkHubConnectivity();
      intervalId = window.setInterval(() => {
        checkHubConnectivity();
      }, HUB_HEALTH_POLL_INTERVAL_MS);
    }, HUB_HEALTH_POLL_INTERVAL_MS);

    return () => {
      if (firstTimeoutId) window.clearTimeout(firstTimeoutId);
      if (intervalId) window.clearInterval(intervalId);
      healthPollStartedRef.current = false;
    };
  }, [checkHubConnectivity]);

  // Removido objeto 'value' não utilizado para evitar erro de tipagem.

  return (
    <AuthContext.Provider
      value={{
        user,
        licenseStatus,
        isLoading,
        login,
        loginWithPin,
        logout,
        switchAccountByEmail,
        checkLicenseStatus,
        refreshLicenseStatus,
        isFirstInstallation,
        hasLocalUsers,
        isHubOnline,
      hubLastCheck,
      checkHubConnectivity,
      syncLicenseWithHub,
      licenseCacheUpdatedAt,
      licenseCacheLastChecked,
      offlineDaysLeft,
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
