import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";

const actionPlans = [
  {
    id: 1,
    businessName: "Sunrise Bakery",
    priority: "High",
    issues: 8,
    category: "SEO & Technical",
    createdAt: "2 hours ago",
    status: "Ready"
  },
  {
    id: 2,
    businessName: "Metro Fitness", 
    priority: "Critical",
    issues: 12,
    category: "Design & UX",
    createdAt: "5 hours ago",
    status: "Ready"
  },
  {
    id: 3,
    businessName: "Local Pet Store",
    priority: "Critical",
    issues: 15,
    category: "Complete Overhaul",
    createdAt: "2 days ago",
    status: "In Progress"
  },
  {
    id: 4,
    businessName: "Digital Marketing Pro",
    priority: "Low",
    issues: 3,
    category: "Brand Consistency",
    createdAt: "1 day ago",
    status: "Ready"
  }
];

export const ActionPlansList = () => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive";
      case "High": return "default";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready": return "success";
      case "In Progress": return "warning";
      case "Completed": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Plans</CardTitle>
        <CardDescription>
          Generated improvement recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionPlans.map((plan) => (
          <div key={plan.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">{plan.businessName}</span>
                <Badge variant={getPriorityColor(plan.priority) as any} className="text-xs">
                  {plan.priority}
                </Badge>
                <Badge variant={getStatusColor(plan.status) as any} className="text-xs">
                  {plan.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.issues} issues identified • {plan.category}
              </div>
              <div className="text-xs text-muted-foreground">
                Created {plan.createdAt}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Generate New Action Plan
        </Button>
      </CardContent>
    </Card>
  );
};