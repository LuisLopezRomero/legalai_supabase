import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { 
  fetchOrganizationUsers, 
  createUserProfile, 
  updateUserProfileRole,
  toggleUserActive,
  deleteUserProfile
} from '../services/supabaseService';
import { supabase } from '../services/supabaseClient';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose, onSuccess, organizationId }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // NOTE: In production, this should use Supabase Edge Functions or a backend API
      // that has service_role permissions to call auth.admin.inviteUserByEmail()
      // 
      // For now, we'll use signUp which creates a user account that needs email confirmation
      // The user will receive an email to set their password
      
      // Step 1: Create Supabase Auth user (requires email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: Math.random().toString(36).slice(-12) + 'Aa1!', // Temporary random password
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario de autenticación');
      }

      // Step 2: Create user profile
      await createUserProfile({
        user_id: authData.user.id,
        organization_id: organizationId,
        email,
        full_name: fullName,
        role,
      });

      // Success!
      setEmail('');
      setFullName('');
      setRole('member');
      alert(`Usuario ${fullName} creado exitosamente. Se ha enviado un email de confirmación a ${email} para que establezca su contraseña.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error inviting user:', err);
      let errorMessage = 'Error al invitar usuario';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      if (err.code === '23505') {
        errorMessage = 'Este email ya está registrado en el sistema';
      } else if (err.message?.includes('policy')) {
        errorMessage = 'Error de permisos. Asegúrate de tener RLS configurado correctamente.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-brand-surface rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-brand-border animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-text gradient-text">Invitar Usuario</h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
              className="w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2.5 text-brand-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all"
            >
              <option value="member">Usuario Normal (Member)</option>
              <option value="admin">Administrador (Admin)</option>
            </select>
            <p className="mt-2 text-xs text-brand-text-secondary">
              {role === 'admin' 
                ? '✓ Puede ver TODOS los emails, asignar expedientes y gestionar usuarios'
                : '✓ Solo puede ver expedientes asignados y crear propios'}
            </p>
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
                  Invitando...
                </span>
              ) : (
                'Enviar Invitación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { userProfile, organization, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!organization) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedUsers = await fetchOrganizationUsers(organization.id);
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [organization]);

  const handleToggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    setActionLoading(`role-${user.id}`);
    
    try {
      await updateUserProfileRole(user.id, newRole);
      await loadUsers();
    } catch (err: any) {
      console.error('Error updating user role:', err);
      alert(`Error al cambiar rol: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    setActionLoading(`active-${user.id}`);
    
    try {
      await toggleUserActive(user.id, !user.is_active);
      await loadUsers();
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      alert(`Error al cambiar estado: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.full_name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setActionLoading(`delete-${user.id}`);
    
    try {
      await deleteUserProfile(user.id);
      await loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
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
            Solo los administradores pueden acceder a la gestión de usuarios.
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
          <p className="text-brand-text-secondary">Cargando usuarios...</p>
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
            onClick={loadUsers}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text gradient-text">Gestión de Usuarios</h1>
            <p className="text-brand-text-secondary mt-1">
              Organización: <span className="font-semibold text-brand-text">{organization?.name}</span>
              {' • '}
              {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
            </p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="bg-gradient-to-r from-brand-primary to-brand-accent text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invitar Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden shadow-lg">
          <table className="w-full">
            <thead className="bg-brand-bg border-b border-brand-border">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-brand-text-secondary">Usuario</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-brand-text-secondary">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-brand-text-secondary">Rol</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-brand-text-secondary">Estado</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-brand-text-secondary">Último Login</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-brand-text-secondary">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {users.map((user) => {
                const isCurrentUser = user.id === userProfile?.id;
                return (
                  <tr key={user.id} className="hover:bg-brand-surface-hover transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-brand-text">
                            {user.full_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">Tú</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-brand-text-secondary">{user.email}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.is_active ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-brand-text-secondary text-sm">
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Nunca'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrentUser && (
                          <>
                            <button
                              onClick={() => handleToggleRole(user)}
                              disabled={actionLoading === `role-${user.id}`}
                              title={`Cambiar a ${user.role === 'admin' ? 'Member' : 'Admin'}`}
                              className="p-2 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all disabled:opacity-50"
                            >
                              {actionLoading === `role-${user.id}` ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={actionLoading === `active-${user.id}`}
                              title={user.is_active ? 'Desactivar' : 'Activar'}
                              className="p-2 text-brand-text-secondary hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all disabled:opacity-50"
                            >
                              {actionLoading === `active-${user.id}` ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : user.is_active ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={actionLoading === `delete-${user.id}`}
                              title="Eliminar usuario"
                              className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                            >
                              {actionLoading === `delete-${user.id}` ? (
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-brand-text-secondary">No hay usuarios en esta organización</p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={loadUsers}
        organizationId={organization?.id || ''}
      />
    </div>
  );
};

export default UserManagement;
