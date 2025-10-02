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

    // Generate 3 different email styles
    const emailVariants = await generateColdEmails(business, actionPlan, sender_name, sender_company, LOVABLE_API_KEY);

    // Save all 3 emails to database
    const savedEmails = [];
    for (const emailContent of emailVariants) {
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
        console.error('Failed to save email:', emailError);
      } else {
        savedEmails.push(email);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        emails: savedEmails,
        variants: emailVariants.map((email: any, index: number) => ({
          style: index === 0 ? 'Professional' : index === 1 ? 'Conversational' : 'Data-Driven',
          subject: email.subject,
          body: email.body,
          recipient: business.email || 'contact@' + business.website_url?.replace(/https?:\/\//, '').split('/')[0]
        }))
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

async function generateColdEmails(business: any, actionPlan: any, senderName: string, senderCompany: string, apiKey: string) {
  const analysis = business.analysis_results[0];
  
  const emailPrompt = `
Generate 3 DIFFERENT STYLES of professional cold emails for a business outreach campaign.

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

Generate 3 DISTINCT EMAIL STYLES:

1. PROFESSIONAL & FORMAL
   - Traditional business tone
   - Focus on expertise and credibility
   - Formal language and structure

2. CONVERSATIONAL & FRIENDLY
   - Warm, approachable tone
   - Personal connection
   - Story-driven approach

3. DATA-DRIVEN & DIRECT
   - Metrics and numbers focused
   - ROI-oriented
   - Concise and to the point

REQUIREMENTS for each:
- Subject line under 60 characters
- Email body 150-250 words
- Highlight 2-3 key issues without revealing full analysis
- Clear call-to-action
- Make it feel genuine and valuable, not sales-y

Format as JSON array:
[
  {
    "subject": "Compelling subject line for style 1",
    "body": "Professional email body with proper formatting"
  },
  {
    "subject": "Compelling subject line for style 2",
    "body": "Conversational email body with proper formatting"
  },
  {
    "subject": "Compelling subject line for style 3",
    "body": "Data-driven email body with proper formatting"
  }
]
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
          content: 'You are an expert copywriter specializing in B2B cold email outreach. Create 3 distinct styles of personalized, value-driven emails that generate responses.'
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
    
    // Fallback: generate 3 basic email templates
    const businessType = business.industry?.toLowerCase() || 'business';
    const issues = analysis?.issues_identified?.slice(0, 2).join(' and ') || 'website optimization opportunities';
    
    return [
      {
        subject: `${business.name} - Professional Growth Opportunity`,
        body: `Dear ${extractContactName(business.name)},

I trust this message finds you well. I am reaching out from ${senderCompany} regarding ${business.name}'s digital presence.

Our analysis has identified ${issues} that may be impacting your business performance. We specialize in helping ${businessType} businesses optimize their online presence for maximum ROI.

I would welcome the opportunity to discuss our findings and share strategic recommendations tailored to ${business.name}.

Would you be available for a brief consultation?

Best regards,
${senderName}
${senderCompany}`
      },
      {
        subject: `Hey ${extractContactName(business.name)} - Spotted something interesting 👀`,
        body: `Hi there!

I was checking out ${business.name} and really liked what you're doing in ${business.location}! 

I noticed a few things about your online presence - specifically ${issues} - that could be holding you back from reaching even more customers.

I've helped a bunch of ${businessType} businesses tackle similar challenges, and they've seen some pretty amazing results. Would love to chat about what I found and see if we can help you grow too!

Free for a quick call this week?

Cheers,
${senderName}
${senderCompany}`
      },
      {
        subject: `${business.name}: 30-40% more leads possible`,
        body: `Hello,

Quick stats on ${business.name}:
- Current issues: ${issues}
- Potential impact: 30-40% increase in qualified leads
- Timeline: 4-6 weeks to full implementation

${businessType} businesses in ${business.location} that addressed these issues saw:
• 35% average increase in organic traffic
• 28% improvement in conversion rates
• 42% boost in customer engagement

15-minute call to review specific findings?

${senderName}
${senderCompany}
Data-driven growth for ${businessType} businesses`
      }
    ];
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