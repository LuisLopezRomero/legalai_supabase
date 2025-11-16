
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { updateUserProfile } from '../services/supabaseService';

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface CompleteProfileProps {
  user: User;
  onProfileComplete: () => void;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ user, onProfileComplete }) => {
  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !profession.trim()) {
      setError('Ambos campos, nombre completo y profesión, son obligatorios.');
      return;
    }

    if (!user.email) {
      setError("No se pudo encontrar el email del usuario. Por favor, intenta iniciar sesión de nuevo.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Se prepara el objeto de datos del perfil explícitamente para mayor claridad
      // y para asegurar que solo se envíen los campos correctos.
      const profileData = {
        full_name: fullName.trim(),
        profession: profession.trim(), // Se asegura de que se guarde el valor del campo 'profession'
        email: user.email,
      };
      
      await updateUserProfile(user.id, profileData);
      onProfileComplete();
    } catch (err: any) { // Usamos 'any' para poder acceder a las propiedades específicas de Supabase
      console.error("Error updating user profile:", err);
      
      // Construimos un mensaje de error más detallado
      let detailedMessage = 'Ocurrió un error desconocido al guardar el perfil.';
      if (err) {
        if (err.message) {
          detailedMessage = err.message;
        }
        if (err.details) {
          detailedMessage += ` Detalles: ${err.details}`;
        }
        if (err.hint) {
          detailedMessage += ` Sugerencia: ${err.hint}`;
        }
        if (err.code) {
          detailedMessage += ` (Código: ${err.code})`;
        }
      }
      
      setError(detailedMessage);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || !fullName.trim() || !profession.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-brand-text mb-2">Completa tu Perfil</h1>
        <p className="text-center text-brand-text-secondary mb-8">
          ¡Ya casi está! Solo necesitamos un par de datos más para personalizar tu experiencia.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Nombre Completo
              </label>
              <input
                  id="fullName"
                  className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  type="text"
                  placeholder="Ej: Ada Lovelace"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
              />
          </div>
          <div>
              <label htmlFor="profession" className="block text-sm font-medium text-brand-text-secondary mb-2">
                  Profesión
              </label>
              <input
                  id="profession"
                  className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  type="text"
                  placeholder="Ej: Analista de Sistemas"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  required
              />
          </div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinnerIcon className="w-5 h-5"/>
                Guardando...
              </>
            ) : (
              'Guardar y Continuar'
            )}
          </button>
        </form>
        {error && 
            <p className="mt-4 text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-md">
                {error}
            </p>
        }
      </div>
    </div>
  );
};

export default CompleteProfile;
