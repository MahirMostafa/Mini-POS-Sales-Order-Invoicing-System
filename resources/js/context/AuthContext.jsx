import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('Admin');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setRole(res.data.role || 'Admin');
      setPermissions(res.data.permissions || []);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoUsers = async () => {
    try {
      const res = await api.get('/auth/demo-users');
      setDemoUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchDemoUsers();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setRole(res.data.role);
      Swal.fire({
        icon: 'success',
        title: 'Logged in!',
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const quickLogin = async (userId) => {
    try {
      const res = await api.post(`/auth/quick-login/${userId}`);
      setUser(res.data.user);
      setRole(res.data.role);
      Swal.fire({
        icon: 'success',
        title: 'Switched User',
        text: res.data.message,
        timer: 1200,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc',
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      setRole(null);
    } catch (err) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      permissions,
      loading,
      demoUsers,
      login,
      quickLogin,
      logout,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
