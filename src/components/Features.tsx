import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BarChart3, Palette, Mail, MapPin, Filter } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Web Scraping & Discovery",
    description: "Automatically discover small businesses by URL, location, or industry filters. Collect comprehensive data from websites and social profiles.",
    color: "text-primary"
  },
  {
    icon: BarChart3,
    title: "SEO Analysis",
    description: "Evaluate keyword usage, meta tags, backlinks, page speed, mobile optimization, and search engine visibility with detailed scoring.",
    color: "text-accent"
  },
  {
    icon: Palette,
    title: "Design & Branding Assessment",
    description: "Analyze UX, navigation, responsiveness, visual appeal, and brand consistency across websites and social media platforms.",
    color: "text-warning"
  },
  {
    icon: Mail,
    title: "Cold Email Generation",
    description: "Create personalized outreach emails based on identified weaknesses. Professional, compelling messages with clear call-to-actions.",
    color: "text-destructive"
  },
  {
    icon: MapPin,
    title: "Geographic Targeting",
    description: "Search and analyze businesses in specific locations. Perfect for local service providers and regional market analysis.",
    color: "text-primary"
  },
  {
    icon: Filter,
    title: "Advanced Filtering",
    description: "Filter by industry, business type, score ranges, and custom criteria. Sort results by any metric for focused analysis.",
    color: "text-accent"
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Comprehensive Business Intelligence
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform analyzes every aspect of a business's digital presence, 
            providing actionable insights and automated outreach capabilities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="glass-card hover:shadow-elevated transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};