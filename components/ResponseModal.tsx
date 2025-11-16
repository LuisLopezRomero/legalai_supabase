import React, { useState, useRef, useEffect } from 'react';

// Declare global variables from CDN scripts
declare const html2pdf: any;
declare const htmlDocx: any;

interface ResponseModalProps {
  responseHtml: string; 
  emailSubject: string;
  onClose: () => void;
}

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

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);


const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const isHtmlString = (str: string): boolean => {
    if (!str || typeof str !== 'string') return false;
    const htmlRegex = /<([A-Z][A-Z0-9]*)\b[^>]*>/i;
    return htmlRegex.test(str.trim());
};

const ResponseModal: React.FC<ResponseModalProps> = ({ responseHtml, emailSubject, onClose }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null); // 'HTML', 'PDF', 'DOCX'
    const dropdownRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const formatResponseTextToHtml = (text: string): string => {
        if (!text) return '';
        let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        processedText = processedText.replace(/^\s*\*\*\*\s*$/gm, '<hr />');
        return processedText;
    };
    
    const contentIsHtml = isHtmlString(responseHtml);

    const formattedContentForModal = contentIsHtml 
        ? responseHtml 
        : formatResponseTextToHtml(responseHtml);
        
    const safeSubject = emailSubject.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Generates clean, style-free HTML. Used for the direct .html download.
    const getHtmlForExport = () => {
        const contentForFile = contentIsHtml
            ? responseHtml
            : formatResponseTextToHtml(responseHtml).replace(/\n/g, '<br />');

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Respuesta para: ${emailSubject}</title>
            </head>
            <body>
                ${contentForFile}
            </body>
            </html>
        `;
    };

    // Generates HTML with a robust print stylesheet to ensure PDF/DOCX exports render correctly.
    // This forces a clean, predictable layout and allows content to break across pages naturally.
    const getStyledHtmlForPrint = () => {
        const contentForFile = contentIsHtml
            ? responseHtml
            : formatResponseTextToHtml(responseHtml).replace(/\n/g, '<br />');

        return `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Respuesta para: ${emailSubject}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                        font-size: 11pt;
                        line-height: 1.5;
                        color: #000 !important;
                        background-color: #fff !important;
                        width: 100%;
                    }
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        float: none !important;
                        background: transparent !important;
                        color: #000 !important;
                    }
                    h1, h2, h3, h4, h5, h6 {
                        page-break-after: avoid;
                        page-break-inside: avoid;
                    }
                    p, blockquote, pre, ul, ol, li, table, figure, div {
                        page-break-inside: auto;
                    }
                    p, li {
                        orphans: 3;
                        widows: 3;
                    }
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #ccc !important;
                        padding: 4px 6px !important;
                    }
                </style>
            </head>
            <body>
                ${contentForFile}
            </body>
            </html>
        `;
    };

    const handleDownload = async (format: 'HTML' | 'PDF' | 'DOCX') => {
        if (isDownloading) return;
        
        setIsDownloading(format);
        setIsDropdownOpen(false);

        try {
            if (format === 'HTML') {
                const htmlToExport = getHtmlForExport();
                const blob = new Blob([htmlToExport], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `AI-Respuesta-${safeSubject}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (format === 'PDF') {
                const htmlToExport = getStyledHtmlForPrint();
                 const options = {
                    margin:       [0.75, 0.75, 0.75, 0.75], // inches [top, left, bottom, right]
                    filename:     `AI-Respuesta-${safeSubject}.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2 },
                    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
                    // Use 'legacy' mode as it's more predictable for slicing content by height,
                    // avoiding the complex calculations of 'css' mode that were causing issues.
                    pagebreak:    { mode: 'legacy' }
                };
                await html2pdf().from(htmlToExport).set(options).save();

            } else if (format === 'DOCX') {
                const htmlToExport = getStyledHtmlForPrint();
                const blob = htmlDocx.asBlob(htmlToExport, {
                    orientation: 'portrait',
                    margins: { top: 720, right: 720, bottom: 720, left: 720 } // 1 inch = 1440
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `AI-Respuesta-${safeSubject}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

        } catch (error) {
            console.error(`Error downloading as ${format}:`, error);
        } finally {
            setIsDownloading(null);
        }
    };
    
    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-brand-surface w-full h-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden"
                onClick={stopPropagation}
            >
                <header className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text truncate">Respuesta Generada para: "{emailSubject}"</h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-border hover:text-white transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                     <div 
                        ref={contentRef}
                        className="bg-brand-bg p-6 rounded-lg border border-brand-border text-brand-text whitespace-pre-wrap leading-relaxed"
                     >
                        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formattedContentForModal }} />
                     </div>
                </main>
                
                <footer className="p-4 border-t border-brand-border flex-shrink-0 flex justify-end">
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover transition-colors duration-200"
                        >
                            <DownloadIcon className="w-5 h-5"/>
                            Descargar
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropdownOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-brand-surface border border-brand-border rounded-md shadow-lg z-10">
                                <ul className="py-1">
                                    {[ 'HTML', 'PDF', 'DOCX'].map(format => (
                                        <li key={format}>
                                            <button
                                                onClick={() => handleDownload(format as 'HTML' | 'PDF' | 'DOCX')}
                                                disabled={!!isDownloading}
                                                className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-primary hover:text-white flex items-center justify-between disabled:opacity-50 disabled:cursor-wait"
                                            >
                                                <span>Descargar como .{format.toLowerCase()}</span>
                                                {isDownloading === format && <LoadingSpinnerIcon className="w-4 h-4"/>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ResponseModal;
