-- Verificar que el usuario admin se creó correctamente
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
WHERE up.email = 'alvarolopezmeastro@gmail.com';
