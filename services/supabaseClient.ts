import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Crea un único cliente de Supabase para interactuar con tu proyecto.
// Utiliza las credenciales de tu archivo de constantes.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
