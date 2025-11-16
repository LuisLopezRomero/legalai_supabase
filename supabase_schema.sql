-- ============================================
-- LegalAI Supabase Database Schema
-- ============================================
-- Este script crea todas las tablas, índices y políticas RLS necesarias
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- 1. TABLA: user_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. TABLA: expedientes (Cases)
-- ============================================

CREATE TABLE IF NOT EXISTS expedientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero_expediente TEXT,
  titulo_asunto TEXT NOT NULL,
  tipo_asunto TEXT,
  fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_ultima_actuacion TIMESTAMP WITH TIME ZONE,
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'abierto',
  fase_procesal TEXT,
  prioridad TEXT DEFAULT 'media',
  cliente_id TEXT,
  parte_contraria TEXT,
  abogado_contrario TEXT,
  abogado_responsable_id TEXT,
  procurador_asignado TEXT,
  notas_comentarios TEXT,
  ubicacion_archivo_fisico TEXT,
  enlace_documentos_digitales TEXT,
  honorarios_pactados NUMERIC,
  facturado_hasta_fecha NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para expedientes
CREATE INDEX IF NOT EXISTS idx_expedientes_user_id ON expedientes(user_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expedientes_created_at ON expedientes(created_at DESC);

ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para expedientes
DROP POLICY IF EXISTS "Users can view own cases" ON expedientes;
CREATE POLICY "Users can view own cases" 
  ON expedientes FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cases" ON expedientes;
CREATE POLICY "Users can insert own cases" 
  ON expedientes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cases" ON expedientes;
CREATE POLICY "Users can update own cases" 
  ON expedientes FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cases" ON expedientes;
CREATE POLICY "Users can delete own cases" 
  ON expedientes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 3. TABLA: emails
-- ============================================

CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  body TEXT NOT NULL,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para emails
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_expediente_id ON emails(expediente_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_subject ON emails USING gin(to_tsvector('spanish', subject));
CREATE INDEX IF NOT EXISTS idx_emails_body ON emails USING gin(to_tsvector('spanish', body));

ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para emails
DROP POLICY IF EXISTS "Users can view own emails" ON emails;
CREATE POLICY "Users can view own emails" 
  ON emails FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails" ON emails;
CREATE POLICY "Users can insert own emails" 
  ON emails FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own emails" ON emails;
CREATE POLICY "Users can update own emails" 
  ON emails FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own emails" ON emails;
CREATE POLICY "Users can delete own emails" 
  ON emails FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 4. TABLA: attachments
-- ============================================

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para attachments
CREATE INDEX IF NOT EXISTS idx_attachments_email_id ON attachments(email_id);
CREATE INDEX IF NOT EXISTS idx_attachments_expediente_id ON attachments(expediente_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at DESC);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para attachments
DROP POLICY IF EXISTS "Users can view own attachments" ON attachments;
CREATE POLICY "Users can view own attachments" 
  ON attachments FOR SELECT 
  USING (
    email_id IN (
      SELECT id FROM emails WHERE user_id = auth.uid()
    )
    OR expediente_id IN (
      SELECT id FROM expedientes WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert attachments" ON attachments;
CREATE POLICY "Users can insert attachments" 
  ON attachments FOR INSERT 
  WITH CHECK (
    email_id IN (
      SELECT id FROM emails WHERE user_id = auth.uid()
    )
    OR expediente_id IN (
      SELECT id FROM expedientes WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own attachments" ON attachments;
CREATE POLICY "Users can delete own attachments" 
  ON attachments FOR DELETE 
  USING (
    email_id IN (
      SELECT id FROM emails WHERE user_id = auth.uid()
    )
    OR expediente_id IN (
      SELECT id FROM expedientes WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. TABLA: prompts
-- ============================================

CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_name TEXT,
  prompt_text TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  prompt_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para prompts
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at DESC);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para prompts
DROP POLICY IF EXISTS "Users can view own prompts" ON prompts;
CREATE POLICY "Users can view own prompts" 
  ON prompts FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own prompts" ON prompts;
CREATE POLICY "Users can insert own prompts" 
  ON prompts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own prompts" ON prompts;
CREATE POLICY "Users can update own prompts" 
  ON prompts FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prompts" ON prompts;
CREATE POLICY "Users can delete own prompts" 
  ON prompts FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- 6. FUNCIONES ÚTILES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_expedientes_updated_at ON expedientes;
CREATE TRIGGER update_expedientes_updated_at
    BEFORE UPDATE ON expedientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_emails_updated_at ON emails;
CREATE TRIGGER update_emails_updated_at
    BEFORE UPDATE ON emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VERIFICACIÓN
-- ============================================

-- Verificar que todas las tablas existen
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('user_profiles', 'expedientes', 'emails', 'attachments', 'prompts');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ Todas las tablas se crearon correctamente';
    ELSE
        RAISE WARNING '⚠️  Solo se crearon % de 5 tablas', table_count;
    END IF;
END $$;

-- Verificar que RLS está habilitado
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('user_profiles', 'expedientes', 'emails', 'attachments', 'prompts')
    AND rowsecurity = true;
    
    IF rls_count = 5 THEN
        RAISE NOTICE '✅ RLS habilitado en todas las tablas';
    ELSE
        RAISE WARNING '⚠️  RLS solo está habilitado en % de 5 tablas', rls_count;
    END IF;
END $$;

-- Mostrar resumen de políticas
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Notas:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Crear bucket 'adjuntos-emails' manualmente en Storage
-- 3. Configurar políticas de Storage desde el dashboard
-- 4. Agregar GEMINI_API_KEY en .env.local para IA
