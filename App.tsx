
import React, { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import Auth from './components/Auth';
import { fetchUserProfile, fetchEmails, fetchCases } from './services/supabaseService';
import CompleteProfile from './components/CompleteProfile';
import SidebarNav from './components/SidebarNav';
import InboxView from './components/InboxView';
import CaseManager from './components/cases/CaseManager';
import { Email, Case } from './types';

// El componente que contiene la aplicación principal una vez autenticado.
// Incluye la navegación lateral y el gestor de vistas (Inbox/Expedientes).
const MainApp: React.FC<{ 
  user: User; 
  emails: Email[]; 
  cases: Case[]; 
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>; 
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
}> = ({ user, emails, cases, setEmails, setCases }) => {
  const [currentView, setCurrentView] = useState<'inbox' | 'cases'>('inbox');

  return (
    <div className="flex h-screen font-sans" style={{ 
      backgroundColor: 'var(--color-bg)', 
      color: 'var(--color-text)' 
    }}>
      <SidebarNav 
        user={user} 
        currentView={currentView}
        onNavigate={setCurrentView}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === 'inbox' && <InboxView user={user} emails={emails} cases={cases} setEmails={setEmails} />}
        {currentView === 'cases' && <CaseManager user={user} emails={emails} cases={cases} setCases={setCases} />}
      </div>
    </div>
  );
};

// El componente App que actúa como guardián de autenticación y perfil.
const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoadingError, setDataLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndProfile = async (currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        setCheckingProfile(true);
        try {
          const profile = await fetchUserProfile(currentSession.user.id);
          // Un perfil está completo si existe y tiene nombre y profesión.
          if (profile && profile.full_name && profile.profession) {
            setProfileComplete(true);
          } else {
            setProfileComplete(false);
          }
        } catch (error) {
          console.error("Error checking profile:", error);
          setProfileComplete(false); // Asumir incompleto en caso de error
        } finally {
          setCheckingProfile(false);
        }
      } else {
        // No hay sesión, resetea estados
        setProfileComplete(false);
        setCheckingProfile(false);
      }
      setLoading(false);
    };

    // Comprueba la sesión activa al cargar la aplicación por primera vez.
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkSessionAndProfile(session);
    });

    // Escucha cambios en el estado de autenticación (login, logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSessionAndProfile(session);
    });

    // Limpia la suscripción cuando el componente se desmonta.
    return () => subscription.unsubscribe();
  }, []);
  
  // Carga los datos principales de la aplicación (correos y expedientes) una vez que
  // el usuario está autenticado y su perfil está completo.
  useEffect(() => {
    if (session && isProfileComplete) {
      const loadAppData = async () => {
        setDataLoading(true);
        setDataLoadingError(null);
        try {
          const [fetchedEmails, fetchedCases] = await Promise.all([
            fetchEmails(session.user.id),
            fetchCases(session.user.id),
          ]);
          setEmails(fetchedEmails);
          setCases(fetchedCases);
        } catch (error: any) {
          console.error("Failed to load application data:", error);
          let errorMessage = `No se pudieron cargar los datos de la aplicación. Causa probable: Las Políticas de Seguridad a Nivel de Fila (RLS) de Supabase no permiten la lectura de las tablas 'emails' o 'expedientes'. Asegúrate de tener una política SELECT activa para el usuario autenticado.`;
          if (error.message) {
              errorMessage += `\n\nDetalle técnico: ${error.message}`;
          }
          setDataLoadingError(errorMessage);
        } finally {
          setDataLoading(false);
        }
      };
      loadAppData();
    }
  }, [session, isProfileComplete]);

  const handleProfileComplete = () => {
    setProfileComplete(true);
  };

  // 1. Muestra un cargador inicial mientras se verifica la sesión.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-lg shadow-brand-primary/30 animate-pulse-subtle">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-brand-text-secondary">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  // 2. Si no hay sesión, muestra el formulario de autenticación.
  if (!session) {
    return <Auth />;
  }

  // 3. Si hay sesión, muestra un cargador mientras se verifica el perfil.
  if (checkingProfile) {
     return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-accent to-brand-primary flex items-center justify-center shadow-lg shadow-brand-accent/30 animate-pulse-subtle">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-brand-text-secondary">Verificando perfil...</p>
        </div>
      </div>
    );
  }

  // 4. Si el perfil no está completo, fuerza al usuario a completarlo.
  if (!isProfileComplete) {
    return <CompleteProfile user={session.user} onProfileComplete={handleProfileComplete} />;
  }
  
  // 5. Muestra un cargador final mientras se obtienen los datos principales de la app.
  if (dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-primary via-brand-accent to-brand-primary-hover flex items-center justify-center shadow-lg shadow-brand-primary/30 animate-pulse-subtle">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-brand-text-secondary">Cargando datos de la aplicación...</p>
        </div>
      </div>
    );
  }

  // 5.1 Si ocurre un error al cargar datos, lo muestra.
  if (dataLoadingError) {
      return (
          <div className="flex h-screen items-center justify-center p-8" style={{ background: 'var(--color-bg)' }}>
              <div className="w-full max-w-2xl bg-brand-surface rounded-lg shadow-lg p-8 text-center">
                  <h1 className="text-2xl font-bold text-red-400 mb-4">Error al Cargar Datos</h1>
                  <p className="text-brand-text-secondary whitespace-pre-wrap">{dataLoadingError}</p>
                   <p className="mt-6 text-sm text-brand-text-secondary">
                      Tu ID de usuario es: <code className="bg-brand-bg p-1 rounded font-mono">{session?.user.id}</code>. 
                      <br/>
                      Verifica que este ID coincida con la columna <code className="bg-brand-bg p-1 rounded font-mono">user_id</code> en tus tablas de Supabase.
                  </p>
              </div>
          </div>
      );
  }

  // 6. Si la sesión existe, el perfil está completo y los datos están cargados, muestra la app principal.
  return <MainApp key={session.user.id} user={session.user} emails={emails} cases={cases} setEmails={setEmails} setCases={setCases} />;
};

export default App;
