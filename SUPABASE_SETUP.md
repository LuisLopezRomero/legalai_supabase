# 🗄️ Configuración de Supabase para LegalAI

Este documento contiene todo lo necesario para configurar la base de datos de Supabase para la aplicación LegalAI.

## 📋 Índice

1. [Tablas Requeridas](#tablas-requeridas)
2. [Políticas de Seguridad (RLS)](#políticas-de-seguridad-rls)
3. [Storage Buckets](#storage-buckets)
4. [Variables de Entorno](#variables-de-entorno)
5. [Verificación](#verificación)

---

## 1. Tablas Requeridas

### 1.1 Tabla `user_profiles`

Almacena información adicional de los usuarios.

```sql
-- Crear tabla de perfiles de usuario
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  profession TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver y editar solo su propio perfil
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

---

### 1.2 Tabla `expedientes` (Cases)

Almacena los expedientes legales.

```sql
-- Crear tabla de expedientes
CREATE TABLE expedientes (
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

-- Índices para mejorar rendimiento
CREATE INDEX idx_expedientes_user_id ON expedientes(user_id);
CREATE INDEX idx_expedientes_numero ON expedientes(numero_expediente);
CREATE INDEX idx_expedientes_estado ON expedientes(estado);

-- Habilitar RLS
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios solo pueden ver sus propios expedientes
CREATE POLICY "Users can view own cases" 
  ON expedientes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cases" 
  ON expedientes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cases" 
  ON expedientes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cases" 
  ON expedientes FOR DELETE 
  USING (auth.uid() = user_id);
```

---

### 1.3 Tabla `emails`

Almacena los correos electrónicos.

```sql
-- Crear tabla de emails
CREATE TABLE emails (
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

-- Índices
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_expediente_id ON emails(expediente_id);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);

-- Habilitar RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own emails" 
  ON emails FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails" 
  ON emails FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails" 
  ON emails FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emails" 
  ON emails FOR DELETE 
  USING (auth.uid() = user_id);
```

---

### 1.4 Tabla `attachments`

Almacena los adjuntos de los emails.

```sql
-- Crear tabla de adjuntos
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  expediente_id UUID REFERENCES expedientes(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_attachments_email_id ON attachments(email_id);
CREATE INDEX idx_attachments_expediente_id ON attachments(expediente_id);

-- Habilitar RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Políticas: Los usuarios pueden ver adjuntos de sus propios emails
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
```

---

### 1.5 Tabla `prompts`

Almacena los prompts de IA guardados por los usuarios.

```sql
-- Crear tabla de prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_name TEXT,
  prompt_text TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  prompt_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_is_favorite ON prompts(is_favorite);

-- Habilitar RLS
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own prompts" 
  ON prompts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prompts" 
  ON prompts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prompts" 
  ON prompts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompts" 
  ON prompts FOR DELETE 
  USING (auth.uid() = user_id);
```

---

## 2. Políticas de Seguridad (RLS)

### ✅ Verificación de RLS

Para verificar que RLS está habilitado en todas las tablas:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'expedientes', 'emails', 'attachments', 'prompts');
```

Todas las tablas deben mostrar `rowsecurity = true`.

---

## 3. Storage Buckets

### 3.1 Crear Bucket para Adjuntos

En el panel de Supabase, ve a **Storage** y crea un bucket llamado `adjuntos-emails`.

**Configuración:**
- **Public:** No (privado)
- **Allowed MIME types:** Todos

### 3.2 Políticas de Storage

```sql
-- Política para permitir a los usuarios subir archivos
CREATE POLICY "Users can upload own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'adjuntos-emails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir a los usuarios ver sus archivos
CREATE POLICY "Users can view own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'adjuntos-emails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para permitir a los usuarios eliminar sus archivos
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'adjuntos-emails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 4. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
SUPABASE_URL=https://jzzkvaakfzwftnwukodj.supabase.co
SUPABASE_ANON_KEY=tu-anon-key-aqui

# Gemini AI (para análisis inteligente de emails)
GEMINI_API_KEY=tu-gemini-api-key-aqui

# Opcional: Webhooks de n8n
WEBHOOK_URL=https://n8n.srv978987.hstgr.cloud/webhook/prueba-mails
FILE_UPLOAD_WEBHOOK_URL=https://n8n.srv978987.hstgr.cloud/webhook/subida-archivos
```

---

## 5. Verificación

### 5.1 Verificar Tablas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'expedientes', 'emails', 'attachments', 'prompts');
```

Deberías ver las 5 tablas listadas.

### 5.2 Verificar RLS

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas las tablas de `public` deben tener `rowsecurity = true`.

### 5.3 Verificar Políticas

```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

Deberías ver múltiples políticas para cada tabla.

---

## 📝 Notas Importantes

### Asignación Inteligente con IA

La nueva funcionalidad de asignación inteligente de expedientes requiere:

1. ✅ **Tabla `expedientes`** debe existir con todos los campos
2. ✅ **Tabla `emails`** debe tener el campo `expediente_id`
3. ✅ **Políticas RLS** deben permitir SELECT en ambas tablas
4. ✅ **GEMINI_API_KEY** configurada en `.env.local`

### Relaciones entre Tablas

```
auth.users (Supabase Auth)
    ↓
user_profiles (1:1)
    ↓
expedientes (1:N)
    ↓
emails (N:1) ← expediente_id
    ↓
attachments (1:N)
```

---

## 🚀 Próximos Pasos

1. **Ejecutar todos los scripts SQL** en el editor SQL de Supabase
2. **Crear el bucket** `adjuntos-emails` en Storage
3. **Configurar variables de entorno** en `.env.local`
4. **Reiniciar la aplicación** con `npm run dev`
5. **Probar funcionalidades**:
   - Registro e inicio de sesión
   - Completar perfil
   - Ver emails
   - Crear expedientes
   - Asignar emails a expedientes con IA
   - Subir adjuntos

---

## ❓ Solución de Problemas

### Error: "new row violates row-level security policy"

**Causa:** Las políticas RLS no permiten la operación.

**Solución:**
1. Verifica que el usuario esté autenticado
2. Confirma que las políticas RLS están creadas correctamente
3. Revisa que `auth.uid()` coincida con `user_id` en los registros

### Error: "Failed to fetch"

**Causa:** Las tablas no existen o RLS está bloqueando acceso.

**Solución:**
1. Verifica que todas las tablas estén creadas
2. Confirma que RLS está habilitado
3. Revisa las políticas con la consulta de verificación

### La IA no sugiere expedientes

**Causa:** `GEMINI_API_KEY` no configurada o sin créditos.

**Solución:**
1. Agrega `GEMINI_API_KEY` en `.env.local`
2. Verifica que tienes créditos en Google AI Studio
3. El sistema usará análisis simple como fallback

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de Supabase en el Dashboard
2. Verifica las políticas RLS
3. Comprueba las variables de entorno
4. Revisa la consola del navegador para errores

---

**¡Listo! Tu base de datos de Supabase está configurada y lista para usar con LegalAI! 🎉**
