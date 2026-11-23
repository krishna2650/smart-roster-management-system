import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('datastraw_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('datastraw_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('datastraw_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('datastraw_token', res.data.token);
      localStorage.setItem('datastraw_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const loginAsDemo = async (role) => {
    const credentials = {
      ADMIN: { email: 'admin@datastraw.com', password: 'admin123' },
      OPERATIONS_MANAGER: { email: 'manager@datastraw.com', password: 'manager123' },
      POD_LEAD: { email: 'podlead@datastraw.com', password: 'lead123' }
    };
    const cred = credentials[role] || credentials.OPERATIONS_MANAGER;
    return await login(cred.email, cred.password);
  };

  const logout = () => {
    localStorage.removeItem('datastraw_token');
    localStorage.removeItem('datastraw_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
