-- ============================================================
-- FORZAR CREACIÓN DE PERFIL - VERSIÓN CON LIMPIEZA
-- ============================================================
-- Este script limpia cualquier conflicto y crea el perfil desde cero
-- ============================================================

-- PASO 1: LIMPIAR datos existentes (por si hay conflictos)
DELETE FROM public.user_profiles 
WHERE user_id = '5278919e-477f-4239-b700-86dc5610de35';

-- PASO 2: Asegurar que existe la organización
DELETE FROM public.organizations 
WHERE slug = 'bufete-lopez';

INSERT INTO public.organizations (
    id,
    name,
    slug,
    subscription_plan,
    subscription_status,
    contact_email,
    max_users,
    created_at,
    updated_at
)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Bufete López',
    'bufete-lopez',
    'professional',
    'active',
    'ofimaticadigital@gmail.com',
    20,
    NOW(),
    NOW()
);

-- PASO 3: Crear el perfil de usuario ADMIN desde cero
INSERT INTO public.user_profiles (
    id,
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    '5278919e-477f-4239-b700-86dc5610de35',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Administrador Principal',
    'ofimaticadigital@gmail.com',
    'admin',
    true,
    NOW(),
    NOW()
);

-- PASO 4: VERIFICAR que se creó correctamente
SELECT 
    '✅ ✅ ✅ PERFIL CREADO EXITOSAMENTE ✅ ✅ ✅' as status;

SELECT 
    up.id as profile_id,
    up.user_id,
    up.full_name,
    up.email,
    up.role,
    up.is_active,
    o.name as organization_name,
    o.slug as organization_slug,
    o.subscription_plan
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.user_id = '5278919e-477f-4239-b700-86dc5610de35';

-- PASO 5: Verificar que NO hay otros perfiles para este user_id
SELECT 
    COUNT(*) as total_profiles_for_this_user
FROM public.user_profiles
WHERE user_id = '5278919e-477f-4239-b700-86dc5610de35';
