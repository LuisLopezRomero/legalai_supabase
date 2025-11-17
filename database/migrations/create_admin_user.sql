-- ============================================================
-- CREAR USUARIO ADMIN DESDE CUENTA EXISTENTE
-- ============================================================
-- Este script configura un usuario existente de Supabase Auth
-- como administrador de una organización
-- ============================================================

-- PASO 1: Obtener el user_id del usuario de auth.users
-- (Ejecuta esto primero para ver el ID del usuario)
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'alvarolopezmeastro@gmail.com';

-- Copia el ID que aparece y reemplázalo en la siguiente sección
-- ============================================================

-- PASO 2: Crear organización (si no existe)
-- ============================================================
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
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',  -- ID fijo para referencia
    'Bufete López',
    'bufete-lopez',
    'professional',
    'active',
    'alvarolopezmeastro@gmail.com',
    20
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PASO 3: Crear perfil de usuario ADMIN
-- ============================================================
-- ⚠️ IMPORTANTE: Reemplaza 'USER_ID_AQUI' con el ID del PASO 1

INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active
)
VALUES (
    'USER_ID_AQUI',  -- ⚠️ REEMPLAZAR CON EL ID DEL PASO 1
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Álvaro López',
    'alvarolopezmeastro@gmail.com',
    'admin',  -- ⭐ ROL ADMIN
    true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    is_active = true,
    updated_at = NOW();

-- ============================================================
-- PASO 4: Verificar que se creó correctamente
-- ============================================================
SELECT 
    up.id,
    up.full_name,
    up.email,
    up.role,
    up.is_active,
    o.name as organization_name,
    o.subscription_plan
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.email = 'alvarolopezmeastro@gmail.com';
