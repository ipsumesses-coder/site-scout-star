import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BarChart3, FileText, Mail } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Search,
    title: "Input & Discovery",
    description: "Enter a website URL, social media profile, or specify a geographic location. Our system discovers and collects business data automatically.",
    color: "text-primary"
  },
  {
    step: "02", 
    icon: BarChart3,
    title: "Analysis & Scoring",
    description: "AI-powered analysis evaluates SEO performance, website design quality, and brand consistency. Each factor receives a score from 0-100.",
    color: "text-accent"
  },
  {
    step: "03",
    icon: FileText,
    title: "Action Plans",
    description: "Detailed improvement recommendations are generated for each business, prioritized by impact and implementation difficulty.",
    color: "text-warning"
  },
  {
    step: "04",
    icon: Mail,
    title: "Outreach Generation",
    description: "Personalized cold emails are crafted based on identified weaknesses, designed to convert prospects into clients.",
    color: "text-destructive"
  }
];

export const HowItWorks = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our streamlined process takes you from business discovery to personalized outreach in four simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={index} 
                className="relative glass-card hover:shadow-elevated transition-all duration-300 group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-6 bg-background border-2 border-border rounded-full w-12 h-12 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{step.step}</span>
                </div>
                
                <CardHeader className="pt-8">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-lg bg-background shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-8 w-8 ${step.color}`} />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base leading-relaxed">
                    {step.description}
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