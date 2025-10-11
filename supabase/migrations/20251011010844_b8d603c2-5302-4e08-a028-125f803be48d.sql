-- Fix the search_path security warning by setting it explicitly
DROP FUNCTION IF EXISTS clean_expired_cache();

CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.places_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;