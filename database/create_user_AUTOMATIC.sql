-- ============================================================
-- CREAR NUEVO USUARIO AUTOMÁTICAMENTE (VERSIÓN SIMPLIFICADA)
-- ============================================================
-- Solo cambia los valores marcados con ⚠️ y ejecuta todo junto
-- ============================================================

-- ⚠️ CONFIGURACIÓN - CAMBIAR ESTOS VALORES:
DO $$
DECLARE
  v_email TEXT := 'luis.lopez@ofimaticadigital.es';  -- ⚠️ EMAIL DEL NUEVO USUARIO
  v_password TEXT := 'TempPassword123!';              -- ⚠️ CONTRASEÑA TEMPORAL
  v_full_name TEXT := 'Luis López';                   -- ⚠️ NOMBRE COMPLETO
  v_role TEXT := 'member';                            -- ⚠️ 'admin' o 'member'
  v_organization_id UUID := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';  -- ID de Bufete López
  v_user_id UUID;
BEGIN
  -- Crear usuario en auth.users
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
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', v_full_name),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;
  
  -- Crear perfil de usuario
  INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active
  )
  VALUES (
    v_user_id,
    v_organization_id,
    v_full_name,
    v_email,
    v_role,
    true
  );
  
  -- Mostrar resultado
  RAISE NOTICE '✅ Usuario creado exitosamente';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Password: %', v_password;
  RAISE NOTICE 'Rol: %', v_role;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verificar que se creó correctamente
SELECT 
    '✅ VERIFICACIÓN FINAL' as status,
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    o.name as organization_name
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.email = 'luis.lopez@ofimaticadigital.es'  -- ⚠️ USAR EL MISMO EMAIL DE ARRIBA
ORDER BY up.created_at DESC
LIMIT 1;
