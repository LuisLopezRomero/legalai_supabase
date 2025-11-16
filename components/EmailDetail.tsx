
import React from 'react';
import { Email, Attachment, Case } from '../types';
import AttachmentItem from './shared/AttachmentItem';

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
}

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.02a2.25 2.25 0 0 1-2.25 2.25H6.012A2.25 2.25 0 0 1 3.75 18.17V10.34a2.25 2.25 0 0 1 .882-1.763l6-4.5a2.25 2.25 0 0 1 2.736 0l6 4.5a2.25 2.25 0 0 1 .882 1.763v3.81Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75V6.75a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 7.5 6.75v3" />
    </svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);


const AssignCaseControl: React.FC<{email: Email; cases: Case[]; onAssignCase: (emailId: string, caseId: string | null) => void;}> = ({ email, cases, onAssignCase }) => {
    
    const assignedCase = cases.find(c => c.id === email.expediente_id);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const caseId = value === 'none' ? null : value;
        onAssignCase(email.id, caseId);
    };

    return (
        <div className="flex items-center gap-2 bg-brand-bg/50 p-2 rounded-md border border-brand-border">
            <BriefcaseIcon className="w-5 h-5 text-brand-text-secondary"/>
            <label htmlFor="case-assignment" className="text-sm font-medium text-brand-text-secondary">Expediente:</label>
            <select
                id="case-assignment"
                value={email.expediente_id || 'none'}
                onChange={handleChange}
                className="bg-brand-surface border border-brand-border rounded-md px-2 py-1 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none"
            >
                <option value="none">-- Sin Asignar --</option>
                {cases.map(c => (
                    <option key={c.id} value={c.id}>
                       {c.numero_expediente ? `[${c.numero_expediente}]` : ''} {c.titulo_asunto}
                    </option>
                ))}
            </select>
        </div>
    );
};

const EmailDetail: React.FC<EmailDetailProps> = ({ email, attachments, isLoading, error, cases, onAssignCase, onFileUpload, isUploading, uploadError }) => {
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
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-brand-text">Select an Email</h2>
          <p className="text-brand-text-secondary mt-2">Choose an email from the list to view its contents.</p>
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


  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <header className="pb-4 border-b border-brand-border">
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-brand-text mb-2 break-words">{email.subject}</h2>
                <div className="flex items-center space-x-2 text-brand-text-secondary">
                  <p className="font-semibold text-brand-text">{email.sender}</p>
                  <span>&bull;</span>
                  <p>{new Date(email.received_at).toLocaleString()}</p>
                </div>
            </div>
        </div>
        <div className="mt-4">
            <AssignCaseControl email={email} cases={cases} onAssignCase={onAssignCase} />
        </div>
      </header>

      <article className="prose prose-invert max-w-none mt-6 text-brand-text whitespace-pre-wrap">
        {email.body}
      </article>
      
      <section className="mt-8 pt-6 border-t border-brand-border">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{attachments.length} Attachment{attachments.length > 1 ? 's' : ''}</h3>
            {email.expediente_id && (
                <label htmlFor="email-attachment-upload" className={`flex items-center gap-2 cursor-pointer bg-brand-primary text-white font-semibold py-1 px-3 rounded-md hover:bg-brand-primary-hover transition-colors text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
    </div>
  );
};

export default EmailDetail;
