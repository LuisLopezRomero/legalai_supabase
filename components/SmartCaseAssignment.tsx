import React, { useState, useEffect } from 'react';
import { Email, Case } from '../types';
import { analyzeEmailForCaseAssignment } from '../services/aiService';

interface SmartCaseAssignmentProps {
  email: Email;
  cases: Case[];
  onAssignCase: (emailId: string, caseId: string | null) => void;
  onCreateNewCase: () => void;
}

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.02c0 1.213-.967 2.197-2.16 2.197h-12.18A2.185 2.185 0 013.75 18.17V10.34c0-.63.256-1.2.673-1.61l6-4.5a2.25 2.25 0 012.654 0l6 4.5c.417.41.673.98.673 1.61v3.81z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.75V6.75a2.25 2.25 0 00-2.25-2.25h-4.5A2.25 2.25 0 007.5 6.75v3" />
  </svg>
);

const SmartCaseAssignment: React.FC<SmartCaseAssignmentProps> = ({
  email,
  cases,
  onAssignCase,
  onCreateNewCase,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [shouldCreateNew, setShouldCreateNew] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string>(email.expediente_id || 'none');

  useEffect(() => {
    setSelectedCase(email.expediente_id || 'none');
  }, [email.expediente_id]);

  const handleAnalyze = async () => {
    // Validar que el email tenga los campos necesarios
    if (!email.subject && !email.body) {
      console.warn('Email sin contenido para analizar');
      setShouldCreateNew(true);
      setShowSuggestions(true);
      return;
    }

    setAnalyzing(true);
    setShowSuggestions(true);
    
    try {
      const result = await analyzeEmailForCaseAssignment(email, cases);
      setSuggestions(result.suggestedCases);
      setShouldCreateNew(result.shouldCreateNew);
    } catch (error) {
      console.error('Error analyzing email:', error);
      setShouldCreateNew(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAssign = (caseId: string | null) => {
    setSelectedCase(caseId || 'none');
    onAssignCase(email.id, caseId);
    setShowSuggestions(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-brand-success';
    if (confidence >= 50) return 'text-brand-warning';
    return 'text-brand-text-secondary';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 75) return 'bg-brand-success/20 text-brand-success border-brand-success/30';
    if (confidence >= 50) return 'bg-brand-warning/20 text-brand-warning border-brand-warning/30';
    return 'bg-brand-text-secondary/20 text-brand-text-secondary border-brand-text-secondary/30';
  };

  return (
    <div className="space-y-3">
      {/* Header con botones de acción */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Expediente:
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-brand-accent to-brand-primary text-white hover:shadow-lg hover:shadow-brand-accent/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            title="Analizar con IA"
          >
            <SparklesIcon className="w-4 h-4" />
            {analyzing ? 'Analizando...' : 'IA'}
          </button>
          
          <button
            onClick={onCreateNewCase}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 bg-gradient-to-r from-brand-success to-brand-success-light text-white hover:shadow-lg hover:shadow-brand-success/30 hover:scale-105"
            title="Crear nuevo expediente"
          >
            <PlusCircleIcon className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* Selector de expediente */}
      <select
        value={selectedCase}
        onChange={(e) => handleAssign(e.target.value === 'none' ? null : e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm transition-all duration-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
      >
        <option value="none">-- Sin Asignar --</option>
        {cases.map(c => (
          <option key={c.id} value={c.id}>
            {c.numero_expediente ? `[${c.numero_expediente}] ` : ''}{c.titulo_asunto}
          </option>
        ))}
      </select>

      {/* Sugerencias de IA */}
      {showSuggestions && !analyzing && suggestions.length > 0 && (
        <div className="rounded-lg p-3 border animate-fade-in-up" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="w-4 h-4 text-brand-accent" />
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Sugerencias de IA
            </span>
          </div>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.caseId}
                onClick={() => handleAssign(suggestion.caseId)}
                className="w-full text-left p-2 rounded-lg transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                      {suggestion.caseNumber ? `[${suggestion.caseNumber}] ` : ''}
                      {suggestion.caseName}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getConfidenceBadge(suggestion.confidence)}`}>
                    {suggestion.confidence}%
                  </span>
                </div>
                
                {suggestion.reasons.length > 0 && (
                  <ul className="text-xs space-y-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {suggestion.reasons.map((reason: string, idx: number) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando debería crear nuevo */}
      {showSuggestions && !analyzing && shouldCreateNew && suggestions.length === 0 && (
        <div className="rounded-lg p-3 border animate-fade-in-up" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border-light)',
        }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            💡 No se encontraron expedientes relacionados. Considera crear uno nuevo.
          </p>
        </div>
      )}

      {/* Estado de carga */}
      {analyzing && (
        <div className="rounded-lg p-3 border animate-pulse" style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <SparklesIcon className="w-4 h-4 text-brand-accent" />
            </div>
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Analizando email con IA...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCaseAssignment;
