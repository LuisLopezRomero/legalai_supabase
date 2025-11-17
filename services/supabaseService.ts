
import { supabase } from './supabaseClient';
import { Email, Attachment, Prompt, UserProfile, Case } from '../types';
import { BUCKET_NAME, FILE_UPLOAD_WEBHOOK_URL } from '../constants';

export const fetchEmails = async (userId: string): Promise<Email[]> => {
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('user_id', userId)
    .order('received_at', { ascending: false });

  if (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }

  return data || [];
};

export const fetchAttachmentsForEmail = async (emailId: string): Promise<Attachment[]> => {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('email_id', emailId);

  if (error) {
    console.error('Error fetching attachments:', error);
    throw error;
  }

  return data || [];
};

export const fetchEmailById = async (emailId: string): Promise<Email | null> => {
  const { data, error } = await supabase
    .from('emails')
    .select('*')
    .eq('id', emailId)
    .single();

  // "PGRST116" is the code for "0 rows returned", which is not an error here.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching email by ID:', error);
    throw error;
  }

  return data;
};

export const fetchPrompts = async (userId: string): Promise<Prompt[]> => {
    const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    throw error;
  }

  return data || [];
};

export const savePrompt = async (promptData: { user_id: string; prompt_name: string | null; prompt_text: string; prompt_tags: string[] | null; }): Promise<Prompt> => {
  const { data, error } = await supabase
    .from('prompts')
    .insert({ ...promptData, is_favorite: false }) // Favorites are off by default
    .select()
    .single();

  if (error) {
    console.error('Error saving prompt:', error);
    throw error;
  }
  
  if (!data) {
      throw new Error('Failed to save prompt: no data was returned after insert.');
  }

  return data;
};

export const updatePrompt = async (
  promptId: string,
  userId: string,
  updates: Partial<{ prompt_name: string | null; prompt_text: string; is_favorite: boolean; prompt_tags: string[] | null; }>
): Promise<Prompt> => {
  const { data, error } = await supabase
    .from('prompts')
    .update(updates)
    .eq('id', promptId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating prompt:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to update prompt: no data was returned after update.');
  }

  return data;
};

export const deletePrompt = async (promptId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting prompt:', error);
    throw error;
  }
};

// OLD FUNCTION REMOVED - replaced by new multi-user version below
// export const createUserProfile = async (profileData: { id: string; email: string; full_name: string; profession: string; })

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)  // Changed from 'id' to 'user_id' for multi-user system
    .single();

  // "PGRST116" es el código para "0 filas retornadas", lo cual es esperado si el perfil no existe.
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
};

// OLD FUNCTION REMOVED - users are now created by admins with full profiles
// export const updateUserProfile = async (userId: string, profileData: { full_name: string; profession: string; email: string; })

export const deleteEmail = async (emailId: string): Promise<void> => {
  // Primero, borra los adjuntos asociados al email.
  const { error: attachmentsError } = await supabase
    .from('attachments')
    .delete()
    .eq('email_id', emailId);

  if (attachmentsError) {
    console.error('Error deleting attachments:', attachmentsError);
    throw attachmentsError;
  }

  // Luego, borra el email principal.
  const { error: emailError } = await supabase
    .from('emails')
    .delete()
    .eq('id', emailId);

  if (emailError) {
    console.error('Error deleting email:', emailError);
    throw emailError;
  }
};


// --- Case Management Functions ---

export const fetchCases = async (userId: string): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('expedientes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
  return data || [];
};

export const createCase = async (caseData: Omit<Case, 'id' | 'user_id' | 'created_at'>, userId: string): Promise<Case> => {
  const { data, error } = await supabase
    .from('expedientes')
    .insert({ ...caseData, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Case creation failed.');
  return data;
};

export const updateCase = async (caseId: string, updates: Partial<Omit<Case, 'id' | 'user_id' | 'created_at'>>): Promise<Case> => {
  const { data, error } = await supabase
    .from('expedientes')
    .update(updates)
    .eq('id', caseId)
    .select()
    .single();
  if (error) throw error;
  if (!data) throw new Error('Case update failed.');
  return data;
};

export const updateEmailAndAttachmentsCase = async (emailId: string, caseId: string | null): Promise<void> => {
    const payload = { expediente_id: caseId };
    
    const { error: emailError } = await supabase
        .from('emails')
        .update(payload)
        .eq('id', emailId);
    if (emailError) throw emailError;

    const { error: attachmentsError } = await supabase
        .from('attachments')
        .update(payload)
        .eq('email_id', emailId);
    if (attachmentsError) throw attachmentsError;
};

export const fetchAttachmentsForCase = async (caseId: string): Promise<Attachment[]> => {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('expediente_id', caseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const uploadAttachment = async (files: File[], expediente_id: string, email_id: string | null, user_id: string): Promise<Attachment[]> => {
    const formData = new FormData();

    // El webhook espera los archivos bajo la clave 'file'. Al usar la misma clave,
    // el servidor los recibe como un array de archivos.
    files.forEach(file => {
        formData.append('file', file);
    });

    // Los metadatos se aplican a todos los archivos de esta subida.
    formData.append('expediente_id', expediente_id);
    formData.append('user_id', user_id);

    if (email_id) {
        formData.append('email_id', email_id);
    }

    try {
        const response = await fetch(FILE_UPLOAD_WEBHOOK_URL, {
            method: 'POST',
            body: formData,
            // No se establece la cabecera 'Content-Type'; el navegador la configura
            // automáticamente para multipart/form-data con el boundary correcto.
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error subiendo los archivos: ${response.status} ${response.statusText}`;
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson && (errorJson.message || errorJson.error)) {
                    errorMessage = errorJson.message || errorJson.error;
                }
            } catch (e) {
                // Si la respuesta no es JSON, usa el texto plano si está disponible.
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }

        // El webhook debe devolver un array de registros de adjuntos en formato JSON.
        const newAttachments = await response.json();
        return newAttachments as Attachment[];
        
    } catch (error) {
        console.error('Error al subir los archivos adjuntos vía webhook:', error);
        // Relanza el error para que sea capturado por el componente que lo llama.
        throw error;
    }
};

// --- User Management Functions (Admin only) ---

export const fetchOrganizationUsers = async (organizationId: string): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching organization users:', error);
    throw error;
  }
  
  return data || [];
};

export const createUserProfile = async (profileData: {
  user_id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
}): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      ...profileData,
      is_active: true,
      preferences: {}
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to create user profile: no data was returned after insert.');
  }
  
  return data;
};

export const updateUserProfileRole = async (
  profileId: string, 
  role: 'admin' | 'member'
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', profileId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to update user role: no data was returned after update.');
  }
  
  return data;
};

export const toggleUserActive = async (
  profileId: string,
  isActive: boolean
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active: isActive })
    .eq('id', profileId)
    .select()
    .single();
  
  if (error) {
    console.error('Error toggling user active status:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to toggle user active status: no data was returned after update.');
  }
  
  return data;
};

export const deleteUserProfile = async (profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', profileId);
  
  if (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// --- Email Assignment Functions (Admin only) ---

export const assignEmailToUser = async (
  emailId: string,
  userId: string,
  assignedByUserId: string
): Promise<Email> => {
  const { data, error } = await supabase
    .from('emails')
    .update({
      assigned_to_user_id: userId,
      assigned_by_user_id: assignedByUserId,
      assigned_at: new Date().toISOString(),
    })
    .eq('id', emailId)
    .select()
    .single();
  
  if (error) {
    console.error('Error assigning email to user:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to assign email: no data returned');
  }
  
  return data;
};

export const unassignEmail = async (emailId: string): Promise<Email> => {
  const { data, error } = await supabase
    .from('emails')
    .update({
      assigned_to_user_id: null,
      assigned_by_user_id: null,
      assigned_at: null,
    })
    .eq('id', emailId)
    .select()
    .single();
  
  if (error) {
    console.error('Error unassigning email:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to unassign email: no data returned');
  }
  
  return data;
};

export const fetchEmailsWithAssignments = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('emails')
    .select(`
      *,
      assigned_to_user:user_profiles!emails_assigned_to_user_id_fkey(id, full_name, email, role),
      assigned_by_user:user_profiles!emails_assigned_by_user_id_fkey(id, full_name, email)
    `)
    .eq('organization_id', organizationId)
    .order('received_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching emails with assignments:', error);
    throw error;
  }
  
  return data || [];
};