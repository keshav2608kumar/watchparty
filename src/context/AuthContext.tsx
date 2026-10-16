import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/room';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile;
  loading: boolean;
  loginAsGuest: (customName?: string) => void;
  updateDisplayName: (name: string) => void;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const GUEST_SESSION_KEY = 'watchparty_tab_profile';
const PREFERRED_NAME_KEY = 'watchparty_preferred_name';

function generateGuestProfile(customName?: string): UserProfile {
  let preferredName = customName;
  if (!preferredName) {
    try {
      preferredName = localStorage.getItem(PREFERRED_NAME_KEY) || undefined;
    } catch {}
  }

  const randomNum = Math.floor(100 + Math.random() * 900);
  const name = preferredName || `Viewer #${randomNum}`;
  const id = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    name,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}&backgroundColor=0f172a`,
    isGuest: true,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    // Check sessionStorage for current tab identity
    try {
      const saved = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    const fresh = generateGuestProfile();
    try {
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(fresh));
    } catch {}
    return fresh;
  });

  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Check Supabase active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}&backgroundColor=0f172a`,
          isGuest: false,
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}&backgroundColor=0f172a`,
          isGuest: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsGuest = (customName?: string) => {
    const profile = generateGuestProfile(customName);
    setUser(profile);
    try {
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(profile));
      if (customName) {
        localStorage.setItem(PREFERRED_NAME_KEY, customName);
      }
    } catch {}
  };

  const updateDisplayName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const updated = { ...user, name: trimmed };
    setUser(updated);
    try {
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updated));
      localStorage.setItem(PREFERRED_NAME_KEY, trimmed);
    } catch {}
  };

  const signInWithEmail = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      return { error: new Error('Supabase is not configured yet. Running in local guest mode.') };
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    const guest = generateGuestProfile();
    setUser(guest);
    try {
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guest));
      localStorage.removeItem(PREFERRED_NAME_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginAsGuest,
        updateDisplayName,
        signInWithEmail,
        signOut,
        isSupabaseAuth: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
