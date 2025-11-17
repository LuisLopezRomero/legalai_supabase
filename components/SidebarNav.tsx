
import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import ThemeToggle from './ThemeToggle';

interface SidebarNavProps {
    user: User;
    currentView: 'inbox' | 'cases';
    onNavigate: (view: 'inbox' | 'cases') => void;
}

const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86a2.25 2.25 0 0 0 2.25 2.25h3.86a2.25 2.25 0 0 0 2.25-2.25v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86m-16.5 0h3.86a2.25 2.25 0 0 0 2.25-2.25v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86a2.25 2.25 0 0 0 2.25 2.25h3.86m-16.5 0v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86" />
    </svg>
);

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.02a2.25 2.25 0 0 1-2.25 2.25H6.012A2.25 2.25 0 0 1 3.75 18.17V10.34a2.25 2.25 0 0 1 .882-1.763l6-4.5a2.25 2.25 0 0 1 2.736 0l6 4.5a2.25 2.25 0 0 1 .882 1.763v3.81Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75V6.75a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 7.5 6.75v3" />
    </svg>
);


const SignOutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
);

const NavButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ label, isActive, onClick, children }) => (
    <button
        onClick={onClick}
        title={label}
        className={`w-full flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
            isActive 
                ? 'bg-gradient-to-br from-brand-primary to-brand-primary-hover text-white shadow-lg shadow-brand-primary/30' 
                : 'text-brand-text-secondary hover:bg-brand-surface-hover hover:text-brand-text hover:scale-105'
        }`}
    >
        {isActive && (
            <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        )}
        <span className={`transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>
            {children}
        </span>
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);


const SidebarNav: React.FC<SidebarNavProps> = ({ user, currentView, onNavigate }) => {
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const copyUserId = () => {
        navigator.clipboard.writeText(user.id).catch(err => {
            console.error('Failed to copy User ID:', err);
        });
    }

    return (
        <aside className="w-24 border-r flex flex-col items-center justify-between p-2 animate-fade-in" style={{ 
            backgroundColor: 'var(--color-bg)', 
            borderColor: 'var(--color-border)' 
        }}>
            <nav className="w-full space-y-2">
                <NavButton label="Inbox" isActive={currentView === 'inbox'} onClick={() => onNavigate('inbox')}>
                    <InboxIcon className="w-6 h-6" />
                </NavButton>
                <NavButton label="Expedientes" isActive={currentView === 'cases'} onClick={() => onNavigate('cases')}>
                    <BriefcaseIcon className="w-6 h-6" />
                </NavButton>
            </nav>

            <div className="w-full flex flex-col items-center space-y-2">
                <div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-brand-primary/50 transition-all duration-300 hover-glow" 
                    title={`Usuario: ${user.email}\nID: ${user.id}\n(Click para copiar ID)`}
                    onClick={copyUserId}
                >
                    {user.email ? user.email.charAt(0).toUpperCase() : '?'}
                </div>
                
                <ThemeToggle />
                
                <button
                    onClick={handleSignOut}
                    title="Cerrar Sesión"
                    className="w-full flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-300 text-brand-text-secondary hover:bg-brand-danger/10 hover:text-brand-danger-light hover:scale-105 group"
                >
                    <span className="transition-transform duration-300 group-hover:scale-110">
                        <SignOutIcon className="w-6 h-6" />
                    </span>
                    <span className="text-xs mt-1 font-medium">Salir</span>
                </button>
            </div>
        </aside>
    );
};

export default SidebarNav;
