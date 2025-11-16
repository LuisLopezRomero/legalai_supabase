export interface Case {
  id: string;
  user_id: string;
  numero_expediente: string | null;
  titulo_asunto: string;
  tipo_asunto: string | null;
  fecha_apertura: string;
  fecha_ultima_actuacion: string | null;
  fecha_cierre: string | null;
  estado: string;
  fase_procesal: string | null;
  prioridad: string | null;
  cliente_id: string | null;
  parte_contraria: string | null;
  abogado_contrario: string | null;
  abogado_responsable_id: string | null;
  procurador_asignado: string | null;
  notas_comentarios: string | null;
  ubicacion_archivo_fisico: string | null;
  enlace_documentos_digitales: string | null;
  honorarios_pactados: number | null;
  facturado_hasta_fecha: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Email {
  id: string;
  user_id: string | null; // Puede ser null según tu schema
  subject: string | null; // Puede ser null según tu schema
  sender: string | null; // Puede ser null según tu schema
  received_at: string | null; // Puede ser null según tu schema
  body: string | null; // Puede ser null según tu schema
  created_at: string;
  updated_at: string;
  expediente_id: string | null;
}

export interface Attachment {
  id: string;
  email_id: string | null;
  filename: string;
  storage_path: string;
  mimetype: string;
  created_at: string;
  expediente_id: string | null;
}

export interface Prompt {
  id: string;
  user_id: string;
  prompt_name: string | null;
  prompt_text: string;
  created_at: string;
  is_favorite: boolean;
  prompt_tags: string[] | null;
}

export interface UserProfile {
  id: string; // This will be the user_id from auth.users
  email: string;
  full_name: string;
  profession: string;
  created_at: string;
}