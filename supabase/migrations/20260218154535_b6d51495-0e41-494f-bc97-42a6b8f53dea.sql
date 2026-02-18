
-- 1. Crear el trigger que registra nuevos usuarios automáticamente
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Insertar perfiles faltantes para usuarios que ya existen en auth.users
INSERT INTO public.profiles (user_id, full_name, is_active)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  true
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE p.user_id IS NULL;

-- 3. Insertar roles faltantes para usuarios que ya tienen perfil pero no rol
-- El primero que se registró (el más antiguo) se queda como admin, los demás como empleado
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  CASE 
    WHEN au.id = (SELECT user_id FROM public.user_roles ORDER BY created_at ASC LIMIT 1)
    THEN 'admin'::app_role
    ELSE 'empleado'::app_role
  END
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL;
