-- Fix: trigger was using ON CONFLICT (id) but email has a UNIQUE constraint
-- When an existing email/password user tries OAuth, the email insert conflict caused
-- "Database error saving new user" and rolled back the entire auth.users insert.
-- Fix: use ON CONFLICT (email) so existing users are updated rather than erroring.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, password_hash, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'New User'),
    new.raw_user_meta_data->>'avatar_url',
    'managed_by_supabase_auth',
    now(),
    now()
  )
  ON CONFLICT (email) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = now();
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't fail the auth.users insert. The callback route handles user sync.
  RAISE WARNING 'handle_new_user: failed to sync user % to public.users: %', new.email, SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
