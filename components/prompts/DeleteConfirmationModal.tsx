
import React, { useEffect, useRef } from 'react';

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, isDeleting }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        ref={modalRef}
        className="bg-brand-surface w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <main className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
                <WarningIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-brand-text">{title}</h2>
            <p className="mt-2 text-sm text-brand-text-secondary">{message}</p>
        </main>
        
        <footer className="p-4 bg-brand-bg/50 border-t border-brand-border flex justify-center items-center space-x-3">
            <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="py-2 px-4 text-sm rounded-md text-brand-text-secondary hover:bg-brand-border transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="flex justify-center items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isDeleting ? (
                    <>
                        <LoadingSpinnerIcon className="w-5 h-5"/>
                        Borrando...
                    </>
                ) : (
                    "Borrar"
                )}
            </button>
        </footer>
      </div>
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DeleteConfirmationModal;
