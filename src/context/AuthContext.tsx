import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  isAuthenticated: boolean;
  /** Supabase 已从本地恢复/校验 Session 之前为 true */
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applySessionUser = (session: Session | null) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const u = session.user;
      const username =
        (u.user_metadata?.username as string | undefined) || u.email?.split('@')[0] || 'geek';
      setUser({
        id: u.id,
        username,
        email: u.email || '',
      });
    };

    const boot = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;
        if (error) {
          console.warn('getSession:', error.message);
          setUser(null);
          return;
        }
        applySessionUser(data.session);
      } catch (e) {
        console.error('Auth session restore error:', e);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void boot();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      applySessionUser(session);
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message || '登录失败');
    if (!data.user) throw new Error('登录失败');
    const username =
      (data.user.user_metadata?.username as string | undefined) ||
      data.user.email?.split('@')[0] ||
      'geek';
    setUser({
      id: data.user.id,
      username,
      email: data.user.email || '',
    });
    toast.success('欢迎回来！');
  };

  const register = async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw new Error(error.message || '注册失败');
    if (data.user) {
      setUser({
        id: data.user.id,
        username,
        email: data.user.email || email,
      });
    }
    toast.success('注册成功！');
  };

  const logout = async (silent = false) => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    const wasAuthenticated = !!user;
    setUser(null);
    if (!silent && wasAuthenticated) {
      toast.info('已退出登录');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
