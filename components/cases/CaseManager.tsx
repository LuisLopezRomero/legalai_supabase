
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Case, Email } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { createCase, updateCase } from '../../services/supabaseService';
import CaseList from './CaseList';
import CaseDetail from './CaseDetail';
import CaseFormModal from './CaseFormModal';

interface CaseManagerProps {
    user: User;
    emails: Email[];
    cases: Case[];
    setCases: React.Dispatch<React.SetStateAction<Case[]>>;
}

const CaseManager: React.FC<CaseManagerProps> = ({ user, emails, cases, setCases }) => {
    const { organization } = useAuth();
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

    const handleSelectCase = (caseItem: Case | null) => {
        setSelectedCase(caseItem);
    };

    const handleNewCase = () => {
        setFormMode('new');
        setIsFormModalOpen(true);
    };

    const handleEditCase = (caseItem: Case) => {
        setSelectedCase(caseItem);
        setFormMode('edit');
        setIsFormModalOpen(true);
    };

    const handleSaveCase = async (caseData: Omit<Case, 'id' | 'created_at' | 'updated_at'>) => {
        if (!organization) {
            console.error('No organization available');
            return;
        }
        
        try {
            if (formMode === 'new') {
                const newCase = await createCase(caseData, organization.id, user.id);
                setCases(prevCases => [newCase, ...prevCases]);
                setSelectedCase(newCase);
            } else if (selectedCase) {
                const updatedCase = await updateCase(selectedCase.id, caseData);
                setCases(prevCases => prevCases.map(c => c.id === updatedCase.id ? updatedCase : c));
                setSelectedCase(updatedCase);
            }
            setIsFormModalOpen(false);
        } catch (err) {
            console.error('Failed to save case:', err);
            // Opcional: mostrar un error en el modal
        }
    };

    return (
        <div className="flex h-full w-full">
            <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 bg-brand-surface border-r border-brand-border flex flex-col">
                <CaseList
                    cases={cases}
                    selectedCaseId={selectedCase?.id}
                    onSelectCase={handleSelectCase}
                    onNewCase={handleNewCase}
                    isLoading={false} // La carga se maneja en App.tsx
                />
            </aside>
            <main className="flex-1 overflow-y-auto">
                <CaseDetail
                    user={user}
                    caseData={selectedCase}
                    onEditCase={handleEditCase}
                    emails={emails}
                />
            </main>
            {isFormModalOpen && (
                 <CaseFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSaveCase}
                    mode={formMode}
                    initialData={formMode === 'edit' ? selectedCase : null}
                />
            )}
        </div>
    );
};

export default CaseManager;