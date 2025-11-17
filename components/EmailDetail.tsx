
import React, { useState } from 'react';
import { Email, Attachment, Case } from '../types';
import AttachmentItem from './shared/AttachmentItem';
import SmartCaseAssignment from './SmartCaseAssignment';
import QuickCaseCreateModal from './cases/QuickCaseCreateModal';

interface EmailDetailProps {
  email: Email | null;
  attachments: Attachment[];
  isLoading: boolean;
  error: string | null;
  cases: Case[];
  onAssignCase: (emailId: string, caseId: string | null) => void;
  onFileUpload: (files: FileList) => void;
  isUploading: boolean;
  uploadError: string | null;
  userId: string;
  onCaseCreated?: (newCase: Case) => void;
}

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const EmailDetail: React.FC<EmailDetailProps> = ({ email, attachments, isLoading, error, cases, onAssignCase, onFileUpload, isUploading, uploadError, userId, onCaseCreated }) => {
  const [isCreateCaseModalOpen, setIsCreateCaseModalOpen] = useState(false);
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400">An Error Occurred</h2>
          <p className="text-brand-text-secondary mt-2">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!email) {
    return (
      <div className="flex items-center justify-center h-full p-8 animate-fade-in">
        <div className="text-center scale-in-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-surface flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-text-muted">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-brand-text">Selecciona un Email</h2>
          <p className="text-brand-text-secondary mt-2">Elige un correo de la lista para ver su contenido</p>
        </div>
      </div>
    );
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        onFileUpload(event.target.files);
        // Reset file input to allow re-uploading the same file
        event.target.value = ''; 
    }
  };

  const handleCreateCase = async (caseData: any) => {
    const { createCase } = await import('../services/supabaseService');
    const newCase = await createCase(caseData, userId);
    
    // Auto-assign the new case to the email
    onAssignCase(email!.id, newCase.id);
    
    // Notify parent component
    if (onCaseCreated) {
      onCaseCreated(newCase);
    }
  };


  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 animate-fade-in">
      <header className="pb-4 border-b border-brand-border animate-fade-in-up">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-brand-text mb-2 break-words gradient-text">{email.subject || 'Sin asunto'}</h2>
                <div className="flex items-center space-x-2 text-brand-text-secondary">
                  <p className="font-semibold text-brand-text">{email.sender || 'Sin remitente'}</p>
                  <span>&bull;</span>
                  <p>{email.received_at ? new Date(email.received_at).toLocaleString() : 'Fecha desconocida'}</p>
                </div>
            </div>
        </div>
        <div className="mt-4">
            <SmartCaseAssignment 
              email={email} 
              cases={cases} 
              onAssignCase={onAssignCase}
              onCreateNewCase={() => setIsCreateCaseModalOpen(true)}
            />
        </div>
      </header>

      <article className="prose prose-invert max-w-none mt-6 text-brand-text whitespace-pre-wrap">
        {email.body || 'Sin contenido'}
      </article>
      
      <section className="mt-8 pt-6 border-t border-brand-border">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{attachments.length} Attachment{attachments.length > 1 ? 's' : ''}</h3>
            {email.expediente_id && (
                <label htmlFor="email-attachment-upload" className={`flex items-center gap-2 cursor-pointer bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white font-semibold py-2 px-4 rounded-lg hover:shadow-lg hover:shadow-brand-primary/30 hover:scale-105 transition-all duration-300 text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <UploadIcon className="w-4 h-4" />
                    Añadir
                </label>
            )}
        </div>
        <input id="email-attachment-upload" type="file" multiple className="hidden" onChange={handleFileChange} disabled={isUploading} />
        
        {isUploading && <div className="flex items-center justify-center gap-2 text-sm text-brand-text-secondary my-2"><LoadingSpinnerIcon className="w-4 h-4"/>Subiendo archivos...</div>}
        {uploadError && <p className="text-sm text-red-400 text-center my-2">{uploadError}</p>}
        
        {isLoading && <div className="text-center text-brand-text-secondary">Loading attachments...</div>}
        
        {!isLoading && attachments.length > 0 && (
            <div className="space-y-2">
            {attachments.map(att => <AttachmentItem key={att.id} attachment={att} />)}
            </div>
        )}
      </section>

      {/* Modal para crear nuevo expediente */}
      <QuickCaseCreateModal
        isOpen={isCreateCaseModalOpen}
        onClose={() => setIsCreateCaseModalOpen(false)}
        onCreateCase={handleCreateCase}
        email={email || undefined}
      />
    </div>
  );
};

export default EmailDetail;
