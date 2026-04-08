import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { business_id, report_data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!business_id || !report_data) {
      throw new Error('business_id and report_data are required');
    }

    console.log('Generating client-friendly proposal for business:', business_id);

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .maybeSingle();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    const proposal = await generateClientProposal(business, report_data, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({ success: true, proposal }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error in client-proposal function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});

async function generateClientProposal(business: any, reportData: any, apiKey: string) {
  const prompt = `
You are writing a professional, CLIENT-FACING proposal document for ${business.name}. 
This document will be sent directly to the business owner/decision maker who is NOT technical.

BUSINESS CONTEXT:
- Name: ${business.name}
- Website: ${business.website_url}
- Industry: ${business.industry}
- Location: ${business.location}

ANALYSIS DATA (internal - use to inform your writing but DO NOT use technical jargon):
${JSON.stringify(reportData, null, 2)}

Write a warm, professional, persuasive proposal that:
- Uses simple, everyday language (NO technical terms like "meta tags", "H1", "CSS", "responsive design", "alt text", "schema markup", etc.)
- Frames everything in terms of BUSINESS OUTCOMES: more customers, better first impressions, higher trust, more sales
- Sounds like a friendly expert advisor, not a robot
- Uses analogies to explain complex concepts (e.g., "Your website is like your shopfront window...")
- Includes specific, tangible benefits with estimated impact where possible
- Has a clear call-to-action

Format as JSON:
{
  "document_title": "Proposal title",
  "greeting": "Personalised opening paragraph addressing the business owner",
  "executive_overview": "2-3 paragraphs summarising what we found and the opportunity, in plain English",
  "what_we_found": [
    {
      "area": "friendly area name (e.g., 'Online Visibility', 'First Impressions', 'User Experience', 'Brand Identity')",
      "current_situation": "plain English description of the current state",
      "what_this_means": "business impact in terms they understand (lost customers, missed opportunities)",
      "our_recommendation": "what we suggest, explained simply",
      "expected_benefit": "tangible outcome (e.g., 'up to 30% more website visitors')"
    }
  ],
  "quick_wins": [
    {
      "improvement": "simple description",
      "benefit": "immediate business benefit",
      "timeframe": "how quickly they'll see results"
    }
  ],
  "investment_overview": {
    "summary": "plain English overview of what's involved",
    "packages": [
      {
        "name": "package name (e.g., 'Essential', 'Growth', 'Premium')",
        "description": "what's included in simple terms",
        "price_range": "estimated cost range",
        "best_for": "who this package suits",
        "expected_roi": "return on investment in business terms"
      }
    ]
  },
  "timeline_overview": {
    "summary": "simple timeline explanation",
    "phases": [
      {
        "phase_name": "friendly name",
        "duration": "timeframe",
        "what_happens": "plain English description",
        "what_you_will_see": "visible improvements the client will notice"
      }
    ]
  },
  "why_act_now": "compelling paragraph about why addressing this sooner rather than later matters",
  "next_steps": "friendly call-to-action with clear next steps",
  "closing": "warm closing paragraph"
}
`;

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
          content: 'You are a warm, professional business consultant who excels at explaining complex digital issues in simple, relatable terms. You write compelling proposals that make business owners excited about improving their online presence. Never use technical jargon. Always focus on business outcomes, customer impact, and ROI.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add funds in Settings > Workspace > Usage.');
    }
    throw new Error(`Client proposal generation failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('No proposal content received from AI');
  }

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse client proposal:', text);
    throw new Error('Failed to generate proposal in proper format');
  }
}
