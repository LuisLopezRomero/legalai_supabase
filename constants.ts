export const SUPABASE_URL = 'https://jzzkvaakfzwftnwukodj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emt2YWFrZnp3ZnRud3Vrb2RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NjU2NjQsImV4cCI6MjA3ODM0MTY2NH0.hgqmN90DomQzl4Fl0a3JxRLXtsuhLJb6fR9f5a-CiV4';
export const BUCKET_NAME = 'adjuntos-emails';

// URL for the Supabase Edge Function that generates signed download URLs.
export const EDGE_FUNCTION_URL = 'https://jzzkvaakfzwftnwukodj.supabase.co/functions/v1/generate-signed-url';

// URL for the AI response generation webhook.
export const WEBHOOK_URL = "https://n8n.srv978987.hstgr.cloud/webhook/prueba-mails"; // To be configured later

// URL for the file upload webhook (via n8n).
export const FILE_UPLOAD_WEBHOOK_URL = 'https://n8n.srv978987.hstgr.cloud/webhook/subida-archivos';