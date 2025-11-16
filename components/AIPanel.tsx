import React, { useState, useEffect } from 'react';
import { Email, Attachment } from '../types';
import { User } from '@supabase/supabase-js';
import { WEBHOOK_URL } from '../constants';
import PromptManager from './prompts/PromptManager';

interface AIPanelProps {
  email: Email;
  attachments: Attachment[];
  onResponseGenerated: (html: string) => void;
  user: User;
}

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TemplateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);


const AIPanel: React.FC<AIPanelProps> = ({ email, attachments, onResponseGenerated, user }) => {
    const DEFAULT_PROMPT = "Resume el siguiente correo y sugiere tres posibles respuestas: una formal, una neutral y una informal.";
    const [promptText, setPromptText] = useState(DEFAULT_PROMPT);
    
    const [selectedAttachments, setSelectedAttachments] = useState<Record<string, boolean>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    useEffect(() => {
        setGenerationError(null);
        if (attachments.length > 0) {
            const initialSelection = attachments.reduce((acc, att) => {
                acc[att.id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setSelectedAttachments(initialSelection);
        } else {
            setSelectedAttachments({});
        }
    }, [email, attachments]);

    const handleCheckboxChange = (attachmentId: string) => {
        setSelectedAttachments(prev => ({
            ...prev,
            [attachmentId]: !prev[attachmentId],
        }));
    };
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationError(null);
        
        const selectedAttachmentsPayload = attachments
            .filter(att => selectedAttachments[att.id])
            .map(att => ({
                id: att.id,
                filename: att.filename,
                mimetype: att.mimetype,
                storage_path: att.storage_path,
            }));

        const payload = {
            prompt_text: promptText,
            email_data: {
                id: email.id,
                subject: email.subject,
                sender: email.sender,
                body: email.body,
                received_at: email.received_at,
            },
            selected_attachments: selectedAttachmentsPayload,
        };

        try {
            if (!WEBHOOK_URL) {
                throw new Error("La URL del webhook no está configurada.");
            }

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error del servidor: ${response.status}`;
                try {
                    // Intenta parsear como JSON para un mensaje de error más específico
                    const errorJson = JSON.parse(errorText);
                    if (errorJson && errorJson.message) {
                        errorMessage = errorJson.message;
                    }
                } catch (e) {
                    // Si no es JSON, usa el texto del error si existe
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                throw new Error(errorMessage);
            }

            const resultHtml = await response.text();
            onResponseGenerated(resultHtml);

        } catch (error) {
            console.error("Error generating AI response:", error);
            let errorMessage = 'Ocurrió un error desconocido.';
            if (error instanceof Error) {
                if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Error de Red: No se pudo conectar al servicio de IA. Esto puede deberse a un problema de CORS en el servidor del webhook, a que el servicio no esté disponible o a un problema con tu conexión a internet.';
                } else {
                    errorMessage = error.message;
                }
            }
            setGenerationError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b border-brand-border sticky top-0 bg-brand-surface z-10 flex items-center space-x-2">
                <SparklesIcon className="w-6 h-6 text-brand-primary" />
                <h2 className="text-lg font-bold text-brand-text">Asistente IA</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-brand-text-secondary mb-2">
                        <TemplateIcon className="w-5 h-5" />
                        Gestión de Prompts
                    </label>
                    <PromptManager
                        user={user}
                        onPromptSelect={setPromptText}
                        initialPromptText={DEFAULT_PROMPT}
                    />
                </div>

                <div>
                    <label htmlFor="prompt-text" className="block text-sm font-medium text-brand-text-secondary mb-2">Contenido del Prompt</label>
                    <textarea
                        id="prompt-text"
                        rows={6}
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none"
                        placeholder="Escribe tu prompt aquí o selecciona una plantilla..."
                    />
                </div>

                {attachments.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-brand-text-secondary mb-2">Archivos Adjuntos a Incluir</h3>
                        <div className="space-y-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center">
                                    <input
                                        id={`att-${att.id}`}
                                        type="checkbox"
                                        checked={!!selectedAttachments[att.id]}
                                        onChange={() => handleCheckboxChange(att.id)}
                                        className="h-4 w-4 rounded border-brand-border bg-brand-bg text-brand-primary focus:ring-brand-primary"
                                    />
                                    <label htmlFor={`att-${att.id}`} className="ml-3 block text-sm text-brand-text truncate">
                                        {att.filename}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <footer className="p-4 border-t border-brand-border flex-shrink-0 bg-brand-surface">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !promptText.trim()}
                    className="w-full flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <LoadingSpinnerIcon className="w-5 h-5"/>
                            Generando respuesta...
                        </>
                    ) : (
                        "Generar con IA"
                    )}
                </button>
                 {generationError && (
                    <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-md text-sm text-red-300">
                        <strong>Error:</strong> {generationError}
                    </div>
                )}
            </footer>
        </div>
    );
};

export default AIPanel;