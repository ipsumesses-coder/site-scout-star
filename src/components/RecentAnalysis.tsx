import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye } from "lucide-react";
import { ScoreBadge } from "@/components/ScoreBadge";

const recentAnalysis = [
  {
    id: 1,
    name: "Sunrise Bakery",
    website: "sunrisebakery.com",
    analyzedAt: "2 hours ago",
    seoScore: 72,
    designScore: 85,
    brandingScore: 68
  },
  {
    id: 2,
    name: "Metro Fitness",
    website: "metrofitness.com", 
    analyzedAt: "5 hours ago",
    seoScore: 45,
    designScore: 62,
    brandingScore: 38
  },
  {
    id: 3,
    name: "Digital Marketing Pro",
    website: "digitalmarketingpro.com",
    analyzedAt: "1 day ago",
    seoScore: 91,
    designScore: 88,
    brandingScore: 94
  },
  {
    id: 4,
    name: "Local Pet Store",
    website: "localpetstore.com",
    analyzedAt: "2 days ago",
    seoScore: 34,
    designScore: 41,
    brandingScore: 29
  }
];

export const RecentAnalysis = () => {
  const getOverallScore = (seo: number, design: number, branding: number) => {
    return Math.round((seo + design + branding) / 3);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Analysis</CardTitle>
        <CardDescription>
          Latest business intelligence reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentAnalysis.map((analysis) => {
          const overallScore = getOverallScore(analysis.seoScore, analysis.designScore, analysis.brandingScore);
          
          return (
            <div key={analysis.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{analysis.name}</span>
                  <ScoreBadge score={overallScore} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{analysis.website}</span>
                  <span>•</span>
                  <span>{analysis.analyzedAt}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span>SEO: <ScoreBadge score={analysis.seoScore} size="sm" /></span>
                  <span>Design: <ScoreBadge score={analysis.designScore} size="sm" /></span>
                  <span>Brand: <ScoreBadge score={analysis.brandingScore} size="sm" /></span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        <Button variant="outline" className="w-full">
          View All Analysis
        </Button>
      </CardContent>
    </Card>
  );
};