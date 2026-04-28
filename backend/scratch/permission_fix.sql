-- ================================================================
-- PERMISSION FIX FOR FRESH SUPABASE INSTALL
-- ================================================================

-- 1. Ensure public schema is accessible
GRANT USAGE ON SCHEMA public TO supabase_auth_admin, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin, postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin, postgres;

-- 2. Explicitly allow Auth to call the profile trigger
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3. Double check the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
