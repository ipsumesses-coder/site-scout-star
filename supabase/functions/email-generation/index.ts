import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  business_id: string;
  action_plan_id?: string;
  sender_name?: string;
  sender_company?: string;
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

    const { 
      business_id, 
      action_plan_id,
      sender_name = "Sarah Johnson",
      sender_company = "Digital Growth Solutions"
    }: EmailRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating cold email for business:', business_id);

    // Get business details and analysis
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        *,
        analysis_results (
          seo_score,
          design_score,
          branding_score,
          issues_identified,
          recommendations
        )
      `)
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      throw new Error(`Business not found: ${businessError?.message}`);
    }

    // Get action plan if specified
    let actionPlan = null;
    if (action_plan_id) {
      const { data } = await supabase
        .from('action_plans')
        .select('*')
        .eq('id', action_plan_id)
        .single();
      actionPlan = data;
    }

    // Generate personalized email
    const emailContent = await generateColdEmail(business, actionPlan, sender_name, sender_company, LOVABLE_API_KEY);

    // Save email to database
    const { data: email, error: emailError } = await supabase
      .from('email_campaigns')
      .insert({
        business_id,
        action_plan_id,
        subject: emailContent.subject,
        email_body: emailContent.body,
        recipient_email: business.email || 'contact@' + business.website_url?.replace(/https?:\/\//, '').split('/')[0],
        recipient_name: extractContactName(business.name),
        status: 'draft'
      })
      .select()
      .single();

    if (emailError) {
      throw new Error(`Failed to save email: ${emailError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
        preview: {
          subject: emailContent.subject,
          body: emailContent.body,
          recipient: business.email || 'contact@' + business.website_url?.replace(/https?:\/\//, '').split('/')[0]
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Error in email-generation function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});

async function generateColdEmail(business: any, actionPlan: any, senderName: string, senderCompany: string, apiKey: string) {
  const analysis = business.analysis_results[0];
  
  const emailPrompt = `
Generate a professional, personalized cold email for a business outreach campaign.

TARGET BUSINESS:
- Name: ${business.name}
- Industry: ${business.industry}
- Location: ${business.location}
- Website: ${business.website_url}
- Description: ${business.description}

ANALYSIS RESULTS:
- SEO Score: ${analysis?.seo_score || 'N/A'}
- Design Score: ${analysis?.design_score || 'N/A'}
- Branding Score: ${analysis?.branding_score || 'N/A'}
- Key Issues: ${analysis?.issues_identified?.join(', ') || 'General optimization opportunities'}

ACTION PLAN: ${actionPlan ? actionPlan.title + ' - ' + actionPlan.description : 'Custom improvement recommendations available'}

SENDER:
- Name: ${senderName}
- Company: ${senderCompany}

EMAIL REQUIREMENTS:
1. Professional, conversational tone
2. Personalized to the specific business
3. Highlight 2-3 key issues without revealing full analysis
4. Create urgency without being pushy
5. Clear call-to-action
6. Subject line under 60 characters
7. Email body 150-250 words

Format as JSON:
{
  "subject": "Compelling subject line",
  "body": "Professional email body with proper formatting"
}

Make the email feel genuine and valuable, not sales-y.
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
          content: 'You are an expert copywriter specializing in B2B cold email outreach. Create personalized, value-driven emails that generate responses.'
        },
        {
          role: 'user',
          content: emailPrompt
        }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email generation failed: ${response.status}`);
  }

  const data = await response.json();
  const emailText = data.choices?.[0]?.message?.content;

  try {
    const cleanedText = emailText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('Failed to parse email response:', emailText);
    
    // Fallback email template
    const businessType = business.industry?.toLowerCase() || 'business';
    const issues = analysis?.issues_identified?.slice(0, 2).join(' and ') || 'website optimization opportunities';
    
    return {
      subject: `Quick wins for ${business.name}'s online presence`,
      body: `Hi there,

I came across ${business.name} and was impressed by your ${businessType} in ${business.location}. 

While reviewing your online presence, I noticed some ${issues} that could be limiting your growth potential. Many ${businessType} businesses see 30-40% more leads after addressing these specific issues.

I'd love to share a quick analysis of what I found and some actionable recommendations that could boost your visibility. Would you be open to a brief 15-minute call this week?

Best regards,
${senderName}
${senderCompany}

P.S. I've helped similar businesses in ${business.location} increase their online leads significantly with some simple changes.`
    };
  }
}

function extractContactName(businessName: string): string {
  // Simple extraction - in reality, you'd use more sophisticated methods
  const commonPrefixes = ['the ', 'a ', 'an '];
  let name = businessName.toLowerCase();
  
  for (const prefix of commonPrefixes) {
    if (name.startsWith(prefix)) {
      name = name.slice(prefix.length);
      break;
    }
  }
  
  return name.split(' ')[0] || 'there';
}