import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  displayName: string;
}

type LicenseStatus = 'valid' | 'invalid' | 'expired' | 'not_found';

interface AuthContextType {
  user: User | null;
  licenseStatus: LicenseStatus;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkLicenseStatus: () => Promise<void>;
  isFirstInstallation: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>('not_found');

  // Verificar se é primeira instalação baseado na contagem de usuários no client-local
  const isFirstInstallation = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:3002/users');
      if (!response.ok) {
        // Se não conseguir conectar ao client-local, assume que é primeira instalação
        return true;
      }
      
      const users = await response.json();
      // Se não há usuários cadastrados, é primeira instalação
      return !users || users.length === 0;
    } catch (error) {
      console.error('Erro ao verificar primeira instalação:', error);
      // Em caso de erro, assume que é primeira instalação
      return true;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulação de login - em produção, isso seria uma chamada real para API
      if (email && password) {
        const mockUser: User = {
          id: '1',
          email,
          displayName: email.split('@')[0],
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        // Verificar licença após login
        await checkLicenseStatus();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setLicenseStatus('not_found');
    localStorage.removeItem('user');
  };

  const checkLicenseStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/licensing/install-status');
      if (response.ok) {
        const data = await response.json();
        if (data.hasLicense && data.isInstalled) {
          setLicenseStatus('valid');
        } else {
          setLicenseStatus('invalid');
        }
      } else {
        setLicenseStatus('not_found');
      }
    } catch (error) {
      console.error('Erro ao verificar licença:', error);
      setLicenseStatus('not_found');
    }
  };

  // Verificar usuário salvo no localStorage na inicialização
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        checkLicenseStatus();
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const value: AuthContextType = {
    user,
    licenseStatus,
    login,
    logout,
    checkLicenseStatus,
    isFirstInstallation,
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