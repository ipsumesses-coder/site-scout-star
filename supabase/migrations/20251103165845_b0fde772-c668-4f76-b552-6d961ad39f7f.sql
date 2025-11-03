-- Add search_query_id column to businesses table to link businesses to their search queries
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS search_query_id UUID REFERENCES public.search_queries(id) ON DELETE SET NULL;