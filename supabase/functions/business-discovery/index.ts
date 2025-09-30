import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query_type: 'location' | 'url' | 'industry';
  location?: string;
  industry?: string;
  url?: string;
  radius?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { query_type, location, industry, url, radius = 25 }: SearchRequest = await req.json();

    console.log('Business discovery request:', { query_type, location, industry, url, radius });

    // Create search query record
    const { data: searchQuery, error: searchError } = await supabase
      .from('search_queries')
      .insert({
        query_type,
        search_parameters: { location, industry, url, radius },
        status: 'processing'
      })
      .select()
      .single();

    if (searchError) {
      throw new Error(`Failed to create search query: ${searchError.message}`);
    }

    let discoveredBusinesses: any[] = [];

    if (query_type === 'location' && location) {
      // Simulate business discovery using AI and web scraping
      discoveredBusinesses = await discoverBusinessesByLocation(location, industry, radius);
    } else if (query_type === 'url' && url) {
      // Analyze specific business from URL
      discoveredBusinesses = await analyzeBusinessFromUrl(url);
    }

    // Insert discovered businesses into database
    const businessInserts = discoveredBusinesses.map(business => ({
      name: business.name,
      website_url: business.website_url,
      location: business.location,
      industry: business.industry,
      phone: business.phone,
      email: business.email,
      description: business.description,
      social_media: business.social_media || {},
      status: 'discovered'
    }));

    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .insert(businessInserts)
      .select();

    if (businessError) {
      console.error('Error inserting businesses:', businessError);
      throw new Error(`Failed to insert businesses: ${businessError.message}`);
    }

    // Update search query with results
    await supabase
      .from('search_queries')
      .update({
        status: 'completed',
        results_count: businesses.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', searchQuery.id);

    return new Response(
      JSON.stringify({
        success: true,
        search_query_id: searchQuery.id,
        businesses_found: businesses.length,
        businesses
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in business-discovery function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

// Simulated business discovery function
async function discoverBusinessesByLocation(location: string, industry?: string, radius = 25) {
  // In a real implementation, this would use:
  // - Google Places API
  // - Yelp API  
  // - Web scraping tools
  // - Local business directories
  
  console.log(`Discovering businesses in ${location}, industry: ${industry}, radius: ${radius}km`);

  // Mock data for demonstration - in production, replace with real APIs
  const mockBusinesses = [
    {
      name: "Sunshine Café & Bakery",
      website_url: "https://sunshinecafe.com",
      location: location,
      industry: industry || "Restaurant",
      phone: "(555) 123-4567",
      email: "hello@sunshinecafe.com",
      description: "Fresh baked goods and artisanal coffee in a cozy atmosphere",
      social_media: {
        facebook: "sunshinecafe",
        instagram: "sunshine_cafe_bakery"
      }
    },
    {
      name: "Digital Solutions Pro",
      website_url: "https://digitalsolutionspro.com",
      location: location,
      industry: industry || "Technology Services",
      phone: "(555) 234-5678",
      email: "info@digitalsolutionspro.com",
      description: "Web development and digital marketing for small businesses",
      social_media: {
        linkedin: "digital-solutions-pro",
        twitter: "digitalsolutionspro"
      }
    },
    {
      name: "Urban Fitness Studio",
      website_url: "https://urbanfitnessstudio.com",
      location: location,
      industry: industry || "Health & Wellness",
      phone: "(555) 345-6789",
      email: "contact@urbanfitnessstudio.com",
      description: "Personal training and group fitness classes",
      social_media: {
        instagram: "urbanfitnessstudio",
        facebook: "urbanfitness"
      }
    }
  ];

  // Filter by industry if specified
  if (industry) {
    return mockBusinesses.filter(business => 
      business.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }

  return mockBusinesses;
}

// Analyze specific business from URL
async function analyzeBusinessFromUrl(url: string) {
  console.log(`Analyzing business from URL: ${url}`);
  
  // In a real implementation, this would:
  // - Extract domain and business information
  // - Use web scraping to get business details
  // - Cross-reference with business directories
  
  return [{
    name: "Analyzed Business",
    website_url: url,
    location: "Unknown",
    industry: "Unknown",
    phone: null,
    email: null,
    description: "Business analyzed from provided URL",
    social_media: {}
  }];
}