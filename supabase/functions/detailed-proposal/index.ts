import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProposalRequest {
  business_id: string;
  report_data: any;
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

    const { business_id, report_data }: ProposalRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating detailed proposal for business:', business_id);

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    // Generate comprehensive proposal
    const proposal = await generateDetailedProposal(business, report_data, LOVABLE_API_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        proposal
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in detailed-proposal function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function generateDetailedProposal(business: any, reportData: any, apiKey: string) {
  const proposalPrompt = `
Based on the detailed report for ${business.name}, create a COMPREHENSIVE STEP-BY-STEP CORRECTION PROPOSAL for the website owners.

BUSINESS CONTEXT:
- Name: ${business.name}
- Website: ${business.website_url}
- Industry: ${business.industry}
- Location: ${business.location}

EXISTING REPORT DATA:
${JSON.stringify(reportData, null, 2)}

Create an ULTRA-DETAILED implementation proposal with:

1. EXECUTIVE PROPOSAL (3-4 paragraphs)
   - Current state assessment
   - Vision for improved state
   - Business impact summary
   - Investment justification

2. DETAILED IMPLEMENTATION PLAN FOR EACH ISSUE:
   For each critical issue identified, provide:
   - Technical diagnosis (what exactly is wrong)
   - Why it matters (business impact with metrics)
   - Step-by-step correction process (granular steps)
   - Required tools/resources/skills
   - Code examples or technical specifications where applicable
   - Before/after scenarios
   - Success metrics and KPIs

3. PRIORITY MATRIX & TIMELINE:
   - Week-by-week implementation schedule
   - Dependencies between tasks
   - Quick wins (immediate impact items)
   - Long-term strategic improvements
   - Resource allocation recommendations

4. TECHNICAL SPECIFICATIONS:
   For SEO, Design, UI/UX, and Branding improvements:
   - Exact changes needed
   - Technical requirements
   - Tool recommendations
   - Testing procedures
   - Quality assurance checkpoints

5. BUDGET BREAKDOWN:
   - Detailed cost estimates per task
   - DIY vs. professional service options
   - Tool/software costs
   - Expected ROI per investment
   - Payment milestone recommendations

6. RISK ASSESSMENT & MITIGATION:
   - Potential implementation challenges
   - Mitigation strategies
   - Contingency plans
   - Performance monitoring approach

7. TRAINING & DOCUMENTATION:
   - Staff training requirements
   - Documentation needs
   - Ongoing maintenance guidelines
   - Knowledge transfer plan

8. SUCCESS MEASUREMENT FRAMEWORK:
   - Baseline metrics
   - Target metrics (3-month, 6-month, 12-month)
   - Tracking tools and methods
   - Reporting cadence
   - Adjustment triggers

Format as JSON:
{
  "executive_proposal": "detailed text",
  "implementation_plan": [
    {
      "issue": "specific issue",
      "technical_diagnosis": "detailed diagnosis",
      "business_impact": "impact with metrics",
      "correction_steps": [
        {
          "step_number": 1,
          "title": "step title",
          "description": "detailed description",
          "technical_details": "code/specs",
          "estimated_hours": "time estimate",
          "required_skills": ["skill1", "skill2"],
          "tools_needed": ["tool1", "tool2"]
        }
      ],
      "before_after": {
        "current_state": "description",
        "improved_state": "description",
        "expected_improvement": "quantified improvement"
      },
      "success_metrics": ["metric1", "metric2"]
    }
  ],
  "priority_matrix": {
    "week_1_2": ["task1", "task2"],
    "week_3_4": ["task3", "task4"],
    "week_5_8": ["task5", "task6"],
    "month_3_6": ["task7", "task8"],
    "month_6_12": ["task9", "task10"]
  },
  "quick_wins": [
    {
      "task": "task name",
      "impact": "high/medium/low",
      "effort": "hours",
      "expected_result": "specific outcome"
    }
  ],
  "technical_specifications": {
    "seo": {
      "technical_changes": [],
      "tools_recommended": [],
      "testing_procedures": []
    },
    "design": {
      "technical_changes": [],
      "tools_recommended": [],
      "testing_procedures": []
    },
    "uiux": {
      "technical_changes": [],
      "tools_recommended": [],
      "testing_procedures": []
    },
    "branding": {
      "technical_changes": [],
      "tools_recommended": [],
      "testing_procedures": []
    }
  },
  "budget_breakdown": {
    "total_estimated_cost": "amount range",
    "tasks": [
      {
        "task": "task name",
        "diy_cost": "amount",
        "professional_cost": "amount",
        "tools_cost": "amount",
        "expected_roi": "percentage/amount",
        "payback_period": "timeframe"
      }
    ],
    "payment_milestones": []
  },
  "risk_assessment": {
    "potential_challenges": [
      {
        "challenge": "description",
        "likelihood": "high/medium/low",
        "impact": "high/medium/low",
        "mitigation_strategy": "detailed strategy"
      }
    ],
    "contingency_plans": [],
    "monitoring_approach": "description"
  },
  "training_documentation": {
    "staff_training_needs": [],
    "documentation_requirements": [],
    "maintenance_guidelines": [],
    "knowledge_transfer_plan": "description"
  },
  "success_framework": {
    "baseline_metrics": {},
    "target_metrics": {
      "three_month": {},
      "six_month": {},
      "twelve_month": {}
    },
    "tracking_tools": [],
    "reporting_cadence": "description",
    "adjustment_triggers": []
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
          content: 'You are a senior digital transformation consultant and project manager with 15+ years of experience. Provide extremely detailed, actionable implementation plans with technical specifications, realistic timelines, and comprehensive risk management strategies.'
        },
        {
          role: 'user',
          content: proposalPrompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Proposal generation failed: ${response.status}`);
  }

  const data = await response.json();
  const proposalText = data.choices?.[0]?.message?.content;

  if (!proposalText) {
    throw new Error('No proposal content received from AI');
  }

  try {
    const cleanedText = proposalText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('Failed to parse proposal:', proposalText);
    throw new Error('Failed to generate proposal in proper format');
  }
}
