-- ============================================================
-- SISTEMA MULTI-USUARIO CON ORGANIZACIONES Y ROLES
-- ============================================================
-- Este script crea un sistema completo de gestión multi-usuario
-- con organizaciones, roles (admin/member) y asignaciones.
--
-- IMPORTANTE: Este script BORRA y RECREA las tablas existentes.
-- Asegúrate de hacer backup si tienes datos importantes.
-- ============================================================

-- ============================================================
-- PASO 1: LIMPIAR TABLAS EXISTENTES (EMPEZAR DE CERO)
-- ============================================================

-- Desactivar RLS temporalmente para poder borrar
ALTER TABLE IF EXISTS public.expedientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clientes DISABLE ROW LEVEL SECURITY;

-- Eliminar tablas en orden (respetando foreign keys)
DROP TABLE IF EXISTS public.expediente_assignments CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.expedientes CASCADE;
DROP TABLE IF EXISTS public.emails CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Eliminar funciones y triggers existentes
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================
-- PASO 2: CREAR TABLA DE ORGANIZACIONES
-- ============================================================

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información básica
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- Para URLs amigables: despacho-lopez
    
    -- Suscripción
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    subscription_expires_at TIMESTAMPTZ,
    
    -- Configuración
    settings JSONB DEFAULT '{}'::jsonb,
    max_users INTEGER DEFAULT 5, -- Límite según plan
    
    -- Contacto
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para organizations
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);

-- RLS para organizations (los usuarios pueden ver su organización)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization"
    ON public.organizations
    FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Solo admins pueden actualizar su organización
CREATE POLICY "Admins can update their organization"
    ON public.organizations
    FOR UPDATE
    USING (
        id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.organizations IS 'Organizaciones (despachos) con suscripción y configuración';

-- ============================================================
-- PASO 3: CREAR TABLA DE PERFILES DE USUARIO
-- ============================================================

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Información personal
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    
    -- Rol en la organización
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    -- Configuración personal
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id), -- Un usuario solo tiene un perfil
    UNIQUE(organization_id, email) -- Email único por organización
);

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_organization_id ON public.user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver perfiles de su organización (para colaboración)
CREATE POLICY "Users can view profiles in their organization"
    ON public.user_profiles
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Solo admins pueden insertar nuevos usuarios
CREATE POLICY "Admins can insert users in their organization"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Solo admins pueden actualizar perfiles de su organización
CREATE POLICY "Admins can update users in their organization"
    ON public.user_profiles
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar usuarios
CREATE POLICY "Admins can delete users in their organization"
    ON public.user_profiles
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.user_profiles IS 'Perfiles de usuario con rol y organización';

-- ============================================================
-- PASO 4: RECREAR TABLA EXPEDIENTES CON ORGANIZATION_ID
-- ============================================================

CREATE TABLE public.expedientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Información básica
    titulo_asunto TEXT NOT NULL,
    numero_expediente TEXT,
    tipo_asunto TEXT,
    
    -- Fechas
    fecha_apertura DATE,
    fecha_ultima_actuacion DATE,
    fecha_cierre DATE,
    
    -- Estado y clasificación
    estado TEXT,
    fase_procesal TEXT,
    prioridad TEXT,
    
    -- Relaciones
    cliente_id UUID,
    
    -- Partes involucradas
    parte_contraria TEXT,
    abogado_contrario TEXT,
    abogado_responsable_id UUID,
    procurador_asignado TEXT,
    
    -- Información adicional
    notas_comentarios TEXT,
    ubicacion_archivo_fisico TEXT,
    enlace_documentos_digitales TEXT,
    
    -- Financiero
    honorarios_pactados NUMERIC(10, 2),
    facturado_hasta_fecha NUMERIC(10, 2),
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, numero_expediente) -- Número único por organización
);

-- Índices para expedientes
CREATE INDEX idx_expedientes_organization_id ON public.expedientes(organization_id);
CREATE INDEX idx_expedientes_created_by ON public.expedientes(created_by_user_id);
CREATE INDEX idx_expedientes_numero ON public.expedientes(numero_expediente);
CREATE INDEX idx_expedientes_estado ON public.expedientes(estado);
CREATE INDEX idx_expedientes_fecha_apertura ON public.expedientes(fecha_apertura DESC);

-- RLS para expedientes
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

-- Admins ven todos los expedientes de su organización
-- Members solo ven expedientes asignados a ellos
CREATE POLICY "Users can view expedientes based on role"
    ON public.expedientes
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Si soy admin, veo todos
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_id = auth.uid()
                AND role = 'admin'
            )
            -- Si soy member, solo los asignados a mí
            OR id IN (
                SELECT expediente_id 
                FROM public.expediente_assignments
                WHERE assigned_to_user_id = auth.uid()
            )
        )
    );

-- Todos los usuarios pueden crear expedientes en su organización
CREATE POLICY "Users can create expedientes in their organization"
    ON public.expedientes
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Usuarios pueden actualizar expedientes según su rol
CREATE POLICY "Users can update expedientes based on role"
    ON public.expedientes
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Admins pueden editar todos
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_id = auth.uid()
                AND role = 'admin'
            )
            -- Members solo los asignados
            OR id IN (
                SELECT expediente_id 
                FROM public.expediente_assignments
                WHERE assigned_to_user_id = auth.uid()
            )
        )
    );

-- Solo admins pueden eliminar expedientes
CREATE POLICY "Admins can delete expedientes"
    ON public.expedientes
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.expedientes IS 'Expedientes con organización y control de acceso por rol';

-- ============================================================
-- PASO 5: CREAR TABLA DE ASIGNACIONES DE EXPEDIENTES
-- ============================================================

CREATE TABLE public.expediente_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
    assigned_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    notes TEXT,
    is_primary BOOLEAN DEFAULT true, -- Para casos raros de 2 usuarios
    
    -- Auditoría
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(expediente_id, assigned_to_user_id) -- No duplicar asignaciones
);

-- Índices para expediente_assignments
CREATE INDEX idx_assignments_expediente_id ON public.expediente_assignments(expediente_id);
CREATE INDEX idx_assignments_assigned_to ON public.expediente_assignments(assigned_to_user_id);
CREATE INDEX idx_assignments_assigned_by ON public.expediente_assignments(assigned_by_user_id);

-- RLS para expediente_assignments
ALTER TABLE public.expediente_assignments ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver asignaciones de su organización
CREATE POLICY "Users can view assignments in their organization"
    ON public.expediente_assignments
    FOR SELECT
    USING (
        expediente_id IN (
            SELECT id FROM public.expedientes
            WHERE organization_id IN (
                SELECT organization_id 
                FROM public.user_profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

-- Solo admins pueden crear asignaciones
CREATE POLICY "Admins can create assignments"
    ON public.expediente_assignments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Solo admins pueden actualizar asignaciones
CREATE POLICY "Admins can update assignments"
    ON public.expediente_assignments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar asignaciones
CREATE POLICY "Admins can delete assignments"
    ON public.expediente_assignments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.expediente_assignments IS 'Asignaciones de expedientes a usuarios';

-- ============================================================
-- PASO 6: RECREAR TABLA EMAILS CON ORGANIZATION_ID
-- ============================================================

CREATE TABLE public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Información del email
    subject TEXT,
    sender TEXT,
    received_at TIMESTAMPTZ,
    body TEXT,
    
    -- Asignación
    expediente_id UUID REFERENCES public.expedientes(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    
    -- Estado
    is_processed BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para emails
CREATE INDEX idx_emails_organization_id ON public.emails(organization_id);
CREATE INDEX idx_emails_expediente_id ON public.emails(expediente_id);
CREATE INDEX idx_emails_assigned_to ON public.emails(assigned_to_user_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX idx_emails_is_processed ON public.emails(is_processed);

-- RLS para emails
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Admins ven todos los emails de su organización
-- Members solo ven emails asignados a ellos o de sus expedientes
CREATE POLICY "Users can view emails based on role"
    ON public.emails
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Admins ven todos
            EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_id = auth.uid()
                AND role = 'admin'
            )
            -- Members solo emails asignados o de sus expedientes
            OR assigned_to_user_id = auth.uid()
            OR expediente_id IN (
                SELECT expediente_id 
                FROM public.expediente_assignments
                WHERE assigned_to_user_id = auth.uid()
            )
        )
    );

-- Los emails se insertan automáticamente (webhook), pero por seguridad:
CREATE POLICY "System can insert emails"
    ON public.emails
    FOR INSERT
    WITH CHECK (true); -- Permitir inserción (se hace por webhook/sistema)

-- Solo admins pueden actualizar emails (asignar, procesar)
CREATE POLICY "Admins can update emails"
    ON public.emails
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar emails
CREATE POLICY "Admins can delete emails"
    ON public.emails
    FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.user_profiles 
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

COMMENT ON TABLE public.emails IS 'Emails de organización con asignación a usuarios';

-- ============================================================
-- PASO 7: CREAR TABLA CLIENTES (opcional, para completar)
-- ============================================================

CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Información básica
    nombre_completo TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    
    -- Información adicional
    tipo_cliente TEXT, -- Persona física, empresa, etc.
    notas TEXT,
    
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clientes_organization_id ON public.clientes(organization_id);
CREATE INDEX idx_clientes_nombre ON public.clientes(nombre_completo);

-- RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clientes in their organization"
    ON public.clientes FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage clientes in their organization"
    ON public.clientes FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- PASO 8: FUNCIONES Y TRIGGERS
-- ============================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_expedientes_updated_at
    BEFORE UPDATE ON public.expedientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_emails_updated_at
    BEFORE UPDATE ON public.emails
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PASO 9: DATOS DE EJEMPLO (OPCIONAL)
-- ============================================================

-- Crear organización de ejemplo
INSERT INTO public.organizations (id, name, slug, subscription_plan, contact_email)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Despacho Demo',
    'despacho-demo',
    'professional',
    'contacto@despachodemo.com'
);

-- NOTA: Los perfiles de usuario se crearán cuando los usuarios se registren
-- Por ahora, dejamos esto para configuración manual o mediante trigger

COMMENT ON COLUMN public.organizations.id IS 'ID único de la organización';
COMMENT ON COLUMN public.user_profiles.role IS 'Rol: admin (asignador) o member (usuario normal)';
COMMENT ON COLUMN public.expediente_assignments.is_primary IS 'Indica si es el usuario principal (para casos de múltiples asignaciones)';

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

-- Verificar que todo se creó correctamente
SELECT 
    'organizations' as table_name, 
    count(*) as records 
FROM public.organizations
UNION ALL
SELECT 'user_profiles', count(*) FROM public.user_profiles
UNION ALL
SELECT 'expedientes', count(*) FROM public.expedientes
UNION ALL
SELECT 'expediente_assignments', count(*) FROM public.expediente_assignments
UNION ALL
SELECT 'emails', count(*) FROM public.emails
UNION ALL
SELECT 'clientes', count(*) FROM public.clientes;

-- Mostrar mensaje final
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Sistema multi-usuario creado exitosamente!';
    RAISE NOTICE '📋 Tablas creadas: organizations, user_profiles, expedientes, expediente_assignments, emails, clientes';
    RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
    RAISE NOTICE '🚀 Sistema listo para usar';
END $$;
