-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT,
  location TEXT,
  industry TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  social_media JSONB DEFAULT '{}',
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_analyzed TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'analyzing', 'analyzed', 'error'))
);

-- Create analysis_results table
CREATE TABLE public.analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seo_score INTEGER NOT NULL CHECK (seo_score >= 0 AND seo_score <= 100),
  design_score INTEGER NOT NULL CHECK (design_score >= 0 AND design_score <= 100),
  branding_score INTEGER NOT NULL CHECK (branding_score >= 0 AND branding_score <= 100),
  overall_score INTEGER GENERATED ALWAYS AS ((seo_score + design_score + branding_score) / 3) STORED,
  seo_details JSONB DEFAULT '{}',
  design_details JSONB DEFAULT '{}',
  branding_details JSONB DEFAULT '{}',
  issues_identified TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_version TEXT DEFAULT '1.0'
);

-- Create action_plans table
CREATE TABLE public.action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  analysis_result_id UUID NOT NULL REFERENCES public.analysis_results(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tasks JSONB NOT NULL DEFAULT '[]',
  estimated_impact TEXT,
  estimated_effort TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  action_plan_id UUID REFERENCES public.action_plans(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'opened', 'replied')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search_queries table to track searches
CREATE TABLE public.search_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_type TEXT NOT NULL CHECK (query_type IN ('location', 'url', 'industry')),
  search_parameters JSONB NOT NULL,
  results_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a business tool)
CREATE POLICY "Allow all operations on businesses" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_results" ON public.analysis_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on action_plans" ON public.action_plans FOR ALL USING (true);
CREATE POLICY "Allow all operations on email_campaigns" ON public.email_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on search_queries" ON public.search_queries FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON public.action_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_businesses_location ON public.businesses(location);
CREATE INDEX idx_businesses_industry ON public.businesses(industry);
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_analysis_results_business_id ON public.analysis_results(business_id);
CREATE INDEX idx_analysis_results_overall_score ON public.analysis_results(overall_score);
CREATE INDEX idx_action_plans_business_id ON public.action_plans(business_id);
CREATE INDEX idx_action_plans_priority ON public.action_plans(priority);
CREATE INDEX idx_email_campaigns_business_id ON public.email_campaigns(business_id);
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_search_queries_created_at ON public.search_queries(created_at);

-- Insert sample data for demonstration
INSERT INTO public.businesses (name, website_url, location, industry, phone, email, description, social_media) VALUES
('Bella''s Italian Restaurant', 'https://bellasitalian.com', 'San Francisco, CA', 'Restaurant', '(415) 555-0123', 'info@bellasitalian.com', 'Authentic Italian cuisine in the heart of San Francisco', '{"facebook": "bellasitalian", "instagram": "bellasitalian_sf"}'),
('TechFix Computer Repair', 'https://techfixrepair.com', 'San Francisco, CA', 'Technology Services', '(415) 555-0456', 'support@techfixrepair.com', 'Professional computer repair and IT services', '{"linkedin": "techfix-repair"}'),
('Green Leaf Wellness Spa', 'https://greenleafwellness.com', 'San Francisco, CA', 'Health & Wellness', '(415) 555-0789', 'hello@greenleafwellness.com', 'Holistic wellness and spa treatments', '{"instagram": "greenleafwellness", "facebook": "greenleafwellnessspa"}'),
('Downtown Auto Shop', 'https://downtownauto.com', 'San Francisco, CA', 'Automotive', '(415) 555-0321', 'service@downtownauto.com', 'Full-service automotive repair and maintenance', '{"facebook": "downtownauto"}')