-- ============================================================
-- CREAR USUARIO: Luis López
-- ============================================================
-- Email: luis.lopez@ofimaticadigital.es
-- Password: Luis123!
-- Rol: member (Usuario Normal)
-- Organización: Bufete López
-- ============================================================

DO $$
DECLARE
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
    'luis.lopez@ofimaticadigital.es',
    crypt('Luis123!', gen_salt('bf')),
    NOW(),  -- Email confirmado inmediatamente
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Luis López"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;
  
  -- Crear perfil de usuario
  INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role,
    is_active,
    preferences,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',  -- Bufete López
    'Luis López',
    'luis.lopez@ofimaticadigital.es',
    'member',  -- Usuario normal (no admin)
    true,
    '{}'::jsonb,
    NOW(),
    NOW()
  );
  
  -- Mensaje de éxito
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '✅ USUARIO CREADO EXITOSAMENTE';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE 'Email:        luis.lopez@ofimaticadigital.es';
  RAISE NOTICE 'Password:     Luis123!';
  RAISE NOTICE 'Nombre:       Luis López';
  RAISE NOTICE 'Rol:          member (Usuario Normal)';
  RAISE NOTICE 'Organización: Bufete López';
  RAISE NOTICE 'User ID:      %', v_user_id;
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Para hacer login:';
  RAISE NOTICE '   1. Ve a la aplicación';
  RAISE NOTICE '   2. Usa: luis.lopez@ofimaticadigital.es';
  RAISE NOTICE '   3. Password: Luis123!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Como MEMBER, Luis podrá:';
  RAISE NOTICE '   ✅ Ver expedientes asignados a él';
  RAISE NOTICE '   ✅ Crear nuevos expedientes';
  RAISE NOTICE '   ✅ Editar expedientes asignados';
  RAISE NOTICE '   ✅ Ver emails asignados a él';
  RAISE NOTICE '   ❌ NO puede ver todos los emails';
  RAISE NOTICE '   ❌ NO puede asignar expedientes a otros';
  RAISE NOTICE '   ❌ NO puede gestionar usuarios';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
END $$;

-- Verificar que se creó correctamente
SELECT 
    '✅ VERIFICACIÓN FINAL' as status,
    up.id as profile_id,
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    o.name as organization_name,
    o.slug as organization_slug,
    up.created_at
FROM public.user_profiles up
JOIN public.organizations o ON up.organization_id = o.id
WHERE up.email = 'luis.lopez@ofimaticadigital.es'
ORDER BY up.created_at DESC
LIMIT 1;

-- Ver todos los usuarios de la organización
SELECT 
    '📊 USUARIOS DE BUFETE LÓPEZ' as info,
    COUNT(*) as total_usuarios
FROM public.user_profiles
WHERE organization_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

SELECT 
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    CASE 
        WHEN up.role = 'admin' THEN '👑 Administrador'
        ELSE '👤 Usuario Normal'
    END as tipo
FROM public.user_profiles up
WHERE up.organization_id = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d'
ORDER BY 
    CASE WHEN up.role = 'admin' THEN 0 ELSE 1 END,
    up.created_at;
