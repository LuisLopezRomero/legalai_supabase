-- Verificar todos los usuarios y sus perfiles
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.created_at as registered_at,
    up.id as profile_id,
    up.full_name,
    up.role,
    up.is_active,
    o.name as organization_name
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
LEFT JOIN public.organizations o ON up.organization_id = o.id
ORDER BY au.created_at DESC;
