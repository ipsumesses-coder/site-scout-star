-- Add uiux_score and uiux_details columns to analysis_results table
ALTER TABLE analysis_results 
ADD COLUMN IF NOT EXISTS uiux_score integer,
ADD COLUMN IF NOT EXISTS uiux_details jsonb DEFAULT '{}'::jsonb;