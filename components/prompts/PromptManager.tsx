
import React, { useState, useEffect, useMemo } from 'react';
import { Prompt } from '../../types';
import { User } from '@supabase/supabase-js';
import { fetchPrompts, savePrompt, updatePrompt, deletePrompt } from '../../services/supabaseService';
import NewPromptModal from './NewPromptModal';
import EditPromptModal from './EditPromptModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface PromptManagerProps {
  user: User;
  onPromptSelect: (text: string) => void;
  initialPromptText: string;
}

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const StarIcon: React.FC<{ className?: string; isFilled?: boolean }> = ({ className, isFilled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);


const PromptManager: React.FC<PromptManagerProps> = ({ user, onPromptSelect, initialPromptText }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const userPrompts = await fetchPrompts(user.id);
        setPrompts(userPrompts);
      } catch (err) {
        console.error("Error fetching prompts:", err);
        setError("No se pudieron cargar los prompts.");
      } finally {
        setIsLoading(false);
      }
    };
    loadPrompts();
  }, [user.id]);
  
  const filteredPrompts = useMemo(() => {
    if (!searchQuery) return prompts;
    
    const query = searchQuery.toLowerCase();
    return prompts.filter(p => {
        const nameMatch = p.prompt_name?.toLowerCase().includes(query);
        const textMatch = p.prompt_text.toLowerCase().includes(query);
        const tagsMatch = p.prompt_tags?.some(tag => tag.toLowerCase().includes(query));
        return nameMatch || textMatch || tagsMatch;
    });
  }, [searchQuery, prompts]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promptId = e.target.value;
    setSelectedPromptId(promptId);
    
    if (promptId === '') { // "Custom prompt" option
      onPromptSelect(initialPromptText);
      return;
    }

    const selected = prompts.find(p => p.id === promptId);
    if (selected) {
      onPromptSelect(selected.prompt_text);
    }
  };

  const handleSaveNewPrompt = async (name: string, text: string, tags: string[]) => {
    const newPrompt = await savePrompt({
      user_id: user.id,
      prompt_name: name.trim() || null,
      prompt_text: text.trim(),
      prompt_tags: tags.length > 0 ? tags : null,
    });
    const updatedPrompts = [newPrompt, ...prompts];
    setPrompts(updatedPrompts);
    setSelectedPromptId(newPrompt.id); 
    onPromptSelect(newPrompt.prompt_text);
    setIsNewModalOpen(false);
  };

  const handleOpenEditModal = () => {
    const prompt = prompts.find(p => p.id === selectedPromptId);
    if (prompt) {
        setPromptToEdit(prompt);
        setIsEditModalOpen(true);
    }
  };

  const handleUpdatePrompt = async (promptId: string, name: string, text: string, tags: string[]) => {
    const updatedPrompt = await updatePrompt(promptId, user.id, {
      prompt_name: name.trim() || null,
      prompt_text: text.trim(),
      prompt_tags: tags.length > 0 ? tags : null,
    });
    setPrompts(prompts.map(p => p.id === promptId ? updatedPrompt : p));
    onPromptSelect(updatedPrompt.prompt_text);
    setIsEditModalOpen(false);
  };

  const handleDeletePrompt = async () => {
    if (!selectedPromptId) return;
    setIsDeleting(true);
    try {
        await deletePrompt(selectedPromptId, user.id);
        setPrompts(prompts.filter(p => p.id !== selectedPromptId));
        setSelectedPromptId('');
        onPromptSelect(initialPromptText);
    } catch (err) {
        console.error("Error deleting prompt:", err);
        setError("No se pudo borrar el prompt.");
    } finally {
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
    }
  };

  const handleToggleFavorite = async () => {
    const originalPrompts = [...prompts];
    const prompt = prompts.find(p => p.id === selectedPromptId);
    if (!prompt) return;

    // Optimistic update
    const updatedPrompts = prompts.map(p => 
        p.id === selectedPromptId ? { ...p, is_favorite: !p.is_favorite } : p
    );
    // Re-sort locally
    updatedPrompts.sort((a, b) => {
        if (a.is_favorite && !b.is_favorite) return -1;
        if (!a.is_favorite && b.is_favorite) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setPrompts(updatedPrompts);

    try {
        await updatePrompt(prompt.id, user.id, { is_favorite: !prompt.is_favorite });
    } catch (err) {
        console.error("Failed to update favorite status:", err);
        setError("No se pudo actualizar el favorito.");
        setPrompts(originalPrompts); // Revert on error
    }
  };


  const selectedPrompt = useMemo(() => prompts.find(p => p.id === selectedPromptId), [selectedPromptId, prompts]);

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>
  }

  return (
    <div className="space-y-4">
      <input 
        type="text"
        placeholder="Buscar en prompts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
      />
      <div>
        <select
          value={selectedPromptId}
          onChange={handleSelectChange}
          disabled={isLoading}
          className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none disabled:opacity-50"
        >
          <option value="">-- Prompt Personalizado --</option>
          {isLoading ? (
            <option disabled>Cargando prompts...</option>
          ) : (
            filteredPrompts.map(p => (
              <option key={p.id} value={p.id}>
                {p.is_favorite ? '★ ' : ''}{p.prompt_name || `Prompt (${p.id.substring(0, 6)}...)`}
              </option>
            ))
          )}
        </select>
        {selectedPrompt && (
          <div className="mt-2 px-1">
            <p className="text-sm text-brand-text-secondary break-words">
                <span className="font-semibold text-brand-text">Nombre:</span> {selectedPrompt.prompt_name || <span className="italic">Sin nombre</span>}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 text-sm bg-brand-surface border border-brand-border text-brand-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors duration-200 py-2 px-3 rounded-md"
          title="Crear nuevo prompt"
        >
            <PlusCircleIcon className="w-5 h-5"/>
            <span className="hidden sm:inline">Nuevo</span>
        </button>
         {selectedPromptId && (
            <>
                <div className="h-4 w-px bg-brand-border mx-1"></div>
                <button
                    onClick={handleToggleFavorite}
                    className={`flex-shrink-0 p-2 bg-brand-surface border border-brand-border rounded-md transition-colors ${
                        selectedPrompt?.is_favorite 
                        ? 'text-yellow-400 border-yellow-500 hover:bg-yellow-900/50' 
                        : 'text-brand-text-secondary hover:border-yellow-500 hover:text-yellow-500'
                    }`}
                    title={selectedPrompt?.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                >
                    <StarIcon className="w-5 h-5" isFilled={selectedPrompt?.is_favorite}/>
                </button>
                <button
                    onClick={handleOpenEditModal}
                    className="flex-shrink-0 p-2 text-brand-text-secondary bg-brand-surface border border-brand-border rounded-md hover:border-blue-500 hover:text-blue-500 transition-colors"
                    title="Editar prompt seleccionado"
                >
                    <PencilIcon className="w-5 h-5"/>
                </button>
                <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex-shrink-0 p-2 text-brand-text-secondary bg-brand-surface border border-brand-border rounded-md hover:border-red-500 hover:text-red-500 transition-colors"
                    title="Borrar prompt seleccionado"
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </>
        )}
      </div>

      <NewPromptModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveNewPrompt}
      />
      <EditPromptModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdatePrompt}
        prompt={promptToEdit}
      />
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePrompt}
        title="Confirmar borrado"
        message={`¿Estás seguro de que quieres borrar este prompt? Esta acción no se puede deshacer.`}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default PromptManager;
