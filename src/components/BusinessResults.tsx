import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Mail, Loader2 } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BusinessResultsProps {
  searchQueryId: string;
}

interface Business {
  id: string;
  name: string;
  website_url: string | null;
  location: string | null;
  industry: string | null;
  description: string | null;
  seo_score?: number;
  design_score?: number;
  branding_score?: number;
  overall_score?: number;
  issues?: string[];
}

export const BusinessResults = ({ searchQueryId }: BusinessResultsProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinesses();
  }, [searchQueryId]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      
      // Get businesses from this search query
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(20);

      if (businessError) throw businessError;

      // Get analysis results for these businesses
      const businessIds = businessData?.map(b => b.id) || [];
      
      if (businessIds.length > 0) {
        const { data: analysisData, error: analysisError } = await supabase
          .from('analysis_results')
          .select('business_id, seo_score, design_score, branding_score, overall_score, issues_identified')
          .in('business_id', businessIds);

        if (analysisError) throw analysisError;

        // Merge business data with analysis data
        const mergedData = businessData.map(business => {
          const analysis = analysisData?.find(a => a.business_id === business.id);
          return {
            ...business,
            seo_score: analysis?.seo_score,
            design_score: analysis?.design_score,
            branding_score: analysis?.branding_score,
            overall_score: analysis?.overall_score,
            issues: analysis?.issues_identified || []
          };
        });

        setBusinesses(mergedData);
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load business results",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (businessId: string, websiteUrl: string | null) => {
    if (!websiteUrl) {
      toast({
        title: "No Website",
        description: "This business doesn't have a website URL to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(businessId);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: { business_id: businessId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Analysis Complete",
          description: `Overall score: ${data.overall_score}/100`
        });
        // Reload businesses to show updated scores
        await loadBusinesses();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze business",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleGenerateEmail = async (businessId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-generation', {
        body: { business_id: businessId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Generated",
          description: "Cold email has been generated successfully"
        });
      }
    } catch (error) {
      console.error('Email generation error:', error);
      toast({
        title: "Email Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate email",
        variant: "destructive"
      });
    }
  };

  const getOverallScore = (seo?: number, design?: number, branding?: number) => {
    if (!seo || !design || !branding) return undefined;
    return Math.round((seo + design + branding) / 3);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Found {businesses.length} businesses
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {businesses.length} businesses
        </Badge>
      </div>

      {businesses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No businesses found. Try a different search.</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {businesses.map((business) => {
            const overallScore = business.overall_score || getOverallScore(business.seo_score, business.design_score, business.branding_score);
            const hasAnalysis = business.seo_score !== undefined;
            
            return (
              <Card key={business.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{business.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {business.industry && <Badge variant="outline">{business.industry}</Badge>}
                        {business.location && <Badge variant="outline">{business.location}</Badge>}
                      </div>
                      {business.website_url && (
                        <a 
                          href={business.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          {business.website_url} <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {business.description && (
                        <p className="text-sm text-muted-foreground mt-2">{business.description}</p>
                      )}
                    </div>
                    {hasAnalysis && overallScore !== undefined && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Overall Score</div>
                        <ScoreBadge score={overallScore} size="lg" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {hasAnalysis ? (
                    <>
                      {/* Individual Scores */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">SEO</div>
                          <ScoreBadge score={business.seo_score || 0} />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Design</div>
                          <ScoreBadge score={business.design_score || 0} />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Branding</div>
                          <ScoreBadge score={business.branding_score || 0} />
                        </div>
                      </div>

                      {/* Key Issues */}
                      {business.issues && business.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Key Issues Identified:</h4>
                          <div className="flex flex-wrap gap-2">
                            {business.issues.map((issue, idx) => (
                              <Badge key={idx} variant="destructive">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="default" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          View Action Plan
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleGenerateEmail(business.id)}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Generate Email
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This business hasn't been analyzed yet. Click below to start AI-powered analysis.
                      </p>
                      <Button 
                        onClick={() => handleAnalyze(business.id, business.website_url)}
                        disabled={isAnalyzing === business.id || !business.website_url}
                        className="w-full"
                      >
                        {isAnalyzing === business.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          "Analyze Business"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
