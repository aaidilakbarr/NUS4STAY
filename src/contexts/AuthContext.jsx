import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './AuthContextValue';

const DEFAULT_ROLE = 'guest';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (nextSession) => {
    const user = nextSession?.user ?? null;

    if (!user) {
      setProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return null;
    }

    setProfileLoading(true);
    setProfileError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      const fallbackProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name ?? null,
        phone: user.phone ?? null,
        role: DEFAULT_ROLE,
        created_at: null,
      };

      setProfile(fallbackProfile);
      setProfileError(error);
      setProfileLoading(false);
      return fallbackProfile;
    }

    const nextProfile = {
      ...data,
      role: data?.role ?? DEFAULT_ROLE,
    };

    setProfile(nextProfile);
    setProfileLoading(false);
    return nextProfile;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const nextSession = data.session ?? null;
      setSession(nextSession);
      await loadProfile(nextSession);

      if (mounted) {
        setInitializing(false);
      }
    };

    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      loadProfile(nextSession ?? null).finally(() => {
        setInitializing(false);
      });
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    profileError,
    initializing,
    profileLoading,
    authLoading: initializing || profileLoading,
    isAuthenticated: Boolean(session?.user),
    hasRole: (roles) => {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(profile?.role);
    },
    refreshProfile: () => loadProfile(session),
  }), [initializing, loadProfile, profile, profileError, profileLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
