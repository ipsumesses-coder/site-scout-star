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
  offset?: number;
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

    const { query_type, location, industry, url, radius = 25, offset = 0 }: SearchRequest = await req.json();

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
      discoveredBusinesses = await discoverBusinessesByLocation(location, industry, radius, offset);
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

// Google Places API business discovery function
async function discoverBusinessesByLocation(location: string, industry?: string, radius = 25, offset = 0) {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  console.log(`Discovering businesses in ${location}, industry: ${industry}, radius: ${radius}km`);

  try {
    // First, geocode the location to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      throw new Error(`Failed to geocode location: ${location}`);
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log(`Geocoded location: ${lat}, ${lng}`);

    // Build the search query with industry filter if specified
    let searchQuery = 'business';
    if (industry && industry.trim() !== '') {
      searchQuery = industry;
    }

    // Use Google Places Text Search API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=${radius * 1000}&key=${apiKey}`;
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK') {
      console.error('Places API error:', placesData.status);
      return [];
    }

    const businesses = [];

    // Process each place to get detailed information with pagination
    const startIndex = offset;
    const endIndex = Math.min(offset + 50, placesData.results.length);
    
    for (const place of placesData.results.slice(startIndex, endIndex)) {
      try {
        // Get place details including website
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,website,formatted_phone_number,types&key=${apiKey}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK' && detailsData.result) {
          const details = detailsData.result;
          
          businesses.push({
            name: details.name,
            website_url: details.website || null,
            location: details.formatted_address || location,
            industry: industry || (details.types && details.types[0] ? details.types[0].replace(/_/g, ' ') : 'General'),
            phone: details.formatted_phone_number || null,
            email: null, // Email not available from Google Places
            description: `${details.name} located in ${details.formatted_address || location}`,
            social_media: {} // Social media not directly available from Google Places
          });
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }

    console.log(`Found ${businesses.length} businesses`);
    return businesses;

  } catch (error) {
    console.error('Error in Google Places API:', error);
    throw error;
  }
}

// Analyze specific business from URL
async function analyzeBusinessFromUrl(url: string) {
  console.log(`Analyzing business from URL: ${url}`);
  
  // Extract domain from URL
  const domain = new URL(url).hostname.replace('www.', '');
  
  return [{
    name: domain,
    website_url: url,
    location: "Unknown",
    industry: "Unknown",
    phone: null,
    email: null,
    description: `Business at ${url}`,
    social_media: {}
  }];
}