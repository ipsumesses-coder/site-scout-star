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
  limit?: number;
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

    const { query_type, location, industry, url, radius = 25, offset = 0, limit = 50 }: SearchRequest = await req.json();
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!GOOGLE_API_KEY && query_type === 'location') {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Business discovery request:', { query_type, location, industry, url, radius, limit });

    // Handle URL-only search - skip Places API and database query tracking
    if (query_type === 'url' && url) {
      console.log('URL-only search - analyzing single business:', url);
      
      const extractedUrl = url.includes('://') ? url : `https://${url}`;
      const domain = extractedUrl.replace(/https?:\/\//, '').split('/')[0];
      
      const businessData = await analyzeBusinessFromUrlWithAI(extractedUrl, LOVABLE_API_KEY);
      
      // Check if business already exists
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('website_url', extractedUrl)
        .single();

      let businessId: string;
      if (existingBusiness) {
        businessId = existingBusiness.id;
      } else {
        const { data: newBusiness, error: insertError } = await supabase
          .from('businesses')
          .insert({
            name: businessData.name || domain,
            website_url: extractedUrl,
            location: businessData.location || 'Unknown',
            industry: businessData.industry || 'Unknown',
            description: businessData.description || `Business at ${extractedUrl}`,
            status: 'discovered'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        businessId = newBusiness.id;
      }

      return new Response(
        JSON.stringify({
          success: true,
          businesses_found: 1,
          search_query_id: businessId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );

    }

    // For location-based search, continue with Places API
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
      // Use Google Places API for location-based discovery
      discoveredBusinesses = await discoverBusinessesByLocation(location, industry, radius, offset, limit);
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
async function discoverBusinessesByLocation(location: string, industry?: string, radius = 25, offset = 0, limit = 50) {
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
    const endIndex = Math.min(offset + limit, placesData.results.length);
    
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

// Analyze specific business from URL with AI
async function analyzeBusinessFromUrlWithAI(url: string, apiKey: string) {
  console.log(`Analyzing business from URL with AI: ${url}`);
  
  const prompt = `Extract business information from this website: ${url}
  
Provide the following information if available:
- Business name
- Location (city, state/country)
- Industry/category
- Brief description

Format as JSON:
{
  "name": "business name",
  "location": "city, state/country",
  "industry": "industry category",
  "description": "brief description"
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a business information extraction expert. Extract structured business data from URLs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error('No AI response received');
    }

    try {
      const cleanedText = resultText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return parsed;
    } catch {
      // Fallback: extract domain
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      return {
        name: domain,
        location: 'Unknown',
        industry: 'Unknown',
        description: `Business at ${url}`
      };
    }
  } catch (error) {
    console.error('Error in AI business analysis:', error);
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    return {
      name: domain,
      location: 'Unknown',
      industry: 'Unknown',
      description: `Business at ${url}`
    };
  }
}