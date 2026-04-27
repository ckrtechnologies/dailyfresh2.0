-- FIX: CASCADE DELETE FOR STORES AND MANAGERS
-- Created: 2026-04-27

-- 1. Ensure Store -> Profile cascade
-- When a manager's profile is deleted, the store record is automatically removed.
ALTER TABLE public.stores 
DROP CONSTRAINT IF EXISTS stores_manager_user_id_fkey,
ADD CONSTRAINT stores_manager_user_id_fkey 
FOREIGN KEY (manager_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Ensure Rider -> Profile cascade
-- When a rider's profile is deleted, their rider data is removed.
ALTER TABLE public.riders
DROP CONSTRAINT IF EXISTS riders_user_id_fkey,
ADD CONSTRAINT riders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Ensure Products -> Store cascade
-- When a physical store is deleted, all its products are wiped.
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_store_id_fkey,
ADD CONSTRAINT products_store_id_fkey 
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- 4. CRITICAL: Trigger to delete Auth User when Profile is deleted
-- This ensures that deleting a record in the public schema (Profile) 
-- also removes the corresponding account in the auth.users table.
-- This requires SECURITY DEFINER to bypass schema restrictions.

CREATE OR REPLACE FUNCTION public.handle_delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the user from Supabase Auth schema
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_auth_user();

-- 5. Optional: Cascade delete for other linked data
-- Delete addresses when profile is deleted (already exists in initial schema but confirming)
-- ALTER TABLE public.addresses DROP CONSTRAINT IF EXISTS addresses_user_id_fkey, ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
