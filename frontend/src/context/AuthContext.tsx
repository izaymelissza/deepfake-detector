import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};

const API_URL = 'http://localhost:8000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);

  // ÚJ: Token betöltése és axios config oldal betöltéskor
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Állítsd be az axios default header-t!
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(token);
      console.log('✓ Token loaded from localStorage:', token.substring(0, 20) + '...');
    }
  }, []);

  const register = async (email: string, username: string, password: string) => {
    const response = await axios.post(`${API_URL}/register`, { email, username, password });
    const token = response.data.access_token;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(token);
    
    console.log('✓ Registered and token set');
  };

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await axios.post(`${API_URL}/login`, formData);
    const token = response.data.access_token;
    
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(token);
    
    console.log('✓ Logged in and token set');
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    console.log('✓ Logged out and token cleared');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};