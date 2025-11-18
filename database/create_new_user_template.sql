-- ============================================================
-- CREAR NUEVO USUARIO MANUALMENTE
-- ============================================================
-- Usa este template para crear usuarios hasta que implementemos
-- la API de admin de Supabase
-- ============================================================

-- PASO 1: Crear usuario en auth.users
-- Cambia estos valores:
--   - EMAIL: El email del nuevo usuario
--   - PASSWORD: Una contraseña temporal (el usuario puede cambiarla después)
--   - FULL_NAME: Nombre completo del usuario

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'luis.lopez@ofimaticadigital.es',  -- ⚠️ CAMBIAR EMAIL AQUÍ
  crypt('TempPassword123!', gen_salt('bf')),  -- ⚠️ CAMBIAR PASSWORD AQUÍ
  NOW(),  -- Email confirmado inmediatamente
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Luis López"}'::jsonb,  -- ⚠️ CAMBIAR NOMBRE AQUÍ
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- PASO 2: Obtener el ID del usuario recién creado
SELECT 
  'Usuario de Auth creado exitosamente' as status,
  id as user_id,
  email
FROM auth.users 
WHERE email = 'luis.lopez@ofimaticadigital.es'  -- ⚠️ USAR EL MISMO EMAIL
ORDER BY created_at DESC 
LIMIT 1;

-- COPIAR el 'user_id' que aparece arriba y usarlo en el PASO 3

-- ============================================================
-- PASO 3: Crear perfil de usuario
-- ============================================================
-- Reemplaza 'USER_ID_AQUI' con el ID del PASO 2

INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active
)
VALUES (
    'USER_ID_AQUI',  -- ⚠️ PEGAR EL USER_ID DEL PASO 2
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',  -- ID de "Bufete López"
    'Luis López',  -- ⚠️ MISMO NOMBRE
    'luis.lopez@ofimaticadigital.es',  -- ⚠️ MISMO EMAIL
    'member',  -- ⚠️ CAMBIAR A 'admin' SI ES ADMINISTRADOR
    true
);

-- PASO 4: Verificar que se creó correctamente
SELECT 
    '✅ USUARIO COMPLETO CREADO' as status,
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    o.name as organization_name
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.email = 'luis.lopez@ofimaticadigital.es';  -- ⚠️ USAR EL MISMO EMAIL

-- ============================================================
-- CREDENCIALES PARA LOGIN:
-- ============================================================
-- Email: luis.lopez@ofimaticadigital.es
-- Password: TempPassword123!
-- ============================================================
