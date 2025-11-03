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
  max_results?: number;
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

    const { query_type, location, industry, url, radius = 25, offset = 0, max_results = 5 }: SearchRequest = await req.json();

    console.log('Business discovery request:', { query_type, location, industry, url, radius, max_results });

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
    let fromCache = false;

    if (query_type === 'location' && location) {
      // Check cache first
      const cacheKey = `${location}:${industry || 'all'}:${radius}`;
      const { data: cached } = await supabase
        .from('places_cache')
        .select('results, expires_at')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached && cached.results) {
        console.log('Using cached results');
        discoveredBusinesses = cached.results.slice(offset, offset + max_results);
        fromCache = true;
      } else {
        // Fetch from Google Places API with max_results limit
        discoveredBusinesses = await discoverBusinessesByLocation(location, industry, radius, offset, max_results, supabase, cacheKey);
      }
    } else if (query_type === 'url' && url) {
      // Analyze specific business from URL
      discoveredBusinesses = await analyzeBusinessFromUrl(url);
    }

    // Insert discovered businesses into database with search_query_id
    const businessInserts = discoveredBusinesses.map(business => ({
      name: business.name,
      website_url: business.website_url,
      location: business.location,
      industry: business.industry,
      phone: business.phone,
      email: business.email,
      description: business.description,
      social_media: business.social_media || {},
      status: 'discovered',
      search_query_id: searchQuery.id
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
        businesses,
        from_cache: fromCache
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
async function discoverBusinessesByLocation(
  location: string, 
  industry: string | undefined, 
  radius: number, 
  offset: number, 
  maxResults: number,
  supabase: any,
  cacheKey: string
) {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    throw new Error('Google Places API key not configured');
  }

  console.log(`Discovering businesses in ${location}, industry: ${industry}, radius: ${radius}km, max: ${maxResults}`);

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
    let count = 0;

    // Process places with max_results limit - stop early when we hit the limit
    for (const place of placesData.results) {
      if (count >= maxResults) {
        console.log(`Reached max results limit: ${maxResults}`);
        break;
      }

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
            email: null,
            description: `${details.name} located in ${details.formatted_address || location}`,
            social_media: {}
          });
          count++;
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }

    // Cache the results for 30 days
    if (businesses.length > 0) {
      await supabase.from('places_cache').upsert({
        cache_key: cacheKey,
        location,
        industry: industry || null,
        radius,
        results: businesses,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'cache_key'
      });
      console.log('Cached results for 30 days');
    }

    console.log(`Found ${businesses.length} businesses`);
    return businesses;

  } catch (error) {
    console.error('Error in Google Places API:', error);
    throw error;
  }
}

// Analyze specific business from URL by scraping and analyzing website content
async function analyzeBusinessFromUrl(url: string) {
  console.log(`Analyzing business from URL: ${url}`);
  
  try {
    // Fetch the website HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessAnalyzer/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract text content from HTML (remove scripts, styles, etc.)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000); // Limit to first 8000 chars for AI analysis
    
    // Use Lovable AI to extract business information
    const aiResponse = await fetch('https://api.lovable.app/v1/ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a business information extraction expert. Extract structured business information from website content and return it as valid JSON only, with no additional text or markdown.'
          },
          {
            role: 'user',
            content: `Extract business information from this website content. Return ONLY valid JSON with this exact structure:
{
  "name": "business name",
  "location": "business address or location",
  "industry": "industry category",
  "phone": "phone number if found, else null",
  "email": "email if found, else null",
  "description": "brief 1-2 sentence description of what the business does",
  "social_media": {
    "facebook": "url if found",
    "instagram": "url if found",
    "twitter": "url if found",
    "linkedin": "url if found"
  }
}

Website URL: ${url}
Website content: ${textContent}`
          }
        ]
      })
    });
    
    if (!aiResponse.ok) {
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }
    
    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse the AI response (remove markdown code blocks if present)
    let businessInfo;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      businessInfo = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON');
    }
    
    // Return the analyzed business with the original URL
    return [{
      name: businessInfo.name || new URL(url).hostname.replace('www.', ''),
      website_url: url,
      location: businessInfo.location || "Unknown",
      industry: businessInfo.industry || "Unknown",
      phone: businessInfo.phone || null,
      email: businessInfo.email || null,
      description: businessInfo.description || `Business at ${url}`,
      social_media: businessInfo.social_media || {}
    }];
    
  } catch (error) {
    console.error('Error analyzing website:', error);
    
    // Fallback: return basic info if analysis fails
    const domain = new URL(url).hostname.replace('www.', '');
    return [{
      name: domain,
      website_url: url,
      location: "Could not analyze",
      industry: "Unknown",
      phone: null,
      email: null,
      description: `Analysis failed for ${url}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      social_media: {}
    }];
  }
}