// ============================================================
// TIPOS DEL SISTEMA MULTI-USUARIO
// ============================================================

// ============================================================
// ORGANIZACIONES Y USUARIOS
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_plan: 'free' | 'basic' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled';
  subscription_expires_at: string | null;
  settings: Record<string, any>;
  max_users: number;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string; // auth.users.id
  organization_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  role: 'admin' | 'member';
  is_active: boolean;
  last_login_at: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EXPEDIENTES
// ============================================================

export interface Case {
  id: string;
  organization_id: string;
  created_by_user_id: string | null;
  
  // Información básica
  titulo_asunto: string;
  numero_expediente: string | null;
  tipo_asunto: string | null;
  
  // Fechas
  fecha_apertura: string | null;
  fecha_ultima_actuacion: string | null;
  fecha_cierre: string | null;
  
  // Estado y clasificación
  estado: string | null;
  fase_procesal: string | null;
  prioridad: string | null;
  
  // Relaciones
  cliente_id: string | null;
  
  // Partes involucradas
  parte_contraria: string | null;
  abogado_contrario: string | null;
  abogado_responsable_id: string | null;
  procurador_asignado: string | null;
  
  // Información adicional
  notas_comentarios: string | null;
  ubicacion_archivo_fisico: string | null;
  enlace_documentos_digitales: string | null;
  
  // Financiero
  honorarios_pactados: number | null;
  facturado_hasta_fecha: number | null;
  
  // Auditoría
  created_at: string;
  updated_at: string;
}

// ============================================================
// ASIGNACIONES DE EXPEDIENTES
// ============================================================

export interface ExpedienteAssignment {
  id: string;
  expediente_id: string;
  assigned_to_user_id: string;
  assigned_by_user_id: string | null;
  notes: string | null;
  is_primary: boolean;
  assigned_at: string;
  created_at: string;
}

// Vista completa de expediente con asignaciones
export interface CaseWithAssignments extends Case {
  assignments?: ExpedienteAssignment[];
  assigned_users?: UserProfile[];
}

// ============================================================
// EMAILS
// ============================================================

export interface Email {
  id: string;
  organization_id: string;
  
  // Información del email
  subject: string | null;
  sender: string | null;
  received_at: string | null;
  body: string | null;
  
  // Asignación
  expediente_id: string | null;
  assigned_to_user_id: string | null;
  assigned_by_user_id: string | null;
  assigned_at: string | null;
  
  // Estado
  is_processed: boolean;
  
  // Auditoría
  created_at: string;
  updated_at: string;
}

// Vista completa de email con relaciones
export interface EmailWithRelations extends Email {
  expediente?: Case;
  assigned_to_user?: UserProfile;
  assigned_by_user?: UserProfile;
}

// ============================================================
// CLIENTES
// ============================================================

export interface Cliente {
  id: string;
  organization_id: string;
  nombre_completo: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_cliente: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// ADJUNTOS
// ============================================================

export interface Attachment {
  id: string;
  email_id: string | null;
  filename: string;
  storage_path: string;
  mimetype: string;
  created_at: string;
  expediente_id: string | null;
}

// ============================================================
// PROMPTS (IA)
// ============================================================

export interface Prompt {
  id: string;
  user_id: string;
  prompt_name: string | null;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
  prompt_tags: string[] | null;
}

// ============================================================
// CONTEXTO DE AUTENTICACIÓN
// ============================================================

export interface AuthContextType {
  user: any; // Supabase User
  userProfile: UserProfile | null;
  organization: Organization | null;
  isAdmin: boolean;
  isMember: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ============================================================
// ANÁLISIS DE IA (para asignaciones inteligentes)
// ============================================================

export interface EmailAnalysisResult {
  suggestedCases: Array<{
    case: Case;
    confidence: number;
    reasoning: string;
  }>;
  shouldCreateNew: boolean;
  extractedInfo: {
    keywords: string[];
    possibleClientName: string | null;
    urgency: 'low' | 'medium' | 'high';
  };
}

// ============================================================
// TIPOS AUXILIARES
// ============================================================

export type UserRole = 'admin' | 'member';
export type SubscriptionPlan = 'free' | 'basic' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';
export type CaseStatus = 'Abierto' | 'En Juicio' | 'Cerrado' | 'Archivado' | 'En Apelación' | 'Pendiente de Resolución';
export type CasePriority = 'Baja' | 'Normal' | 'Alta' | 'Urgente';
export type CasePhase = 'Inicial' | 'Investigación' | 'Negociación' | 'Juicio' | 'Apelación' | 'Ejecución';
