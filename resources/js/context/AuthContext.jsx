import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setRole(res.data.role);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      setUser(null);
      setRole(null);
      setPermissions([]);
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
      setPermissions(res.data.permissions || []);
      Swal.fire({
        icon: 'success',
        title: 'Logged in!',
        text: res.data.message,
        timer: 1500,
        showConfirmButton: false,
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
      setPermissions(res.data.permissions || []);
      Swal.fire({
        icon: 'success',
        title: 'Switched User',
        text: res.data.message,
        timer: 1200,
        showConfirmButton: false,
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
      setPermissions([]);
    } catch (err) {
      setUser(null);
      setRole(null);
      setPermissions([]);
    }
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (role === 'Admin') return true;
    if (Array.isArray(perm)) {
      return perm.some((p) => permissions.includes(p));
    }
    return permissions.includes(perm);
  };

  const canAccessRoute = (allowedRoles = [], requiredPermissions = []) => {
    if (!user) return false;
    if (role === 'Admin') return true;

    // If specific permissions are required, user MUST have at least one of them
    if (requiredPermissions.length > 0) {
      const hasRequiredPerm = requiredPermissions.some((p) => permissions.includes(p));
      if (!hasRequiredPerm) {
        return false;
      }
    }

    // If role restriction is specified, user must also match an allowed role
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return false;
    }

    return true;
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
      hasPermission,
      canAccessRoute,
      refreshUser: fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
