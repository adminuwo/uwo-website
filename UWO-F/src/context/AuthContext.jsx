import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('uwo_token') || localStorage.getItem('partner_token') || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('uwo_user') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [role, setRole] = useState(() => localStorage.getItem('uwo_role') || null);

  const login = (newToken, newUser, newRole = 'partner') => {
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);
    if (newRole === 'admin') {
      localStorage.setItem('uwo_token', newToken);
    } else {
      localStorage.setItem('partner_token', newToken);
    }
    localStorage.setItem('uwo_user', JSON.stringify(newUser));
    localStorage.setItem('uwo_role', newRole);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    localStorage.removeItem('uwo_token');
    localStorage.removeItem('partner_token');
    localStorage.removeItem('uwo_user');
    localStorage.removeItem('uwo_role');
  };

  return (
    <AuthContext.Provider value={{ token, user, role, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
