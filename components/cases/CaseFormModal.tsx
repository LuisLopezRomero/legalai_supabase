
import React, { useState, useEffect } from 'react';
import { Case } from '../../types';

interface CaseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (caseData: Partial<Omit<Case, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
    mode: 'new' | 'edit';
    initialData?: Case | null;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
);

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

// Suggested options for select inputs
const caseStatuses = ['Abierto', 'En Juicio', 'Cerrado', 'Archivado', 'En Apelación', 'Pendiente de Resolución'];
const casePriorities = ['Baja', 'Normal', 'Alta', 'Urgente'];
const casePhases = ['Inicial', 'Investigación', 'Negociación', 'Juicio', 'Apelación', 'Ejecución'];

const CaseFormModal: React.FC<CaseFormModalProps> = ({ isOpen, onClose, onSave, mode, initialData }) => {
    // Initialize all state fields based on the Case interface
    const [formData, setFormData] = useState<Partial<Case>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const defaults: Partial<Case> = {
                titulo_asunto: '',
                numero_expediente: '',
                tipo_asunto: '',
                fecha_apertura: new Date().toISOString().split('T')[0],
                fecha_ultima_actuacion: null,
                fecha_cierre: null,
                estado: 'Abierto',
                fase_procesal: 'Inicial',
                prioridad: 'Normal',
                cliente_id: null,
                parte_contraria: '',
                abogado_contrario: '',
                abogado_responsable_id: null,
                procurador_asignado: '',
                notas_comentarios: '',
                ubicacion_archivo_fisico: '',
                enlace_documentos_digitales: '',
                honorarios_pactados: 0,
                facturado_hasta_fecha: 0,
            };
            
            const initial = mode === 'edit' && initialData ? {
                ...initialData,
                fecha_apertura: initialData.fecha_apertura ? new Date(initialData.fecha_apertura).toISOString().split('T')[0] : '',
                fecha_ultima_actuacion: initialData.fecha_ultima_actuacion ? new Date(initialData.fecha_ultima_actuacion).toISOString().split('T')[0] : null,
                fecha_cierre: initialData.fecha_cierre ? new Date(initialData.fecha_cierre).toISOString().split('T')[0] : null,
            } : defaults;
            
            setFormData(initial);
            setError(null);
            setIsSaving(false);
        }
    }, [isOpen, mode, initialData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: string | number | null = value;
        if (type === 'date' && !value) {
            processedValue = null;
        } else if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
        }
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSave = async () => {
        if (!formData.titulo_asunto?.trim()) {
            setError('El título del asunto es obligatorio.');
            return;
        }
        setError(null);
        setIsSaving(true);
        try {
            // Remove empty strings and convert them to null for the DB
            const payload = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
            );
            await onSave(payload);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar el expediente.');
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-brand-surface w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-brand-border flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">{mode === 'new' ? 'Crear Nuevo Expediente' : 'Editar Expediente'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-brand-text-secondary hover:bg-brand-border"><CloseIcon className="w-5 h-5" /></button>
                </header>
                <main className="p-6 space-y-6 overflow-y-auto">
                    {/* --- INFORMACIÓN BÁSICA --- */}
                    <section>
                         <h3 className="text-md font-semibold text-brand-text border-b border-brand-border pb-2 mb-4">Información Básica</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Título del Asunto*</label>
                                <input name="titulo_asunto" type="text" value={formData.titulo_asunto || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Nº Expediente</label>
                                <input name="numero_expediente" type="text" value={formData.numero_expediente || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Tipo de Asunto</label>
                                <input name="tipo_asunto" type="text" value={formData.tipo_asunto || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                         </div>
                    </section>
                    
                    {/* --- ESTADO Y FECHAS --- */}
                     <section>
                         <h3 className="text-md font-semibold text-brand-text border-b border-brand-border pb-2 mb-4">Estado y Fechas</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Estado</label>
                                <select name="estado" value={formData.estado || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                    {caseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Fase Procesal</label>
                                <select name="fase_procesal" value={formData.fase_procesal || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                     {casePhases.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Prioridad</label>
                                <select name="prioridad" value={formData.prioridad || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                    {casePriorities.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Fecha de Apertura</label>
                                <input name="fecha_apertura" type="date" value={formData.fecha_apertura || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Última Actuación</label>
                                <input name="fecha_ultima_actuacion" type="date" value={formData.fecha_ultima_actuacion || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                              <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Fecha de Cierre</label>
                                <input name="fecha_cierre" type="date" value={formData.fecha_cierre || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                         </div>
                     </section>
                     
                      {/* --- PARTES INVOLUCRADAS --- */}
                     <section>
                         <h3 className="text-md font-semibold text-brand-text border-b border-brand-border pb-2 mb-4">Partes Involucradas</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Parte Contraria</label>
                                <input name="parte_contraria" type="text" value={formData.parte_contraria || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Abogado Contrario</label>
                                <input name="abogado_contrario" type="text" value={formData.abogado_contrario || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Procurador Asignado</label>
                                <input name="procurador_asignado" type="text" value={formData.procurador_asignado || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                         </div>
                     </section>
                     
                      {/* --- FINANCIERO Y NOTAS --- */}
                      <section>
                         <h3 className="text-md font-semibold text-brand-text border-b border-brand-border pb-2 mb-4">Financiero y Notas</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Honorarios Pactados (€)</label>
                                <input name="honorarios_pactados" type="number" step="0.01" value={formData.honorarios_pactados ?? ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                             </div>
                              <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Facturado hasta la Fecha (€)</label>
                                <input name="facturado_hasta_fecha" type="number" step="0.01" value={formData.facturado_hasta_fecha ?? ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Notas / Comentarios</label>
                                <textarea name="notas_comentarios" rows={4} value={formData.notas_comentarios || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Ubicación Archivo Físico</label>
                                <input name="ubicacion_archivo_fisico" type="text" value={formData.ubicacion_archivo_fisico || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Enlace Documentos Digitales</label>
                                <input name="enlace_documentos_digitales" type="url" value={formData.enlace_documentos_digitales || ''} onChange={handleChange} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                         </div>
                      </section>
                    
                    {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
                </main>
                <footer className="p-4 bg-brand-bg/50 border-t border-brand-border flex justify-end items-center space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-4 text-sm rounded-md text-brand-text-secondary hover:bg-brand-border">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex justify-center items-center gap-2 bg-brand-primary text-white font-semibold py-2 px-4 rounded-md hover:bg-brand-primary-hover disabled:opacity-60">
                        {isSaving ? <><LoadingSpinnerIcon className="w-5 h-5"/> Guardando...</> : 'Guardar'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CaseFormModal;