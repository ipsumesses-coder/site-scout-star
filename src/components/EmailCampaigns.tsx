import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Eye, Edit } from "lucide-react";

const emailCampaigns = [
  {
    id: 1,
    businessName: "Sunrise Bakery",
    subject: "Boost Your Online Visibility with Simple SEO Improvements",
    status: "Draft",
    openRate: null,
    createdAt: "2 hours ago",
    preview: "Hi Sarah, I noticed your bakery has amazing reviews but could benefit from some quick SEO improvements that would help more customers find you online..."
  },
  {
    id: 2,
    businessName: "Metro Fitness",
    subject: "Transform Your Website into a Member Magnet",
    status: "Sent",
    openRate: "68%",
    createdAt: "1 day ago",
    preview: "Hi Mike, Your fitness programs look incredible, but I noticed your website might be losing potential members due to some design issues..."
  },
  {
    id: 3,
    businessName: "Local Pet Store", 
    subject: "Triple Your Online Sales with These Website Fixes",
    status: "Sent",
    openRate: "45%",
    createdAt: "3 days ago",
    preview: "Hello Jessica, I analyzed your pet store's online presence and found several opportunities that could significantly increase your sales..."
  },
  {
    id: 4,
    businessName: "Coffee Corner Cafe",
    subject: "Why Your Amazing Coffee Isn't Being Found Online",
    status: "Delivered",
    openRate: "89%",
    createdAt: "5 days ago",
    preview: "Hi David, Your coffee shop has fantastic reviews, but I noticed some quick fixes that could help you reach even more coffee lovers..."
  }
];

export const EmailCampaigns = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "secondary";
      case "Sent": return "default";
      case "Delivered": return "success";
      case "Opened": return "warning";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Campaigns</CardTitle>
            <CardDescription>
              Personalized outreach emails and performance tracking
            </CardDescription>
          </div>
          <Button className="btn-hero">
            <Mail className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {emailCampaigns.map((email) => (
          <div key={email.id} className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{email.businessName}</span>
                  <Badge variant={getStatusColor(email.status) as any} className="text-xs">
                    {email.status}
                  </Badge>
                  {email.openRate && (
                    <Badge variant="outline" className="text-xs">
                      {email.openRate} open rate
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">{email.subject}</div>
                <div className="text-xs text-muted-foreground">
                  Created {email.createdAt}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                {email.status === "Draft" && (
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {email.status === "Draft" && (
                  <Button variant="default" size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded border-l-2 border-primary/20">
              {email.preview}
            </div>
          </div>
        ))}
        
        <div className="text-center pt-4">
          <Button variant="outline">
            View All Campaigns
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};