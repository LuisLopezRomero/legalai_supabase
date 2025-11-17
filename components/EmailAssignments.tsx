import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Email, UserProfile } from '../types';
import { 
  fetchEmailsWithAssignments,
  fetchOrganizationUsers,
  assignEmailToUser,
  unassignEmail
} from '../services/supabaseService';

interface AssignEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email: any; // Email with relations
  users: UserProfile[];
  currentUserId: string;
}

const AssignEmailModal: React.FC<AssignEmailModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  email, 
  users,
  currentUserId 
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && email) {
      setSelectedUserId(email.assigned_to_user_id || '');
      setError(null);
    }
  }, [isOpen, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (selectedUserId) {
        await assignEmailToUser(email.id, selectedUserId, currentUserId);
      } else {
        await unassignEmail(email.id);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error assigning email:', err);
      setError(err.message || 'Error al asignar email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !email) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-brand-surface rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-brand-border animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-text gradient-text">Asignar Email</h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Email Info */}
        <div className="mb-6 p-4 bg-brand-bg rounded-lg border border-brand-border">
          <h3 className="text-sm font-semibold text-brand-text-secondary mb-2">Email:</h3>
          <p className="text-brand-text font-medium mb-1">
            {email.subject || '(Sin asunto)'}
          </p>
          <p className="text-sm text-brand-text-secondary">
            De: {email.sender || 'Desconocido'}
          </p>
          {email.received_at && (
            <p className="text-xs text-brand-text-secondary mt-1">
              Recibido: {new Date(email.received_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Asignar a:
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
            >
              <option value="">Sin asignar</option>
              {users.filter(u => u.is_active).map(user => (
                <option key={user.id} value={user.user_id}>
                  {user.full_name} - {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                </option>
              ))}
            </select>
            {selectedUserId && (
              <p className="mt-2 text-xs text-brand-text-secondary">
                ✓ Este usuario podrá ver y trabajar con este email
              </p>
            )}
            {!selectedUserId && email.assigned_to_user_id && (
              <p className="mt-2 text-xs text-yellow-500">
                ⚠ Se eliminará la asignación actual
              </p>
            )}
          </div>

          {error && (
            <div className="bg-brand-danger/10 border border-brand-danger/30 text-brand-danger-light p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-brand-border rounded-lg text-brand-text-secondary hover:bg-brand-surface-hover transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold py-2.5 px-4 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                'Guardar Asignación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmailAssignments: React.FC = () => {
  const { userProfile, organization, isAdmin, user } = useAuth();
  const [emails, setEmails] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [fetchedEmails, fetchedUsers] = await Promise.all([
        fetchEmailsWithAssignments(organization.id),
        fetchOrganizationUsers(organization.id)
      ]);
      
      setEmails(fetchedEmails);
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleAssignClick = (email: any) => {
    setSelectedEmail(email);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    loadData();
  };

  // Filter emails
  const filteredEmails = emails.filter(email => {
    // Status filter
    if (filterStatus === 'assigned' && !email.assigned_to_user_id) return false;
    if (filterStatus === 'unassigned' && email.assigned_to_user_id) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        email.subject?.toLowerCase().includes(query) ||
        email.sender?.toLowerCase().includes(query) ||
        email.assigned_to_user?.full_name?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Stats
  const stats = {
    total: emails.length,
    assigned: emails.filter(e => e.assigned_to_user_id).length,
    unassigned: emails.filter(e => !e.assigned_to_user_id).length,
  };

  // Only admins can access this component
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Acceso Denegado</h2>
          <p className="text-brand-text-secondary">
            Solo los administradores pueden acceder a la asignación de emails.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
          <p className="text-brand-text-secondary">Cargando emails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-text mb-2">Error</h2>
          <p className="text-brand-text-secondary">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-brand-border bg-brand-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-text gradient-text">Asignación de Emails</h1>
            <p className="text-brand-text-secondary mt-1">
              Organización: <span className="font-semibold text-brand-text">{organization?.name}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-brand-bg rounded-lg p-4 border border-brand-border">
            <p className="text-sm text-brand-text-secondary">Total Emails</p>
            <p className="text-2xl font-bold text-brand-text">{stats.total}</p>
          </div>
          <div className="bg-brand-bg rounded-lg p-4 border border-green-500/30">
            <p className="text-sm text-brand-text-secondary">Asignados</p>
            <p className="text-2xl font-bold text-green-400">{stats.assigned}</p>
          </div>
          <div className="bg-brand-bg rounded-lg p-4 border border-yellow-500/30">
            <p className="text-sm text-brand-text-secondary">Sin Asignar</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.unassigned}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por asunto, remitente o usuario asignado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
          >
            <option value="all">Todos ({stats.total})</option>
            <option value="assigned">Asignados ({stats.assigned})</option>
            <option value="unassigned">Sin Asignar ({stats.unassigned})</option>
          </select>
        </div>
      </div>

      {/* Emails List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-3">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              className="bg-brand-surface rounded-xl border border-brand-border p-4 hover:shadow-lg hover:border-brand-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-brand-text font-medium truncate">
                      {email.subject || '(Sin asunto)'}
                    </h3>
                    {email.expediente_id && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        📁 Con expediente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                    <span className="truncate">
                      De: {email.sender || 'Desconocido'}
                    </span>
                    {email.received_at && (
                      <span className="whitespace-nowrap">
                        {new Date(email.received_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  {email.assigned_to_user && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-brand-text-secondary">Asignado a:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-xs font-bold">
                          {email.assigned_to_user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-brand-text">
                          {email.assigned_to_user.full_name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          email.assigned_to_user.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {email.assigned_to_user.role === 'admin' ? '👑' : '👤'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleAssignClick(email)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    email.assigned_to_user_id
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                  }`}
                >
                  {email.assigned_to_user_id ? 'Reasignar' : 'Asignar'}
                </button>
              </div>
            </div>
          ))}

          {filteredEmails.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-bg flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-brand-text-secondary">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No se encontraron emails con estos filtros'
                  : 'No hay emails en esta organización'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {user && (
        <AssignEmailModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedEmail(null);
          }}
          onSuccess={handleAssignSuccess}
          email={selectedEmail}
          users={users}
          currentUserId={user.id}
        />
      )}
    </div>
  );
};

export default EmailAssignments;
