import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
        const resp = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (!resp.ok) throw new Error('Auth failed');

        const data = await resp.json();
        setUser(data);
        setToken(savedToken);
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('authToken');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
