-- =============================================================================
-- AquaTrack: Supabase Auth → public."User" sync trigger
-- =============================================================================
-- Run this script once in the Supabase SQL Editor after applying the Prisma
-- migration. It installs a PostgreSQL trigger that automatically inserts a
-- corresponding row into public."User" whenever Supabase Auth creates a new
-- account in auth.users.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste & Run
-- =============================================================================

-- 1. Allow the User.phone column to be nullable for self-registered accounts
--    (field crew and admin accounts set it manually later via admin panel).
ALTER TABLE "User" ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN phone SET DEFAULT '';

-- 2. The trigger function: called after every INSERT on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER                        -- runs with owner privileges to write to public schema
SET search_path = public
AS $$
BEGIN
  INSERT INTO public."User" (
    id,
    name,
    email,
    role,
    phone,
    "serviceAccountNo"
  )
  VALUES (
    NEW.id::text,                       -- Supabase Auth UUID → User.id (links auth to app row)
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)     -- fallback: use the email prefix as display name
    ),
    NEW.email,
    'CONSUMER_RESIDENT',               -- default role for self-registered users
    COALESCE(
      NEW.raw_user_meta_data->>'phone', -- optional phone if provided during sign-up
      ''
    ),
    NULL                               -- serviceAccountNo assigned later by admin
  )
  ON CONFLICT (id) DO NOTHING;        -- idempotent: skip if a row already exists for this UUID

  RETURN NEW;
END;
$$;

-- 3. Attach the trigger to auth.users
--    Drops and recreates to ensure idempotent re-runs.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_auth_user();
