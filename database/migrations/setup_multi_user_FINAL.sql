-- ============================================================
-- SISTEMA MULTI-USUARIO - VERSION CORRECTA
-- ============================================================
-- Este script crea el sistema en DOS FASES para evitar errores
-- de dependencias circulares en las políticas RLS
-- ============================================================

-- ============================================================
-- LIMPIEZA INICIAL
-- ============================================================

DROP TABLE IF EXISTS public.expediente_assignments CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.expedientes CASCADE;
DROP TABLE IF EXISTS public.emails CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- ============================================================
-- FASE 1: CREAR TODAS LAS TABLAS (SIN RLS)
-- ============================================================

-- Tabla: organizations
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    subscription_expires_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    max_users INTEGER DEFAULT 5,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: user_profiles
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(organization_id, email)
);

-- Tabla: expedientes
CREATE TABLE public.expedientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo_asunto TEXT NOT NULL,
    numero_expediente TEXT,
    tipo_asunto TEXT,
    fecha_apertura DATE,
    fecha_ultima_actuacion DATE,
    fecha_cierre DATE,
    estado TEXT,
    fase_procesal TEXT,
    prioridad TEXT,
    cliente_id UUID,
    parte_contraria TEXT,
    abogado_contrario TEXT,
    abogado_responsable_id UUID,
    procurador_asignado TEXT,
    notas_comentarios TEXT,
    ubicacion_archivo_fisico TEXT,
    enlace_documentos_digitales TEXT,
    honorarios_pactados NUMERIC(10, 2),
    facturado_hasta_fecha NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, numero_expediente)
);

-- Tabla: expediente_assignments
CREATE TABLE public.expediente_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
    assigned_to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    is_primary BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(expediente_id, assigned_to_user_id)
);

-- Tabla: emails
CREATE TABLE public.emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    subject TEXT,
    sender TEXT,
    received_at TIMESTAMPTZ,
    body TEXT,
    expediente_id UUID REFERENCES public.expedientes(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: clientes
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    tipo_cliente TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREAR INDICES
-- ============================================================

CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_organization_id ON public.user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX idx_expedientes_organization_id ON public.expedientes(organization_id);
CREATE INDEX idx_expedientes_created_by ON public.expedientes(created_by_user_id);
CREATE INDEX idx_expedientes_numero ON public.expedientes(numero_expediente);
CREATE INDEX idx_expedientes_estado ON public.expedientes(estado);
CREATE INDEX idx_expedientes_fecha_apertura ON public.expedientes(fecha_apertura DESC);

CREATE INDEX idx_assignments_expediente_id ON public.expediente_assignments(expediente_id);
CREATE INDEX idx_assignments_assigned_to ON public.expediente_assignments(assigned_to_user_id);
CREATE INDEX idx_assignments_assigned_by ON public.expediente_assignments(assigned_by_user_id);

CREATE INDEX idx_emails_organization_id ON public.emails(organization_id);
CREATE INDEX idx_emails_expediente_id ON public.emails(expediente_id);
CREATE INDEX idx_emails_assigned_to ON public.emails(assigned_to_user_id);
CREATE INDEX idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX idx_emails_is_processed ON public.emails(is_processed);

CREATE INDEX idx_clientes_organization_id ON public.clientes(organization_id);
CREATE INDEX idx_clientes_nombre ON public.clientes(nombre_completo);

-- ============================================================
-- FASE 2: HABILITAR RLS Y CREAR POLITICAS
-- ============================================================

-- RLS: organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization" ON public.organizations FOR SELECT USING (
    id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update their organization" ON public.organizations FOR UPDATE USING (
    id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view profiles in their organization" ON public.user_profiles FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can insert users in their organization" ON public.user_profiles FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update users in their organization" ON public.user_profiles FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete users in their organization" ON public.user_profiles FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: expedientes
ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expedientes based on role" ON public.expedientes FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
        OR id IN (SELECT expediente_id FROM public.expediente_assignments WHERE assigned_to_user_id = auth.uid())
    )
);

CREATE POLICY "Users can create expedientes in their organization" ON public.expedientes FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update expedientes based on role" ON public.expedientes FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
        OR id IN (SELECT expediente_id FROM public.expediente_assignments WHERE assigned_to_user_id = auth.uid())
    )
);

CREATE POLICY "Admins can delete expedientes" ON public.expedientes FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: expediente_assignments
ALTER TABLE public.expediente_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assignments in their organization" ON public.expediente_assignments FOR SELECT USING (
    expediente_id IN (SELECT id FROM public.expedientes WHERE organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Admins can create assignments" ON public.expediente_assignments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update assignments" ON public.expediente_assignments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete assignments" ON public.expediente_assignments FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: emails
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emails based on role" ON public.emails FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
        OR assigned_to_user_id = auth.uid()
        OR expediente_id IN (SELECT expediente_id FROM public.expediente_assignments WHERE assigned_to_user_id = auth.uid())
    )
);

CREATE POLICY "System can insert emails" ON public.emails FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update emails" ON public.emails FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete emails" ON public.emails FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS: clientes
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clientes in their organization" ON public.clientes FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage clientes in their organization" ON public.clientes FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.user_profiles WHERE user_id = auth.uid())
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_expedientes_updated_at BEFORE UPDATE ON public.expedientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_emails_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- INSERTAR ORGANIZACION DE EJEMPLO
-- ============================================================

INSERT INTO public.organizations (id, name, slug, subscription_plan, contact_email)
VALUES ('00000000-0000-0000-0000-000000000001', 'Despacho Demo', 'despacho-demo', 'professional', 'contacto@despachodemo.com');

-- ============================================================
-- VERIFICACION FINAL
-- ============================================================

SELECT 'organizations' as table_name, count(*) as records FROM public.organizations
UNION ALL SELECT 'user_profiles', count(*) FROM public.user_profiles
UNION ALL SELECT 'expedientes', count(*) FROM public.expedientes
UNION ALL SELECT 'expediente_assignments', count(*) FROM public.expediente_assignments
UNION ALL SELECT 'emails', count(*) FROM public.emails
UNION ALL SELECT 'clientes', count(*) FROM public.clientes;
