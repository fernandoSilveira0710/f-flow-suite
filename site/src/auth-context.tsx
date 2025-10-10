import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface LicenseStatus {
  needsSetup: boolean;
  status: string;
}

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
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({ needsSetup: true, status: 'hub_unavailable' });

  // Verificar se é primeira instalação baseado no Hub
  const isFirstInstallation = async (): Promise<boolean> => {
    try {
      // Para o site institucional, sempre permitir cadastro
      // O Hub gerenciará se é primeira instalação ou não
      return true;
    } catch (error) {
      console.error('Erro ao verificar primeira instalação:', error);
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
    setLicenseStatus({ needsSetup: true, status: 'hub_unavailable' });
    localStorage.removeItem('user');
  };

  const checkLicenseStatus = async () => {
    try {
      // Site institucional não precisa verificar client-local
      // Apenas verifica se o Hub está disponível
      const response = await fetch('http://localhost:8081/health');
      if (response.ok) {
        setLicenseStatus({ needsSetup: false, status: 'hub_available' });
      } else {
        setLicenseStatus({ needsSetup: true, status: 'hub_unavailable' });
      }
    } catch (error) {
      console.error('Erro ao verificar status do Hub:', error);
      setLicenseStatus({ needsSetup: true, status: 'hub_unavailable' });
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