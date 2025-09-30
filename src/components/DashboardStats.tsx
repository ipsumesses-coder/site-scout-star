import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, Mail, Building2 } from "lucide-react";

const stats = [
  {
    title: "Total Businesses Analyzed",
    value: "1,247",
    change: "+23%",
    trend: "up",
    icon: Building2,
    description: "This month"
  },
  {
    title: "Average SEO Score",
    value: "64",
    change: "+12%",
    trend: "up", 
    icon: BarChart3,
    description: "Across all businesses"
  },
  {
    title: "Action Plans Generated",
    value: "892", 
    change: "+31%",
    trend: "up",
    icon: TrendingUp,
    description: "Ready for implementation"
  },
  {
    title: "Cold Emails Sent",
    value: "456",
    change: "-8%",
    trend: "down",
    icon: Mail,
    description: "Last 30 days"
  }
];

export const DashboardStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="hover:shadow-elevated transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs">
                <div className={`flex items-center ${
                  stat.trend === "up" ? "text-success" : "text-destructive"
                }`}>
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {stat.change}
                </div>
                <span className="text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};