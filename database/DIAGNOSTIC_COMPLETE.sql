-- ============================================================
-- DIAGNÓSTICO COMPLETO DEL SISTEMA
-- ============================================================
-- Ejecuta este SQL para ver el estado actual de tu base de datos
-- ============================================================

-- 1. Ver TODOS los usuarios de auth.users
SELECT 
    '=== USUARIOS DE AUTENTICACIÓN ===' as section,
    NULL as id,
    NULL as email,
    NULL as created_at;

SELECT 
    'auth.users' as source,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Ver TODAS las organizaciones
SELECT 
    '=== ORGANIZACIONES ===' as section,
    NULL as id,
    NULL as name,
    NULL as slug;

SELECT 
    'organizations' as source,
    id,
    name,
    slug,
    subscription_plan,
    contact_email
FROM public.organizations
ORDER BY created_at DESC;

-- 3. Ver TODOS los perfiles de usuario
SELECT 
    '=== PERFILES DE USUARIO ===' as section,
    NULL as user_id,
    NULL as email,
    NULL as role;

SELECT 
    'user_profiles' as source,
    user_id,
    email,
    role,
    is_active,
    full_name,
    organization_id
FROM public.user_profiles
ORDER BY created_at DESC;

-- 4. Buscar específicamente el usuario problemático
SELECT 
    '=== BÚSQUEDA ESPECÍFICA: 5278919e-477f-4239-b700-86dc5610de35 ===' as section,
    NULL as found_in;

SELECT 
    'auth.users' as found_in,
    email,
    created_at
FROM auth.users 
WHERE id = '5278919e-477f-4239-b700-86dc5610de35';

SELECT 
    'user_profiles' as found_in,
    email,
    role,
    is_active
FROM public.user_profiles 
WHERE user_id = '5278919e-477f-4239-b700-86dc5610de35';

-- 5. Ver si hay algún perfil huérfano (sin organización)
SELECT 
    '=== PERFILES SIN ORGANIZACIÓN ===' as section,
    NULL as user_id;

SELECT 
    user_id,
    email,
    role,
    organization_id
FROM public.user_profiles
WHERE organization_id IS NULL 
   OR organization_id NOT IN (SELECT id FROM public.organizations);
