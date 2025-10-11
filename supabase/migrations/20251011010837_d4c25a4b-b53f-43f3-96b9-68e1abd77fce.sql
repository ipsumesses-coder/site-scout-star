-- Create a cache table for storing Google Places API results
CREATE TABLE IF NOT EXISTS public.places_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  location TEXT NOT NULL,
  industry TEXT,
  radius INTEGER NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_places_cache_key ON public.places_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_places_cache_expires_at ON public.places_cache(expires_at);

-- Enable RLS
ALTER TABLE public.places_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache (edge functions use service role)
CREATE POLICY "Service role can manage places cache"
ON public.places_cache
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.places_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;