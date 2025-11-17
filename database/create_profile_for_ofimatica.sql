-- ============================================================
-- CREAR PERFIL DE USUARIO ADMIN PARA ofimaticadigital@gmail.com
-- ============================================================
-- Usuario ID: 5278919e-477f-4239-b700-86dc5610de35
-- ============================================================

-- PASO 1: Verificar/Crear organización
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
    'ofimaticadigital@gmail.com',
    20
)
ON CONFLICT (slug) DO UPDATE SET
    contact_email = EXCLUDED.contact_email,
    updated_at = NOW();

-- PASO 2: Crear perfil de usuario ADMIN usando el user_id exacto
INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active
)
VALUES (
    '5278919e-477f-4239-b700-86dc5610de35',  -- ID exacto del usuario autenticado
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',  -- ID de la organización
    'Usuario Admin',  -- Puedes cambiar este nombre
    'ofimaticadigital@gmail.com',
    'admin',  -- ⭐ ROL ADMIN
    true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    is_active = true,
    organization_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    updated_at = NOW();

-- PASO 3: Verificar que se creó correctamente
SELECT 
    'Perfil Creado Exitosamente' as status,
    up.id as profile_id,
    up.user_id,
    up.full_name,
    up.email,
    up.role,
    up.is_active,
    o.name as organization_name,
    o.subscription_plan
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.user_id = '5278919e-477f-4239-b700-86dc5610de35';
