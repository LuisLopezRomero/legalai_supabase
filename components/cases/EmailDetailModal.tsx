
import React, { useState, useEffect } from 'react';
import { Email, Attachment } from '../../types';
import { fetchEmailById, fetchAttachmentsForEmail } from '../../services/supabaseService';
import AttachmentItem from '../shared/AttachmentItem';

// Icons for the modal
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

interface EmailDetailModalProps {
  emailId: string;
  onClose: () => void;
}

const EmailDetailModal: React.FC<EmailDetailModalProps> = ({ emailId, onClose }) => {
  const [email, setEmail] = useState<Email | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmailData = async () => {
      if (!emailId) return;

      setIsLoading(true);
      setError(null);
      try {
        const [emailData, attachmentsData] = await Promise.all([
          fetchEmailById(emailId),
          fetchAttachmentsForEmail(emailId)
        ]);

        if (!emailData) {
          throw new Error('No se encontró el correo.');
        }

        setEmail(emailData);
        setAttachments(attachmentsData);

      } catch (err) {
        console.error("Error loading email details:", err);
        setError(err instanceof Error ? err.message : "No se pudieron cargar los detalles del correo.");
      } finally {
        setIsLoading(false);
      }
    };
    loadEmailData();
  }, [emailId]);

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <LoadingSpinnerIcon className="w-8 h-8 text-brand-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center text-red-400">
          <p>Error: {error}</p>
        </div>
      );
    }
    
    if (!email) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center text-brand-text-secondary">
          <p>No se encontró el correo electrónico.</p>
        </div>
      );
    }

    return (
      <>
        <header className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-brand-text truncate" title={email.subject}>{email.subject}</h2>
            <div className="flex items-center space-x-2 text-sm text-brand-text-secondary">
              <p className="font-semibold text-brand-text">{email.sender}</p>
              <span>&bull;</span>
              <p>{new Date(email.received_at).toLocaleString()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-border hover:text-white transition-colors" aria-label="Cerrar modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <article className="prose prose-invert max-w-none text-brand-text whitespace-pre-wrap">
            {email.body}
          </article>
          
          <section>
            <h3 className="text-lg font-semibold mb-4">{attachments.length} Adjunto{attachments.length !== 1 ? 's' : ''}</h3>
            {attachments.length > 0 ? (
                <div className="space-y-2">
                {attachments.map(att => <AttachmentItem key={att.id} attachment={att} />)}
                </div>
            ) : (
                <p className="text-sm text-brand-text-secondary">Este correo no tiene archivos adjuntos.</p>
            )}
          </section>
        </main>
      </>
    );
  };


  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-brand-surface w-full h-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden" onClick={stopPropagation}>
          {renderContent()}
        </div>
    </div>
  );
};

export default EmailDetailModal;
