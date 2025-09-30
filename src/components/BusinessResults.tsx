import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Mail, MoreHorizontal } from "lucide-react";
import { ScoreBadge } from "@/components/ScoreBadge";

interface BusinessResultsProps {
  searchType: "url" | "location";
  query: string;
}

// Mock data for demonstration
const mockBusinesses = [
  {
    id: 1,
    name: "Bella's Italian Restaurant",
    website: "https://bellasitalian.com",
    industry: "Restaurant",
    location: "San Francisco, CA",
    seoScore: 45,
    designScore: 72,
    brandingScore: 58,
    issues: ["Missing meta descriptions", "Slow loading speed", "Inconsistent branding"]
  },
  {
    id: 2,
    name: "TechFix Computer Repair",
    website: "https://techfixrepair.com",
    industry: "Technology Services",
    location: "San Francisco, CA", 
    seoScore: 83,
    designScore: 41,
    brandingScore: 67,
    issues: ["Poor mobile responsiveness", "Outdated design", "Missing contact info"]
  },
  {
    id: 3,
    name: "Green Leaf Wellness Spa",
    website: "https://greenleafwellness.com",
    industry: "Health & Wellness",
    location: "San Francisco, CA",
    seoScore: 92,
    designScore: 88,
    brandingScore: 94,
    issues: ["Limited social media presence"]
  },
  {
    id: 4,
    name: "Downtown Auto Shop",
    website: "https://downtownauto.com",
    industry: "Automotive",
    location: "San Francisco, CA",
    seoScore: 34,
    designScore: 29,
    brandingScore: 42,
    issues: ["No SEO optimization", "Poor website design", "Inconsistent messaging", "Missing business hours"]
  }
];

export const BusinessResults = ({ searchType, query }: BusinessResultsProps) => {
  const getOverallScore = (seo: number, design: number, branding: number) => {
    return Math.round((seo + design + branding) / 3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Analysis Results
          {searchType === "location" && (
            <span className="text-muted-foreground font-normal"> in {query}</span>
          )}
        </h2>
        <Badge variant="secondary" className="text-sm">
          {mockBusinesses.length} businesses found
        </Badge>
      </div>

      <div className="grid gap-6">
        {mockBusinesses.map((business) => {
          const overallScore = getOverallScore(business.seoScore, business.designScore, business.brandingScore);
          
          return (
            <Card key={business.id} className="hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{business.name}</CardTitle>
                      <ScoreBadge score={overallScore} label="Overall" />
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{business.industry}</span>
                      <span>•</span>
                      <span>{business.location}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary-hover"
                        onClick={() => window.open(business.website, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Visit Website
                      </Button>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">SEO</span>
                    <ScoreBadge score={business.seoScore} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Design</span>
                    <ScoreBadge score={business.designScore} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="font-medium">Branding</span>
                    <ScoreBadge score={business.brandingScore} />
                  </div>
                </div>

                {/* Key Issues */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Key Issues Identified:</h4>
                  <div className="flex flex-wrap gap-2">
                    {business.issues.map((issue, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button variant="default" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Action Plan
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Generate Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};