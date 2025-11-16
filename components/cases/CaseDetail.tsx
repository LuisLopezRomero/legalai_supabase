
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Case, Email, Attachment } from '../../types';
import { fetchAttachmentsForCase, uploadAttachment } from '../../services/supabaseService';
import AttachmentItem from '../shared/AttachmentItem';
import EmailDetailModal from './EmailDetailModal';

interface CaseDetailProps {
    user: User;
    caseData: Case | null;
    onEditCase: (caseItem: Case) => void;
    emails: Email[];
}

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);
const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" /></svg>
);
const InboxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86a2.25 2.25 0 0 0 2.25 2.25h3.86a2.25 2.25 0 0 0 2.25-2.25v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86m-16.5 0h3.86a2.25 2.25 0 0 0 2.25-2.25v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86a2.25 2.25 0 0 0 2.25 2.25h3.86m-16.5 0v-3.86a2.25 2.25 0 0 1 2.25-2.25h3.86a2.25 2.25 0 0 1 2.25 2.25v3.86" /></svg>
);

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);


const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <p className="text-sm font-semibold text-brand-text-secondary">{label}</p>
        <p className="text-brand-text">{value || <span className="italic text-brand-text-secondary">No especificado</span>}</p>
    </div>
);

const CaseDetail: React.FC<CaseDetailProps> = ({ user, caseData, onEditCase, emails }) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [viewingEmailId, setViewingEmailId] = useState<string | null>(null);

    const caseEmails = useMemo(() => {
        if (!caseData) return [];
        return emails.filter(email => email.expediente_id === caseData.id);
    }, [caseData, emails]);

    useEffect(() => {
        if (caseData) {
            const loadRelatedAttachments = async () => {
                setIsLoadingAttachments(true);
                try {
                    const fetchedAttachments = await fetchAttachmentsForCase(caseData.id);
                    setAttachments(fetchedAttachments);
                } catch (error) {
                    console.error("Failed to load related attachments for case", error);
                } finally {
                    setIsLoadingAttachments(false);
                }
            };
            loadRelatedAttachments();
        } else {
            setAttachments([]);
        }
    }, [caseData]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !caseData) return;

        const filesToUpload = Array.from(event.target.files);
        if (filesToUpload.length === 0) return;

        setIsUploading(true);
        setUploadError(null);
        
        try {
            const newAttachments = await uploadAttachment(filesToUpload, caseData.id, null, user.id);
            // Add new attachments to the top of the list for immediate visibility
            setAttachments(prev => [...newAttachments, ...prev]);
        } catch (error) {
            console.error("Failed to upload files:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al subir uno o más archivos. Inténtalo de nuevo.";
            setUploadError(errorMessage);
        } finally {
            setIsUploading(false);
            // Reset file input value to allow re-uploading the same file
            event.target.value = '';
        }
    };

    if (!caseData) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-brand-text">Selecciona un Expediente</h2>
                    <p className="text-brand-text-secondary mt-2">Elige un caso de la lista para ver sus detalles y documentos asociados.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto">
            <header className="pb-4 border-b border-brand-border">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-brand-text mb-2 break-words">{caseData.titulo_asunto}</h2>
                        <p className="text-brand-text-secondary">{caseData.numero_expediente ? `Nº Expediente: ${caseData.numero_expediente}` : 'Sin número de expediente'}</p>
                    </div>
                    <button onClick={() => onEditCase(caseData)} className="p-2 rounded-md text-brand-text-secondary hover:bg-brand-surface hover:text-brand-primary transition-colors">
                        <PencilIcon className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            <div className="mt-6 space-y-8">
                {/* --- SECCIÓN PRINCIPAL --- */}
                <section>
                    <h3 className="text-lg font-bold text-brand-text mb-4">Información Principal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-brand-surface p-4 rounded-lg border border-brand-border">
                        <DetailItem label="Tipo de Asunto" value={caseData.tipo_asunto} />
                        <DetailItem label="Estado" value={<span className="font-semibold">{caseData.estado}</span>} />
                        <DetailItem label="Fase Procesal" value={caseData.fase_procesal} />
                        <DetailItem label="Prioridad" value={caseData.prioridad} />
                        <DetailItem label="Fecha de Apertura" value={new Date(caseData.fecha_apertura).toLocaleDateString()} />
                         <DetailItem label="Última Actuación" value={caseData.fecha_ultima_actuacion ? new Date(caseData.fecha_ultima_actuacion).toLocaleDateString() : 'N/A'} />
                    </div>
                </section>
                
                 {/* --- SECCIÓN PARTES --- */}
                <section>
                    <h3 className="text-lg font-bold text-brand-text mb-4">Partes Involucradas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-brand-surface p-4 rounded-lg border border-brand-border">
                        <DetailItem label="Parte Contraria" value={caseData.parte_contraria} />
                        <DetailItem label="Abogado Contrario" value={caseData.abogado_contrario} />
                        <DetailItem label="Procurador Asignado" value={caseData.procurador_asignado} />
                    </div>
                </section>
                
                 {/* --- SECCIÓN FINANCIERA --- */}
                <section>
                    <h3 className="text-lg font-bold text-brand-text mb-4">Información Financiera</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-surface p-4 rounded-lg border border-brand-border">
                        <DetailItem label="Honorarios Pactados" value={caseData.honorarios_pactados?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
                        <DetailItem label="Facturado hasta la Fecha" value={caseData.facturado_hasta_fecha?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
                    </div>
                </section>

                {/* --- SECCIÓN NOTAS Y ARCHIVOS --- */}
                 <section>
                    <h3 className="text-lg font-bold text-brand-text mb-4">Notas y Archivos</h3>
                     <div className="space-y-6 bg-brand-surface p-4 rounded-lg border border-brand-border">
                        {caseData.notas_comentarios && <DetailItem label="Notas / Comentarios" value={<p className="whitespace-pre-wrap">{caseData.notas_comentarios}</p>} />}
                        <DetailItem label="Ubicación Archivo Físico" value={caseData.ubicacion_archivo_fisico} />
                        <DetailItem label="Documentos Digitales" value={caseData.enlace_documentos_digitales ? <a href={caseData.enlace_documentos_digitales} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">Abrir enlace</a> : 'No especificado'} />
                     </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><InboxIcon className="w-5 h-5"/> Correos Vinculados ({caseEmails.length})</h3>
                        {caseEmails.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {caseEmails.map(email => (
                                    <li key={email.id}>
                                        <button 
                                            onClick={() => setViewingEmailId(email.id)}
                                            className="w-full text-left bg-brand-surface p-3 rounded-md border border-brand-border hover:bg-brand-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        >
                                            <p className="font-medium text-brand-text truncate" title={email.subject}>{email.subject}</p>
                                            <p className="text-sm text-brand-text-secondary">De: {email.sender} - {new Date(email.received_at).toLocaleDateString()}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-brand-text-secondary">No hay correos vinculados a este expediente.</p>}
                    </div>
                    <div>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <PaperClipIcon className="w-5 h-5"/> Documentos Vinculados ({attachments.length})
                            </h3>
                             <label htmlFor="file-upload" className={`flex items-center gap-2 cursor-pointer bg-brand-primary text-white font-semibold py-1 px-3 rounded-md hover:bg-brand-primary-hover transition-colors text-sm ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <UploadIcon className="w-4 h-4" />
                                Añadir
                            </label>
                            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        </div>
                        {isUploading && <div className="flex items-center justify-center gap-2 text-sm text-brand-text-secondary my-2"><LoadingSpinnerIcon className="w-4 h-4"/>Subiendo archivos...</div>}
                        {uploadError && <p className="text-sm text-red-400 text-center my-2">{uploadError}</p>}

                        {isLoadingAttachments ? <p className="text-sm text-brand-text-secondary">Cargando documentos...</p> : attachments.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {attachments.map(att => (
                                   <AttachmentItem key={att.id} attachment={att} />
                                ))}
                            </div>
                        ) : <p className="text-sm text-brand-text-secondary">No hay documentos vinculados a este expediente.</p>}
                    </div>
                </div>
            </div>
            
            {viewingEmailId && (
                <EmailDetailModal
                    emailId={viewingEmailId}
                    onClose={() => setViewingEmailId(null)}
                />
            )}
        </div>
    );
};

export default CaseDetail;