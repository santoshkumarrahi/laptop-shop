import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  switchAccount: (role: 'super_admin' | 'product_manager' | 'customer_support' | 'customer') => Promise<void>;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageInventory: boolean;
  canManageUsers: boolean;
  isSuperAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage if present
    const savedUser = localStorage.getItem('nextech_user');
    const savedToken = localStorage.getItem('nextech_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (e) {
        localStorage.removeItem('nextech_user');
        localStorage.removeItem('nextech_token');
      }
    } else {
      // Default initial mock login to Super Admin for immediate full testability
      switchAccount('super_admin');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('nextech_user', JSON.stringify(res.user));
    localStorage.setItem('nextech_token', res.token);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await api.register({ name, email, password, phone });
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('nextech_user', JSON.stringify(res.user));
    localStorage.setItem('nextech_token', res.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nextech_user');
    localStorage.removeItem('nextech_token');
  };

  // Instant switch helper for testing different roles requested in specs
  const switchAccount = async (role: 'super_admin' | 'product_manager' | 'customer_support' | 'customer') => {
    let email = 'admin@nextech.com';
    let password = 'admin123';
    if (role === 'product_manager') {
      email = 'products@nextech.com';
      password = 'password123';
    } else if (role === 'customer_support') {
      email = 'support@nextech.com';
      password = 'password123';
    } else if (role === 'customer') {
      email = 'alex.customer@example.com';
      password = 'customer123';
    }

    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('nextech_user', JSON.stringify(res.user));
      localStorage.setItem('nextech_token', res.token);
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    }
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const canManageProducts = isSuperAdmin || user?.role === 'product_manager';
  const canManageOrders = isSuperAdmin || user?.role === 'order_manager' || user?.role === 'customer_support';
  const canManageInventory = isSuperAdmin || user?.role === 'inventory_manager' || user?.role === 'product_manager';
  const canManageUsers = isSuperAdmin;
  const isStaff = user?.role !== 'customer' && !!user?.role;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchAccount,
        canManageProducts,
        canManageOrders,
        canManageInventory,
        canManageUsers,
        isSuperAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
