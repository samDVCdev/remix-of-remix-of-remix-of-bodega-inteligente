
-- 1. Agregar columna username (único) y email a profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Índice único para username (insensible a mayúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique 
  ON public.profiles (LOWER(username)) 
  WHERE username IS NOT NULL;

-- 3. Índice único para email
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique 
  ON public.profiles (LOWER(email)) 
  WHERE email IS NOT NULL;

-- 4. Copiar emails de auth.users a profiles para los usuarios existentes
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.user_id AND p.email IS NULL;

-- 5. Generar username desde email para los usuarios existentes (parte antes del @)
UPDATE public.profiles
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- 6. Actualizar handle_new_user para incluir username y email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _base_username TEXT;
  _username TEXT;
  _counter INT := 0;
BEGIN
  -- Generar username base desde el email (parte antes del @)
  _base_username := LOWER(SPLIT_PART(NEW.email, '@', 1));
  _username := _base_username;

  -- Asegurar unicidad del username
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = _username) LOOP
    _counter := _counter + 1;
    _username := _base_username || _counter::TEXT;
  END LOOP;

  -- Crear perfil con username y email
  INSERT INTO public.profiles (user_id, full_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    _username
  );

  -- Asignar rol: primer usuario es admin, los demás empleado
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'empleado');
  END IF;

  RETURN NEW;
END;
$$;
