import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

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
  isFirstInstallation: () => Promise<boolean>;
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
    try {
      // Usar fetch com configurações específicas para o proxy
      const statusResponse = await fetch('/licensing/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Status request failed: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      
      const installResponse = await fetch('/licensing/install-status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!installResponse.ok) {
        throw new Error(`Install status request failed: ${installResponse.status}`);
      }
      
      const installData = await installResponse.json();
      
      setLicenseStatus({
        isValid: statusData.isValid || false,
        isInstalled: installData.isInstalled || false,
        plan: statusData.plan,
        expiresAt: statusData.expiresAt
      });
    } catch (error) {
      console.error('Erro ao verificar status da licença:', error);
      setLicenseStatus({
        isValid: false,
        isInstalled: false
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simular autenticação (em produção, seria uma chamada real para API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email && password) {
        const userData: User = {
          id: '1',
          email,
          name: email.split('@')[0]
        };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        // Verificar licença após login
        await checkLicenseStatus();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLicenseStatus(null);
    localStorage.removeItem('auth_user');
    navigate('/erp/login');
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const isFirstInstallation = async (): Promise<boolean> => {
    try {
      // Verificar se há usuários cadastrados no client-local
      const response = await fetch('http://localhost:3010/users');
      if (!response.ok) {
        // Se não conseguir acessar o endpoint, assumir primeira instalação
        return true;
      }
      
      const users = await response.json();
      // Se não há usuários cadastrados, é primeira instalação
      return !users || users.length === 0;
    } catch (error) {
      console.error('Erro ao verificar primeira instalação:', error);
      // Em caso de erro, assumir primeira instalação para ser mais seguro
      return true;
    }
  };

  const value: AuthContextType = {
    user,
    licenseStatus,
    isLoading,
    login,
    logout,
    checkLicenseStatus,
    isFirstInstallation
  };

  return (
    <AuthContext.Provider value={value}>
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