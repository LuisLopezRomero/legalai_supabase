
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    
    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    // State for errors and messages
    const [error, setError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Password validation effect
    useEffect(() => {
        if (!isSignUp) {
            setPasswordError(null);
            return;
        }

        if (!password && !repeatPassword) {
            setPasswordError(null);
            return;
        }

        if (password.length < 6) {
            setPasswordError("La contraseña debe tener al menos 6 caracteres.");
        } else if (repeatPassword && password !== repeatPassword) {
            setPasswordError("Las contraseñas no coinciden.");
        } else {
            setPasswordError(null);
        }
    }, [password, repeatPassword, isSignUp]);

    const handleAuthAction = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (isSignUp) {
            try {
                if (passwordError) {
                    throw new Error(passwordError);
                }

                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) throw signUpError;

                setMessage('¡Registro exitoso! Por favor, revisa tu correo para verificar tu cuenta.');

            } catch (authError: any) {
                setError(authError.error_description || authError.message);
            } finally {
                setLoading(false);
            }
        } else { // Sign In logic
            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                // The onAuthStateChange listener in App.tsx will handle the successful login.
            } catch (signInError: any) {
                setError(signInError.error_description || signInError.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const isSubmitDisabled = loading || (isSignUp && (!email || !password || !!passwordError));

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
            <div className="w-full max-w-md bg-brand-surface rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold text-center text-brand-text mb-2">
                    {isSignUp ? 'Crear una Cuenta' : 'Iniciar Sesión'}
                </h1>
                <p className="text-center text-brand-text-secondary mb-8">
                    {isSignUp ? 'Bienvenido. Ingresa tus datos para registrarte.' : 'Bienvenido de nuevo. Ingresa a tu cuenta.'}
                </p>
                
                <form onSubmit={handleAuthAction} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-2">
                            Dirección de Email
                        </label>
                        <input
                            id="email"
                            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-2">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {isSignUp && (
                         <div>
                            <label htmlFor="repeat-password" className="block text-sm font-medium text-brand-text-secondary mb-2">
                                Repetir Contraseña
                            </label>
                            <input
                                id="repeat-password"
                                className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                type="password"
                                placeholder="••••••••"
                                value={repeatPassword}
                                onChange={(e) => setRepeatPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    
                    {passwordError && <p className="text-xs text-yellow-400">{passwordError}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinnerIcon className="w-5 h-5"/>
                                Procesando...
                            </>
                        ) : (
                            isSignUp ? 'Registrarse' : 'Iniciar Sesión'
                        )}
                    </button>
                </form>

                {error && <p className="mt-4 text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                {message && <p className="mt-4 text-center text-sm text-green-300 bg-green-900/50 p-3 rounded-md">{message}</p>}

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                            setPasswordError(null);
                        }}
                        className="text-sm text-brand-primary hover:underline"
                    >
                        {isSignUp ? '¿Ya tienes una cuenta? Inicia Sesión' : '¿No tienes una cuenta? Regístrate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
