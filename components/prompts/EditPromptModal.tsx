
import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../../types';

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promptId: string, name: string, text: string, tags: string[]) => Promise<void>;
  prompt: Prompt | null;
}

const EditPromptModal: React.FC<EditPromptModalProps> = ({ isOpen, onClose, onSave, prompt }) => {
  const [promptName, setPromptName] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptTags, setPromptTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && prompt) {
      setPromptName(prompt.prompt_name || '');
      setPromptText(prompt.prompt_text || '');
      setPromptTags((prompt.prompt_tags || []).join(', '));
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen, prompt]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSave = async () => {
    if (!prompt) return;
    if (!promptText.trim()) {
      setError('El contenido del prompt no puede estar vacío.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const tagsArray = promptTags.split(',').map(tag => tag.trim()).filter(Boolean);
      await onSave(prompt.id, promptName, promptText, tagsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el prompt.');
      setIsSaving(false);
    }
  };

  if (!isOpen || !prompt) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-brand-surface w-full max-w-2xl rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        <header className="flex items-center justify-between p-4 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-text">Editar Prompt</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-border hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <main className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-prompt-name" className="block text-sm font-medium text-brand-text-secondary mb-2">
              Nombre del Prompt (opcional)
            </label>
            <input
              id="edit-prompt-name"
              type="text"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="Ej: Respuesta formal a cliente"
              className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-prompt-content" className="block text-sm font-medium text-brand-text-secondary mb-2">
              Contenido del Prompt
            </label>
            <textarea
              id="edit-prompt-content"
              rows={8}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
              placeholder="Escribe el texto de tu prompt aquí..."
            />
          </div>
          <div>
            <label htmlFor="edit-prompt-tags" className="block text-sm font-medium text-brand-text-secondary mb-2">
              Etiquetas (separadas por comas)
            </label>
            <input
              id="edit-prompt-tags"
              type="text"
              value={promptTags}
              onChange={(e) => setPromptTags(e.target.value)}
              placeholder="Ej: formal, cliente, reporte"
              className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </main>
        
        <footer className="p-4 bg-brand-bg/50 border-t border-brand-border flex justify-end items-center space-x-3">
            <button
                onClick={onClose}
                className="py-2 px-4 text-sm rounded-md text-brand-text-secondary hover:bg-brand-border transition-colors"
            >
                Cancelar
            </button>
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isSaving ? (
                    <>
                        <LoadingSpinnerIcon className="w-5 h-5"/>
                        Guardando...
                    </>
                ) : (
                    "Guardar Cambios"
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

export default EditPromptModal;