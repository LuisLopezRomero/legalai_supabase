
import React from 'react';
import { Case } from '../../types';

interface CaseListProps {
    cases: Case[];
    selectedCaseId?: string;
    onSelectCase: (caseItem: Case) => void;
    onNewCase: () => void;
    isLoading: boolean;
}

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const statusStyles: { [key: string]: string } = {
    'Abierto': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'En Juicio': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Cerrado': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Archivado': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const CaseListItem: React.FC<{ caseItem: Case; isSelected: boolean; onSelect: () => void; }> = ({ caseItem, isSelected, onSelect }) => {
    return (
        <li
            onClick={onSelect}
            className={`p-4 border-b border-brand-border cursor-pointer transition-colors duration-200 ${
                isSelected ? 'bg-brand-primary' : 'hover:bg-gray-700/50'
            }`}
        >
            <div className="flex justify-between items-center mb-1">
                <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-brand-text'}`}>{caseItem.titulo_asunto}</p>
                 <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[caseItem.estado] || 'bg-gray-600'}`}>
                    {caseItem.estado}
                </span>
            </div>
            <p className={`text-sm truncate ${isSelected ? 'text-blue-100' : 'text-brand-text-secondary'}`}>
                {caseItem.numero_expediente ? `Nº: ${caseItem.numero_expediente}` : 'Sin número de exp.'}
            </p>
        </li>
    );
};

const CaseList: React.FC<CaseListProps> = ({ cases, selectedCaseId, onSelectCase, onNewCase, isLoading }) => {
    return (
        <>
            <header className="p-4 border-b border-brand-border sticky top-0 bg-brand-surface z-10 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-brand-text">Expedientes</h1>
                    <p className="text-sm text-brand-text-secondary">{cases.length} casos</p>
                </div>
                <button
                    onClick={onNewCase}
                    className="p-2 bg-brand-primary rounded-full text-white hover:bg-brand-primary-hover transition-colors"
                    title="Crear nuevo expediente"
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
            </header>
            <div className="overflow-y-auto flex-1">
                {isLoading ? (
                    <p className="p-4 text-center text-brand-text-secondary">Cargando expedientes...</p>
                ) : cases.length === 0 ? (
                    <p className="p-4 text-center text-brand-text-secondary">No se encontraron expedientes.</p>
                ) : (
                    <ul>
                        {cases.map(c => (
                            <CaseListItem
                                key={c.id}
                                caseItem={c}
                                isSelected={c.id === selectedCaseId}
                                onSelect={() => onSelectCase(c)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </>
    );
};

export default CaseList;