-- ============================================================
-- CONFIGURACIÓN AUTOMÁTICA DE USUARIO ADMIN
-- ============================================================
-- Este script crea automáticamente la organización y perfil admin
-- usando el email existente en auth.users
-- ============================================================

-- PASO 1: Crear organización (si no existe)
INSERT INTO public.organizations (
    id,
    name,
    slug,
    subscription_plan,
    subscription_status,
    contact_email,
    max_users
)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Bufete López',
    'bufete-lopez',
    'professional',
    'active',
    'alvarolopezmeastro@gmail.com',
    20
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    subscription_plan = EXCLUDED.subscription_plan,
    contact_email = EXCLUDED.contact_email;

-- PASO 2: Crear perfil admin usando el user_id de auth.users
INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active
)
SELECT 
    au.id,  -- user_id desde auth.users
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Álvaro López',
    au.email,
    'admin',
    true
FROM auth.users au
WHERE au.email = 'alvarolopezmeastro@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    is_active = true,
    organization_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    updated_at = NOW();

-- PASO 3: Verificar la configuración
SELECT 
    'Usuario Admin Configurado' as status,
    up.id as profile_id,
    up.user_id,
    up.full_name,
    up.email,
    up.role,
    up.is_active,
    o.name as organization_name,
    o.subscription_plan,
    o.slug as organization_slug
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.email = 'alvarolopezmeastro@gmail.com';
