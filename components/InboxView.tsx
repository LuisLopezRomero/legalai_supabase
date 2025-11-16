
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Email, Attachment, Case } from '../types';
import { fetchAttachmentsForEmail, deleteEmail, updateEmailAndAttachmentsCase, uploadAttachment } from '../services/supabaseService';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import AIPanel from './AIPanel';
import ResponseModal from './ResponseModal';
import DeleteConfirmationModal from './prompts/DeleteConfirmationModal';

interface InboxViewProps {
  user: User;
  emails: Email[];
  cases: Case[];
  setEmails: React.Dispatch<React.SetStateAction<Email[]>>;
}

const InboxView: React.FC<InboxViewProps> = ({ user, emails, cases, setEmails }) => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [loadingAttachments, setLoadingAttachments] = useState<boolean>(false);
  
  const [error, setError] = useState<string | null>(null);
  const [generatedResponseHtml, setGeneratedResponseHtml] = useState<string | null>(null);

  const [emailToDelete, setEmailToDelete] = useState<Email | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unassigned' | string>('all');
  
  const filteredEmails = useMemo(() => {
    if (activeFilter === 'all') {
        return emails;
    }
    if (activeFilter === 'unassigned') {
        return emails.filter(email => !email.expediente_id);
    }
    return emails.filter(email => email.expediente_id === activeFilter);
  }, [emails, activeFilter]);

  // Soluciona el error de desincronización de la UI.
  // Si el email seleccionado ya no está en la lista de emails filtrados (por ejemplo, porque se le
  // asignó/quitó un expediente y el filtro está activo), lo deseleccionamos para evitar
  // que el panel de detalle muestre un elemento que ya no está en la lista.
  useEffect(() => {
    if (selectedEmail && !filteredEmails.find(e => e.id === selectedEmail.id)) {
        setSelectedEmail(null);
        setAttachments([]);
    }
  }, [filteredEmails, selectedEmail]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveFilter(e.target.value);
    setSelectedEmail(null);
    setAttachments([]);
  };

  const headerTitle = useMemo(() => {
    if (activeFilter === 'all') return 'Bandeja de Entrada';
    if (activeFilter === 'unassigned') return 'Correos sin Asignar';
    const selectedCase = cases.find(c => c.id === activeFilter);
    return selectedCase ? `Expediente: ${selectedCase.titulo_asunto}` : 'Bandeja de Entrada';
  }, [activeFilter, cases]);

  const handleSelectEmail = async (email: Email) => {
    if (selectedEmail?.id === email.id) return;
    
    setSelectedEmail(email);
    setAttachments([]);
    
    try {
      setError(null);
      setLoadingAttachments(true);
      const fetchedAttachments = await fetchAttachmentsForEmail(email.id);
      setAttachments(fetchedAttachments);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to fetch attachments for email ${email.id}.`);
      console.error(err);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleDeleteRequest = (email: Email) => {
    setEmailToDelete(email);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!emailToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await deleteEmail(emailToDelete.id);
      setEmails(prevEmails => prevEmails.filter(e => e.id !== emailToDelete.id));
      if (selectedEmail?.id === emailToDelete.id) {
        setSelectedEmail(null);
        setAttachments([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete email.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setEmailToDelete(null);
    }
  };

  const handleAssignCase = async (emailId: string, caseId: string | null) => {
    try {
      await updateEmailAndAttachmentsCase(emailId, caseId);
      
      const updatedEmails = emails.map(e => e.id === emailId ? { ...e, expediente_id: caseId } : e);
      setEmails(updatedEmails);
      
      // Si el email modificado es el que está seleccionado, actualizamos también
      // el estado local 'selectedEmail' para que el detalle refleje el cambio instantáneamente.
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, expediente_id: caseId } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign case.');
    }
  };

  const handleEmailFileUpload = async (files: FileList) => {
    if (!files || !selectedEmail || !selectedEmail.expediente_id) return;
    
    const filesToUpload = Array.from(files);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
        const newAttachments = await uploadAttachment(filesToUpload, selectedEmail.expediente_id, selectedEmail.id, user.id);
        setAttachments(prev => [...newAttachments, ...prev]);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al subir uno o más archivos.';
        setUploadError(errorMessage);
        console.error(err);
    } finally {
        setIsUploading(false);
    }
  };


  return (
    <div className="flex h-full font-sans">
      <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-brand-surface border-r border-brand-border flex flex-col">
        <header className="p-4 border-b border-brand-border sticky top-0 bg-brand-surface z-10 space-y-3">
          <div>
            <h1 className="text-xl font-bold text-brand-text truncate" title={headerTitle}>{headerTitle}</h1>
            <p className="text-sm text-brand-text-secondary">{filteredEmails.length} emails</p>
          </div>
          <div>
            <label htmlFor="inbox-filter" className="sr-only">Filtrar correos</label>
            <select
                id="inbox-filter"
                value={activeFilter}
                onChange={handleFilterChange}
                className="w-full bg-brand-bg border border-brand-border rounded-md px-2 py-1.5 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none"
            >
                <option value="all">Todos los correos</option>
                <option value="unassigned">Correos sin Asignar</option>
                {cases.length > 0 && <option disabled>-- Expedientes --</option>}
                {cases.map(c => (
                    <option key={c.id} value={c.id}>
                        {c.titulo_asunto} {c.numero_expediente ? `(${c.numero_expediente})` : ''}
                    </option>
                ))}
            </select>
          </div>
        </header>
        <EmailList 
          emails={filteredEmails} 
          selectedEmailId={selectedEmail?.id} 
          onSelectEmail={handleSelectEmail}
          onDeleteEmail={handleDeleteRequest}
          isLoading={false} // La carga principal se maneja en App.tsx
          totalEmailCount={emails.length}
        />
      </aside>
      <main className="flex-1 flex overflow-hidden">
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
          <EmailDetail 
            email={selectedEmail} 
            attachments={attachments}
            isLoading={loadingAttachments}
            error={error}
            cases={cases}
            onAssignCase={handleAssignCase}
            onFileUpload={handleEmailFileUpload}
            isUploading={isUploading}
            uploadError={uploadError}
          />
        </div>
        {selectedEmail && (
          <aside className="w-1/3 lg:w-2/5 xl:w-1/3 bg-brand-surface border-l border-brand-border flex flex-col">
            <AIPanel 
              user={user}
              email={selectedEmail} 
              attachments={attachments} 
              onResponseGenerated={setGeneratedResponseHtml}
            />
          </aside>
        )}
      </main>
      
      {generatedResponseHtml && selectedEmail && (
        <ResponseModal
          responseHtml={generatedResponseHtml}
          emailSubject={selectedEmail.subject}
          onClose={() => setGeneratedResponseHtml(null)}
        />
      )}
      
      {emailToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar borrado de email"
          message={`¿Estás seguro de que quieres borrar este email de "${emailToDelete.sender}"? Esta acción no se puede deshacer.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default InboxView;
