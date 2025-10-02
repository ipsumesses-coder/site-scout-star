import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Mail, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BusinessResultsProps {
  searchQueryId: string;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  isUrlSearch?: boolean;
  resultsPerPage: number;
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
  uiux_score?: number;
  branding_score?: number;
  overall_score?: number;
  seo_details?: any;
  design_details?: any;
  uiux_details?: any;
  branding_details?: any;
  issues?: string[];
}

export const BusinessResults = ({ searchQueryId, onLoadMore, isLoadingMore, isUrlSearch = false, resultsPerPage }: BusinessResultsProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("overall");
  const [filterBy, setFilterBy] = useState<string>("all");
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [detailedReports, setDetailedReports] = useState<Map<string, any>>(new Map());
  const [generatingActionPlan, setGeneratingActionPlan] = useState<string | null>(null);
  const [generatingEmails, setGeneratingEmails] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinesses();
  }, [searchQueryId]);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(100);

      if (businessError) throw businessError;

      const businessIds = businessData?.map(b => b.id) || [];
      
      if (businessIds.length > 0) {
        const { data: analysisData, error: analysisError } = await supabase
          .from('analysis_results')
          .select('*')
          .in('business_id', businessIds);

        if (analysisError) throw analysisError;

        const mergedData = businessData.map(business => {
          const analysis = analysisData?.find(a => a.business_id === business.id);
          return {
            ...business,
            seo_score: analysis?.seo_score,
            design_score: analysis?.design_score,
            uiux_score: analysis?.uiux_score,
            branding_score: analysis?.branding_score,
            overall_score: analysis?.overall_score,
            seo_details: analysis?.seo_details,
            design_details: analysis?.design_details,
            uiux_details: analysis?.uiux_details,
            branding_details: analysis?.branding_details,
            issues: analysis?.issues_identified || []
          };
        });

        setBusinesses(mergedData);
        
        // Auto-analyze businesses without analysis
        const unanalyzed = mergedData.filter(b => !b.seo_score && b.website_url);
        for (const business of unanalyzed.slice(0, 5)) {
          handleAnalyze(business.id, business.website_url, true);
        }
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

  const handleAnalyze = async (businessId: string, websiteUrl: string | null, silent = false) => {
    if (!websiteUrl) {
      if (!silent) {
        toast({
          title: "No Website",
          description: "This business doesn't have a website URL to analyze",
          variant: "destructive"
        });
      }
      return;
    }

    const isDevMode = localStorage.getItem("dev_mode") === "true";

    setIsAnalyzing(businessId);
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: { 
          business_id: businessId,
          use_mock_data: isDevMode
        }
      });

      if (error) throw error;

      if (data.success && !silent) {
        toast({
          title: "Analysis Complete",
          description: isDevMode ? "Mock analysis completed (Dev Mode)" : "Analysis completed successfully"
        });
        await loadBusinesses();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      if (!silent) {
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Failed to analyze business",
          variant: "destructive"
        });
      }
    } finally {
      setIsAnalyzing(null);
    }
  };

  const handleGenerateReport = async (businessId: string) => {
    setGeneratingReport(businessId);
    try {
      const { data, error } = await supabase.functions.invoke('detailed-report', {
        body: { business_id: businessId }
      });

      if (error) throw error;

      if (data.success) {
        setDetailedReports(prev => new Map(prev).set(businessId, data.report));
        toast({
          title: "Report Generated",
          description: "Detailed analysis report has been generated successfully"
        });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleGenerateActionPlan = async (businessId: string) => {
    const report = detailedReports.get(businessId);
    if (!report) {
      toast({
        title: "Generate Report First",
        description: "Please generate a detailed report before creating an action plan",
        variant: "destructive"
      });
      return;
    }

    setGeneratingActionPlan(businessId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-action-plan', {
        body: { 
          business_id: businessId,
          detailed_report: report
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Action Plan Created",
          description: `Generated ${data.action_plans.length} actionable improvement plans`
        });
      }
    } catch (error) {
      console.error('Action plan generation error:', error);
      toast({
        title: "Action Plan Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate action plan",
        variant: "destructive"
      });
    } finally {
      setGeneratingActionPlan(null);
    }
  };

  const handleGenerateEmails = async (businessId: string) => {
    setGeneratingEmails(businessId);
    try {
      const { data, error } = await supabase.functions.invoke('email-generation', {
        body: { business_id: businessId }
      });

      if (error) throw error;

      if (data.success) {
        console.log('Email Variants:', data.variants);
        toast({
          title: "Emails Generated",
          description: "3 different cold email styles have been generated successfully"
        });
      }
    } catch (error) {
      console.error('Email generation error:', error);
      toast({
        title: "Email Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate emails",
        variant: "destructive"
      });
    } finally {
      setGeneratingEmails(null);
    }
  };

  const getOverallScore = (business: Business) => {
    const scores = [
      business.seo_score,
      business.design_score,
      business.uiux_score,
      business.branding_score
    ].filter(s => s !== undefined) as number[];
    
    if (scores.length === 0) return undefined;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getSortedAndFilteredBusinesses = () => {
    let filtered = [...businesses];

    if (filterBy !== "all") {
      filtered = filtered.filter(b => {
        const score = getOverallScore(b);
        if (!score) return false;
        if (filterBy === "high") return score >= 70;
        if (filterBy === "medium") return score >= 40 && score < 70;
        if (filterBy === "low") return score < 40;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let scoreA: number | undefined, scoreB: number | undefined;
      
      switch (sortBy) {
        case "seo":
          scoreA = a.seo_score;
          scoreB = b.seo_score;
          break;
        case "design":
          scoreA = a.design_score;
          scoreB = b.design_score;
          break;
        case "uiux":
          scoreA = a.uiux_score;
          scoreB = b.uiux_score;
          break;
        case "branding":
          scoreA = a.branding_score;
          scoreB = b.branding_score;
          break;
        default:
          scoreA = getOverallScore(a);
          scoreB = getOverallScore(b);
      }

      if (scoreA === undefined && scoreB === undefined) return 0;
      if (scoreA === undefined) return 1;
      if (scoreB === undefined) return -1;
      return scoreB - scoreA;
    });

    return filtered;
  };

  const sortedBusinesses = getSortedAndFilteredBusinesses();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Found {sortedBusinesses.length} businesses
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Score</SelectItem>
              <SelectItem value="seo">SEO Score</SelectItem>
              <SelectItem value="design">Design Score</SelectItem>
              <SelectItem value="uiux">UI/UX Score</SelectItem>
              <SelectItem value="branding">Branding Score</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              <SelectItem value="high">High (70+)</SelectItem>
              <SelectItem value="medium">Medium (40-69)</SelectItem>
              <SelectItem value="low">Low (&lt;40)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {sortedBusinesses.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No businesses found matching your criteria.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {sortedBusinesses.map((business) => {
              const overallScore = getOverallScore(business);
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">SEO</div>
                            <ScoreBadge score={business.seo_score || 0} />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Design</div>
                            <ScoreBadge score={business.design_score || 0} />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">UI/UX</div>
                            <ScoreBadge score={business.uiux_score || 0} />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Branding</div>
                            <ScoreBadge score={business.branding_score || 0} />
                          </div>
                        </div>

                        <Collapsible
                          open={expandedDetails === business.id}
                          onOpenChange={() => setExpandedDetails(expandedDetails === business.id ? null : business.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full flex items-center justify-between">
                              <span>View Detailed Breakdown</span>
                              {expandedDetails === business.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4">
                            {business.seo_details && (
                              <div className="space-y-2">
                                <h4 className="font-semibold">SEO Analysis</h4>
                                {business.seo_details.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.seo_details.strengths.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {business.seo_details.weaknesses?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Weaknesses:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.seo_details.weaknesses.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {business.design_details && (
                              <div className="space-y-2">
                                <h4 className="font-semibold">Design Analysis</h4>
                                {business.design_details.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.design_details.strengths.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {business.design_details.weaknesses?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Weaknesses:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.design_details.weaknesses.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {business.uiux_details && (
                              <div className="space-y-2">
                                <h4 className="font-semibold">UI/UX Analysis</h4>
                                {business.uiux_details.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.uiux_details.strengths.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {business.uiux_details.weaknesses?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Weaknesses:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.uiux_details.weaknesses.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {business.branding_details && (
                              <div className="space-y-2">
                                <h4 className="font-semibold">Branding Analysis</h4>
                                {business.branding_details.strengths?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Strengths:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.branding_details.strengths.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {business.branding_details.weaknesses?.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Weaknesses:</p>
                                    <ul className="text-sm list-disc list-inside">
                                      {business.branding_details.weaknesses.map((w: string, i: number) => (
                                        <li key={i}>{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>

                        {business.issues && business.issues.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Key Issues:</h4>
                            <div className="flex flex-wrap gap-2">
                              {business.issues.map((issue, idx) => (
                                <Badge key={idx} variant="destructive">
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button 
                            variant="default" 
                            className="flex-1"
                            onClick={() => handleGenerateReport(business.id)}
                            disabled={generatingReport === business.id}
                          >
                            {generatingReport === business.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Detailed Report
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleGenerateEmails(business.id)}
                            disabled={generatingEmails === business.id}
                          >
                            {generatingEmails === business.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Generate 3 Cold Emails
                              </>
                            )}
                          </Button>
                        </div>

                        {detailedReports.has(business.id) && (
                          <Button 
                            variant="secondary" 
                            className="w-full mt-2"
                            onClick={() => handleGenerateActionPlan(business.id)}
                            disabled={generatingActionPlan === business.id}
                          >
                            {generatingActionPlan === business.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating Action Plan...
                              </>
                            ) : (
                              'Create Action Plan from Report'
                            )}
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Analyzing website... This may take a moment.
                        </p>
                        <Button 
                          onClick={() => handleAnalyze(business.id, business.website_url)}
                          disabled={isAnalyzing === business.id || !business.website_url}
                          className="w-full"
                          variant="secondary"
                        >
                          {isAnalyzing === business.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            "Retry Analysis"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!isUrlSearch && (
            <div className="flex justify-center pt-6">
              <Button 
                onClick={onLoadMore}
                disabled={isLoadingMore}
                size="lg"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading More...
                  </>
                ) : (
                  `Load ${resultsPerPage} More Businesses`
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
