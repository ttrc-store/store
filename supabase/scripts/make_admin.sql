-- TTRC Store: Admin Promotion Helper Script
-- Usage in Supabase SQL Editor or psql:
-- Replace 'user@example.com' with the email address of the registered user to promote.

DO $$
DECLARE
  target_email TEXT := 'admin@ttrc.store'; -- Change to target user's email
  target_user_id UUID;
BEGIN
  -- Find user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Make sure the user has signed up first.', target_email;
  END IF;

  -- Upsert admin role into user_roles table
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id)
  DO UPDATE SET role = 'admin';

  RAISE NOTICE 'Successfully promoted user % (%) to admin role.', target_email, target_user_id;
END $$;
