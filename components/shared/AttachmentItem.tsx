
import React, { useState } from 'react';
import { Attachment } from '../../types';
import { EDGE_FUNCTION_URL, BUCKET_NAME } from '../../constants';

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" />
    </svg>
);

const AttachmentItem: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    const handleDownload = async () => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            // SOLUCIÓN: Limpia la ruta del storage para quitar el nombre del bucket si existe.
            // La Edge Function espera la ruta relativa DENTRO del bucket.
            const pathPrefix = `${BUCKET_NAME}/`;
            let cleanPath = attachment.storage_path;
            if (cleanPath.startsWith(pathPrefix)) {
                cleanPath = cleanPath.substring(pathPrefix.length);
            }

            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storage_path: cleanPath }),
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to generate download link.');
            }

            const { signedUrl } = responseData;
            if (!signedUrl) {
                throw new Error('No signed URL returned from the function.');
            }
            
            window.open(signedUrl, '_blank');

        } catch (error) {
            console.error('Download error:', error);
            setDownloadError(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-brand-bg rounded-lg border border-brand-border">
            <div className="flex items-center space-x-3 overflow-hidden">
                <PaperClipIcon className="w-5 h-5 text-brand-text-secondary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate" title={attachment.filename}>{attachment.filename}</p>
                    <p className="text-xs text-brand-text-secondary">{attachment.mimetype}</p>
                    {downloadError && <p className="text-xs text-red-400 mt-1">{downloadError}</p>}
                </div>
            </div>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2 ml-2 rounded-full text-brand-text-secondary hover:bg-brand-primary-hover hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Download ${attachment.filename}`}
                title={`Download ${attachment.filename}`}
            >
                {isDownloading ? (
                    <LoadingSpinnerIcon className="w-5 h-5" />
                ) : (
                    <DownloadIcon className="w-5 h-5" />
                )}
            </button>
        </div>
    );
};

export default AttachmentItem;
