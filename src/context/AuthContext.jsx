import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseOffline, setSupabaseOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // Safety fallback timer: Ensure UI ALWAYS loads even if Supabase DNS fails or hangs
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[AuthContext] Supabase auth timed out (offline or paused). Releasing UI render lock.');
        setSupabaseOffline(true);
        setLoading(false);
      }
    }, 1200);

    // Check active sessions
    if (supabase && supabase.auth) {
      supabase.auth.getSession()
        .then(({ data }) => {
          if (mounted) {
            clearTimeout(safetyTimer);
            setUser(data?.session?.user ?? null);
            setLoading(false);
          }
        })
        .catch(err => {
          if (mounted) {
            clearTimeout(safetyTimer);
            console.warn('[AuthContext] Supabase connection failed (Project may be paused):', err?.message || err);
            setSupabaseOffline(true);
            setLoading(false);
          }
        });

      // Listen for changes on auth state
      try {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (mounted) {
            clearTimeout(safetyTimer);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });

        return () => {
          mounted = false;
          clearTimeout(safetyTimer);
          if (authListener?.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (listenerErr) {
        console.warn('[AuthContext] Failed to attach auth state listener:', listenerErr);
      }
    } else {
      clearTimeout(safetyTimer);
      setLoading(false);
    }

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const value = {
    signUp: (data) => supabase ? supabase.auth.signUp(data) : Promise.reject(new Error("Supabase offline")),
    signIn: (data) => supabase ? supabase.auth.signInWithPassword(data) : Promise.reject(new Error("Supabase offline")),
    signOut: () => supabase ? supabase.auth.signOut() : Promise.resolve(),
    user,
    loading,
    supabaseOffline
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

