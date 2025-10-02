import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionPlanRequest {
  business_id: string;
  detailed_report: any;
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

    const { business_id, detailed_report }: ActionPlanRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating action plan for business:', business_id);

    // Get business and analysis details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    // Generate action plans from detailed report
    const actionPlans = await generateActionPlans(business, detailed_report, LOVABLE_API_KEY);

    // Save action plans to database
    const { data: savedPlans, error: insertError } = await supabase
      .from('action_plans')
      .insert(
        actionPlans.map((plan: any) => ({
          business_id,
          analysis_result_id: null,
          title: plan.title,
          description: plan.description,
          category: plan.category,
          priority: plan.priority,
          estimated_effort: plan.estimated_effort,
          estimated_impact: plan.estimated_impact,
          tasks: plan.tasks,
          status: 'pending'
        }))
      )
      .select();

    if (insertError) {
      throw new Error(`Failed to save action plans: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action_plans: savedPlans
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in generate-action-plan function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function generateActionPlans(business: any, detailedReport: any, apiKey: string) {
  const prompt = `
Based on the following detailed business analysis report, create a comprehensive action plan with specific, prioritized tasks.

Business: ${business.name}
Website: ${business.website_url}

Detailed Report Summary:
${JSON.stringify(detailedReport, null, 2)}

Create 5-10 actionable improvement plans covering the key areas identified in the report. Each plan should include:

Format as JSON array:
[
  {
    "title": "Clear, action-oriented title",
    "description": "Detailed description of what needs to be done and why",
    "category": "SEO|Design|UI-UX|Branding",
    "priority": "critical|high|medium|low",
    "estimated_effort": "Small (1-2 days)|Medium (3-7 days)|Large (1-2 weeks)|XLarge (2+ weeks)",
    "estimated_impact": "High|Medium|Low",
    "tasks": [
      "Specific task 1",
      "Specific task 2",
      "Specific task 3"
    ]
  }
]

Focus on actionable, measurable improvements that will have the most impact on the business.
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
          content: 'You are a business improvement consultant. Create detailed, actionable plans based on analysis reports.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Action plan generation failed: ${response.status}`);
  }

  const data = await response.json();
  const planText = data.choices?.[0]?.message?.content;

  if (!planText) {
    throw new Error('No action plan content received from AI');
  }

  try {
    const cleanedText = planText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('Failed to parse action plans:', planText);
    throw new Error('Failed to generate action plans in proper format');
  }
}
