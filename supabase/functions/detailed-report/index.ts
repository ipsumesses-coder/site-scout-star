import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  business_id: string;
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

    const { business_id }: ReportRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating detailed report for business:', business_id);

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .maybeSingle();

    if (businessError) {
      throw new Error(`Database error fetching business: ${businessError.message}`);
    }

    if (!business) {
      throw new Error('Business not found');
    }

    // Get analysis results (most recent)
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('business_id', business_id)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError) {
      throw new Error(`Database error fetching analysis: ${analysisError.message}`);
    }

    if (!analysis) {
      throw new Error('No analysis found for this business. Please run an analysis first.');
    }

    // Get action plans
    const { data: actionPlans, error: actionPlansError } = await supabase
      .from('action_plans')
      .select('*')
      .eq('business_id', business_id);

    if (actionPlansError) {
      throw new Error(`Failed to fetch action plans: ${actionPlansError.message}`);
    }

    // Generate comprehensive report
    const report = await generateDetailedReport(business, analysis, actionPlans || [], LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        report
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in detailed-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function generateDetailedReport(business: any, analysis: any, actionPlans: any[], apiKey: string) {
  const reportPrompt = `
Generate an extremely detailed analysis report and improvement proposal for the following business:

Business Information:
- Name: ${business.name}
- Website: ${business.website_url}
- Industry: ${business.industry}
- Location: ${business.location}

Current Analysis Scores:
- SEO Score: ${analysis.seo_score}/100
- Design Score: ${analysis.design_score}/100
- UI/UX Score: ${analysis.uiux_score}/100
- Branding Score: ${analysis.branding_score}/100

SEO Analysis:
Strengths: ${JSON.stringify(analysis.seo_details?.strengths || [])}
Weaknesses: ${JSON.stringify(analysis.seo_details?.weaknesses || [])}
Opportunities: ${JSON.stringify(analysis.seo_details?.opportunities || [])}

Design Analysis:
Strengths: ${JSON.stringify(analysis.design_details?.strengths || [])}
Weaknesses: ${JSON.stringify(analysis.design_details?.weaknesses || [])}
Opportunities: ${JSON.stringify(analysis.design_details?.opportunities || [])}

UI/UX Analysis:
Strengths: ${JSON.stringify(analysis.uiux_details?.strengths || [])}
Weaknesses: ${JSON.stringify(analysis.uiux_details?.weaknesses || [])}
Opportunities: ${JSON.stringify(analysis.uiux_details?.opportunities || [])}

Branding Analysis:
Strengths: ${JSON.stringify(analysis.branding_details?.strengths || [])}
Weaknesses: ${JSON.stringify(analysis.branding_details?.weaknesses || [])}
Opportunities: ${JSON.stringify(analysis.branding_details?.opportunities || [])}

Create a comprehensive report with:
1. Executive Summary (2-3 paragraphs)
2. Detailed Category Analysis (for each: SEO, Design, UI/UX, Branding)
   - In-depth assessment
   - Specific examples and evidence
   - Industry benchmarks comparison
3. Critical Issues & Impact Assessment
4. Prioritized Recommendations with:
   - Detailed implementation steps
   - Expected outcomes
   - Timeline estimates
   - Resource requirements
5. ROI Projections
6. Competitor Analysis insights
7. Long-term Strategy Roadmap

Format as JSON:
{
  "executive_summary": "detailed summary text",
  "seo_analysis": {
    "assessment": "detailed text",
    "specific_findings": [],
    "benchmark_comparison": "text"
  },
  "design_analysis": {
    "assessment": "detailed text",
    "specific_findings": [],
    "benchmark_comparison": "text"
  },
  "uiux_analysis": {
    "assessment": "detailed text",
    "specific_findings": [],
    "benchmark_comparison": "text"
  },
  "branding_analysis": {
    "assessment": "detailed text",
    "specific_findings": [],
    "benchmark_comparison": "text"
  },
  "critical_issues": [
    {
      "issue": "text",
      "severity": "high/medium/low",
      "impact": "detailed impact description",
      "urgency": "immediate/short-term/long-term"
    }
  ],
  "recommendations": [
    {
      "title": "text",
      "priority": "critical/high/medium/low",
      "category": "SEO/Design/UI-UX/Branding",
      "implementation_steps": [],
      "expected_outcomes": [],
      "timeline": "text",
      "resources_required": "text",
      "estimated_cost": "text"
    }
  ],
  "roi_projections": {
    "short_term": "text",
    "medium_term": "text",
    "long_term": "text"
  },
  "competitor_insights": "detailed text",
  "strategy_roadmap": {
    "phase_1": "text (0-3 months)",
    "phase_2": "text (3-6 months)",
    "phase_3": "text (6-12 months)"
  }
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
          content: 'You are an expert digital marketing and business consultant with deep expertise in SEO, web design, UI/UX, and branding. Provide extremely detailed, actionable analysis with specific examples and data-driven recommendations.'
        },
        {
          role: 'user',
          content: reportPrompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.status}`);
  }

  const data = await response.json();
  const reportText = data.choices?.[0]?.message?.content;

  if (!reportText) {
    throw new Error('No report content received from AI');
  }

  try {
    const cleanedText = reportText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('Failed to parse report:', reportText);
    throw new Error('Failed to generate report in proper format');
  }
}
