-- Make password_hash optional since we use Supabase Auth
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Update the trigger function to be safer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, password_hash, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'avatar_url',
    'managed_by_supabase_auth', -- Placeholder for legacy compatibility
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
