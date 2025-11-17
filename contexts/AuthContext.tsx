import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  isAdmin: boolean;
  isMember: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para cargar el perfil del usuario y su organización
  const loadUserProfile = async (userId: string) => {
    try {
      // Cargar perfil de usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
        return;
      }

      if (profile) {
        setUserProfile(profile as UserProfile);

        // Cargar organización
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (orgError) {
          console.error('Error loading organization:', orgError);
          return;
        }

        if (org) {
          setOrganization(org as Organization);
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  // Función para refrescar el perfil
  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  // Efecto para escuchar cambios de autenticación
  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setOrganization(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Función para cerrar sesión
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setOrganization(null);
  };

  // Helper: determinar si es admin
  const isAdmin = userProfile?.role === 'admin';
  
  // Helper: determinar si es member
  const isMember = userProfile?.role === 'member';

  const value: AuthContextType = {
    user,
    userProfile,
    organization,
    isAdmin,
    isMember,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
