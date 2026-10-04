import React, { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('swp_user') || localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (emailOrUser, passwordOrToken) => {
    // If called with (email, password)
    if (typeof emailOrUser === 'string' && typeof passwordOrToken === 'string' && !passwordOrToken.startsWith('ey')) {
      setLoading(true);
      try {
        const res = await api.post('/auth/login', { email: emailOrUser, password: passwordOrToken });
        const data = res.data;
        localStorage.setItem('swp_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('swp_user', JSON.stringify(data));
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        return data;
      } finally {
        setLoading(false);
      }
    } else {
      // If called with (userObj, tokenStr)
      const userData = emailOrUser;
      const token = passwordOrToken;
      localStorage.setItem('swp_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('swp_user', JSON.stringify(userData));
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const resData = res.data;
      localStorage.setItem('swp_token', resData.token);
      localStorage.setItem('token', resData.token);
      localStorage.setItem('swp_user', JSON.stringify(resData));
      localStorage.setItem('user', JSON.stringify(resData));
      setUser(resData);
      return resData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('swp_token');
    localStorage.removeItem('token');
    localStorage.removeItem('swp_user');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isBranchManager = user?.role === 'BRANCH_MANAGER_ADMIN' || user?.role === 'BRANCH_MANAGER';
  const isCustomer = user?.role === 'CUSTOMER';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      isAdmin,
      isBranchManager,
      isCustomer,
      branchId: user?.branchId
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
