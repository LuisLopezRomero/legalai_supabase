import React, { useState, useEffect } from 'react';
import { Email, Case } from '../../types';

interface QuickCaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCase: (caseData: any) => Promise<void>;
  email?: Email;
}

const LoadingSpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className || "h-5 w-5"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Opciones idénticas a CaseFormModal
const caseStatuses = ['Abierto', 'En Juicio', 'Cerrado', 'Archivado', 'En Apelación', 'Pendiente de Resolución'];
const casePriorities = ['Baja', 'Normal', 'Alta', 'Urgente'];
const casePhases = ['Inicial', 'Investigación', 'Negociación', 'Juicio', 'Apelación', 'Ejecución'];

const QuickCaseCreateModal: React.FC<QuickCaseCreateModalProps> = ({
  isOpen,
  onClose,
  onCreateCase,
  email,
}) => {
  // Usar la misma estructura que CaseFormModal
  const [formData, setFormData] = useState<Partial<Case>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar formulario cuando se abre
  useEffect(() => {
    if (isOpen) {
      const defaults: Partial<Case> = {
        titulo_asunto: email?.subject || '',
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
        honorarios_pactados: null,
        facturado_hasta_fecha: null,
      };
      
      setFormData(defaults);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, email]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo_asunto?.trim()) {
      setError('El título del asunto es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Misma lógica que CaseFormModal: convertir strings vacíos a null
      const payload = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
      );
      
      await onCreateCase(payload);
      
      // Reset form
      setFormData({
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
        honorarios_pactados: null,
        facturado_hasta_fecha: null,
      });
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear el expediente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Crear Nuevo Expediente</h2>
            {email && (
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Basado en el email de: {email.sender || 'Remitente desconocido'}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
            style={{
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* --- INFORMACIÓN BÁSICA --- */}
          <section>
            <h3 className="text-md font-semibold border-b pb-2 mb-4" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
              Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Título del Asunto <span className="text-brand-danger">*</span>
                </label>
                <input
                  name="titulo_asunto"
                  type="text"
                  value={formData.titulo_asunto || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Nº Expediente
                </label>
                <input
                  name="numero_expediente"
                  type="text"
                  value={formData.numero_expediente || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Tipo de Asunto
                </label>
                <input
                  name="tipo_asunto"
                  type="text"
                  value={formData.tipo_asunto || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>
          </section>

          {/* --- ESTADO Y FECHAS --- */}
          <section>
            <h3 className="text-md font-semibold border-b pb-2 mb-4" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
              Estado y Fechas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {caseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Fase Procesal
                </label>
                <select
                  name="fase_procesal"
                  value={formData.fase_procesal || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {casePhases.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Prioridad
                </label>
                <select
                  name="prioridad"
                  value={formData.prioridad || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {casePriorities.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Fecha de Apertura
                </label>
                <input
                  name="fecha_apertura"
                  type="date"
                  value={formData.fecha_apertura || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>
          </section>

          {/* --- PARTES INVOLUCRADAS --- */}
          <section>
            <h3 className="text-md font-semibold border-b pb-2 mb-4" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
              Partes Involucradas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Parte Contraria
                </label>
                <input
                  name="parte_contraria"
                  type="text"
                  value={formData.parte_contraria || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Abogado Contrario
                </label>
                <input
                  name="abogado_contrario"
                  type="text"
                  value={formData.abogado_contrario || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Procurador Asignado
                </label>
                <input
                  name="procurador_asignado"
                  type="text"
                  value={formData.procurador_asignado || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg px-3 py-2 transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
              </div>
            </div>
          </section>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg p-3 border animate-fade-in-up" style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#f87171',
            }}>
              {error}
            </div>
          )}
        </form>

        {/* Footer Buttons */}
        <div className="p-4 border-t flex justify-end gap-3" style={{ 
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-bg)' 
        }}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              backgroundColor: 'var(--color-surface-hover)',
              color: 'var(--color-text)',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-lg hover:shadow-brand-primary/40 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinnerIcon className="w-5 h-5" />
                Creando...
              </>
            ) : (
              'Crear Expediente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickCaseCreateModal;
