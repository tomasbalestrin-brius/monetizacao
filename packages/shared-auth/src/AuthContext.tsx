import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@bethel/shared-supabase';

// Unified roles: admin, lider, sdr, closer
// Legacy roles (manager, viewer, user) kept in enum for backward compat but mapped:
//   manager -> lider, user -> closer, viewer -> viewer (read-only)
export type AppRole = 'admin' | 'lider' | 'sdr' | 'closer' | 'manager' | 'viewer' | 'user';

// Normalized role type (only the 4 active roles)
export type NormalizedRole = 'admin' | 'lider' | 'sdr' | 'closer';

function normalizeRole(role: AppRole): NormalizedRole {
  switch (role) {
    case 'manager': return 'lider';
    case 'user': return 'closer';
    case 'viewer': return 'closer'; // viewers get closer-level access
    default: return role as NormalizedRole;
  }
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: NormalizedRole | null;
  rawRole: AppRole | null;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Role checks
  isAdmin: boolean;
  isLider: boolean;
  isSDR: boolean;
  isCloser: boolean;
  isAdminOrLider: boolean;
  // Legacy compat
  isManager: boolean;
  isUser: boolean;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [rawRole, setRawRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  const fetchUserData = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setRawRole(roleData.role as AppRole);
      }

      const { data: permData } = await supabase
        .from('module_permissions')
        .select('module')
        .eq('user_id', userId);

      if (permData) {
        setPermissions(permData.map(p => p.module));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setRawRole(null);
          setPermissions([]);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRawRole(null);
    setPermissions([]);
  };

  const role = rawRole ? normalizeRole(rawRole) : null;

  const isAdmin = role === 'admin';
  const isLider = role === 'lider';
  const isSDR = role === 'sdr';
  const isCloser = role === 'closer';
  const isAdminOrLider = isAdmin || isLider;

  // Legacy compat
  const isManager = isLider;
  const isUser = isCloser;

  const hasPermission = (module: string): boolean => {
    if (isAdmin) return true;
    if (isLider) return true; // Lider has access to all modules
    return permissions.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user, session, role, rawRole, permissions, loading,
        signIn, signUp, signOut,
        isAdmin, isLider, isSDR, isCloser, isAdminOrLider,
        isManager, isUser, hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
