
import React from 'react';
import { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (email: Email) => void;
  onDeleteEmail: (email: Email) => void;
  isLoading: boolean;
  totalEmailCount: number;
}

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const EmailListItem: React.FC<{ email: Email; isSelected: boolean; onSelect: () => void; onDelete: (email: Email) => void }> = ({ email, isSelected, onSelect, onDelete }) => {
  const receivedDate = email.received_at ? new Date(email.received_at) : new Date();
  const formattedDate = receivedDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <li
      onClick={onSelect}
      className={`group p-4 border-b cursor-pointer transition-all duration-300 flex justify-between items-start gap-2 relative overflow-hidden ${
        isSelected 
          ? 'bg-gradient-to-r from-brand-primary to-brand-primary-hover shadow-lg shadow-brand-primary/20 scale-[1.02]' 
          : 'hover:scale-[1.01] hover:shadow-md'
      }`}
      style={!isSelected ? { 
        borderColor: 'var(--color-border)',
        backgroundColor: 'transparent'
      } : {
        borderColor: 'var(--color-border)'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
      )}
      <div className="flex-1 min-w-0 relative z-10">
          <div className="flex justify-between items-center text-sm mb-1">
            <p className={`font-semibold truncate transition-colors duration-300 ${isSelected ? 'text-white' : 'text-brand-text group-hover:text-brand-primary-light'}`}>{email.sender || 'Sin remitente'}</p>
            <p className={`text-xs transition-colors duration-300 ${isSelected ? 'text-blue-100' : 'text-brand-text-muted'}`}>{formattedDate}</p>
          </div>
          <p className={`font-medium truncate transition-colors duration-300 ${isSelected ? 'text-white' : 'text-brand-text-secondary'}`}>{email.subject || 'Sin asunto'}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Evita que se seleccione el email al borrarlo
          onDelete(email);
        }}
        className="relative z-10 p-2 -mr-2 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-300 text-brand-text-secondary hover:bg-brand-danger/20 hover:text-brand-danger-light hover:scale-110 hover:rotate-12"
        aria-label={`Borrar email de ${email.sender}`}
        title={`Borrar email de ${email.sender}`}
      >
        <TrashIcon className="w-5 h-5"/>
      </button>
    </li>
  );
};

const EmailList: React.FC<EmailListProps> = ({ emails, selectedEmailId, onSelectEmail, onDeleteEmail, isLoading, totalEmailCount }) => {

  const renderContent = () => {
    if (isLoading) {
      return <div className="p-4 text-center text-brand-text-secondary">Loading emails...</div>;
    }
  
    if (emails.length === 0) {
      if (totalEmailCount === 0) {
        return (
          <div className="p-4 text-center text-brand-text-secondary">
            <h3 className="font-semibold text-brand-text">Bandeja de entrada vacía</h3>
            <p className="mt-2 text-sm">No se encontraron correos para tu cuenta.</p>
            <p className="mt-2 text-xs">
              Verifica que la tabla <code className="bg-brand-bg p-1 rounded font-mono">emails</code> en Supabase contenga registros asociados a tu ID de usuario y que las políticas de RLS permitan la lectura (SELECT).
            </p>
          </div>
        );
      } else {
        return <div className="p-4 text-center text-brand-text-secondary">No hay correos que coincidan con el filtro actual.</div>;
      }
    }
  
    return (
      <ul className="overflow-y-auto">
        {emails.map((email, index) => (
          <div 
            key={email.id} 
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
          >
            <EmailListItem
              email={email}
              isSelected={email.id === selectedEmailId}
              onSelect={() => onSelectEmail(email)}
              onDelete={onDeleteEmail}
            />
          </div>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {renderContent()}
    </div>
  );
};

export default EmailList;
