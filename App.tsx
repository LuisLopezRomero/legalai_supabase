
import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { useAuth } from './contexts/AuthContext';
import { fetchEmails, fetchCases } from './services/supabaseService';
import SidebarNav from './components/SidebarNav';
import InboxView from './components/InboxView';
import CaseManager from './components/cases/CaseManager';
import UserManagement from './components/UserManagement';
import EmailAssignments from './components/EmailAssignments';
import { Email, Case } from './types';

// El componente que contiene la aplicación principal una vez autenticado.
// Incluye la navegación lateral y el gestor de vistas (Inbox/Expedientes/Usuarios/Asignaciones).
const MainApp: React.FC<{ 
  user: User; 
  emails: Email[]; 
  cases: Case[]; 
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>; 
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
}> = ({ user, emails, cases, setEmails, setCases }) => {
  const [currentView, setCurrentView] = useState<'inbox' | 'cases' | 'users' | 'assignments'>('inbox');

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
        {currentView === 'users' && <UserManagement />}
        {currentView === 'assignments' && <EmailAssignments />}
      </div>
    </div>
  );
};

// El componente App que actúa como guardián de autenticación y perfil.
const App: React.FC = () => {
  // Use AuthContext instead of local session state
  const { user, userProfile, organization, isAdmin, loading: authLoading, signOut } = useAuth();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataLoadingError, setDataLoadingError] = useState<string | null>(null);
  
  // Carga los datos principales de la aplicación (correos y expedientes) una vez que
  // el usuario está autenticado y tiene perfil y organización.
  // Filtra según el rol: Admins ven todo, Members solo lo asignado a ellos.
  useEffect(() => {
    if (user && userProfile && organization) {
      const loadAppData = async () => {
        setDataLoading(true);
        setDataLoadingError(null);
        try {
          const [fetchedEmails, fetchedCases] = await Promise.all([
            fetchEmails(organization.id, user.id, isAdmin),
            fetchCases(organization.id, user.id, isAdmin),
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
  }, [user, userProfile, organization, isAdmin]);

  // 1. Muestra un cargador inicial mientras se verifica la autenticación.
  if (authLoading) {
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

  // 2. Si no hay usuario autenticado, muestra el formulario de autenticación.
  if (!user) {
    return <Auth />;
  }

  // 3. Si el usuario no tiene perfil o no pertenece a una organización.
  // En el nuevo sistema multi-usuario, los usuarios son creados por admins con perfil completo.
  if (!userProfile || !organization) {
    return (
      <div className="flex h-screen items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-md w-full rounded-2xl shadow-2xl p-8 border animate-fade-in" style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderColor: 'var(--color-border)' 
        }}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-brand-text mb-2">Perfil no encontrado</h2>
            <p className="text-brand-text-secondary mb-6">
              Tu cuenta aún no tiene un perfil de usuario configurado. Por favor, contacta con un administrador para que te agregue a una organización.
            </p>
            <p className="text-sm text-brand-text-secondary mb-6">
              Tu ID de usuario: <code className="bg-brand-bg px-2 py-1 rounded font-mono text-xs">{user.id}</code>
            </p>
            <button
              onClick={signOut}
              className="w-full bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
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
                      Tu ID de usuario es: <code className="bg-brand-bg p-1 rounded font-mono">{user?.id}</code>. 
                      <br/>
                      Tu organización: <code className="bg-brand-bg p-1 rounded font-mono">{organization?.name}</code>
                      <br/>
                      Tu rol: <code className="bg-brand-bg p-1 rounded font-mono">{userProfile?.role}</code>
                      <br/>
                      Verifica que este ID coincida con la columna <code className="bg-brand-bg p-1 rounded font-mono">user_id</code> en tus tablas de Supabase.
                  </p>
              </div>
          </div>
      );
  }

  // 6. Si el usuario está autenticado, tiene perfil y organización, y los datos están cargados, muestra la app principal.
  return <MainApp key={user.id} user={user} emails={emails} cases={cases} setEmails={setEmails} setCases={setCases} />;
};

export default App;
