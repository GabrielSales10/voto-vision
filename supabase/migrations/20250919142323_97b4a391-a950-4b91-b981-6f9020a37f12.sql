-- Update the handle_new_user function to extract login from the email format
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, role, login)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'candidato'),
    COALESCE(
      new.raw_user_meta_data->>'login', 
      -- Extract login from email if it's in the format login@voto-vision.local
      CASE 
        WHEN new.email LIKE '%@voto-vision.local' THEN split_part(new.email, '@', 1)
        ELSE split_part(new.email, '@', 1)
      END
    )
  );
  RETURN new;
END;
$$;