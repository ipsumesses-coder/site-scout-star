import { BarChart3, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">BizAnalyzer</span>
            </Link>
            <p className="text-background/70 leading-relaxed">
              AI-powered business intelligence platform for analyzing small business digital presence and generating actionable insights.
            </p>
          </div>
          
          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product</h3>
            <div className="space-y-2">
              <Link to="/search" className="block text-background/70 hover:text-background transition-colors">
                Business Search
              </Link>
              <Link to="/dashboard" className="block text-background/70 hover:text-background transition-colors">
                Dashboard
              </Link>
              <Link to="/analytics" className="block text-background/70 hover:text-background transition-colors">
                Analytics
              </Link>
              <Link to="/reports" className="block text-background/70 hover:text-background transition-colors">
                Reports
              </Link>
            </div>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features</h3>
            <div className="space-y-2">
              <div className="text-background/70">SEO Analysis</div>
              <div className="text-background/70">Design Assessment</div>
              <div className="text-background/70">Brand Evaluation</div>
              <div className="text-background/70">Email Generation</div>
            </div>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-background/70">
                <Mail className="h-4 w-4" />
                <span>hello@bizanalyzer.com</span>
              </div>
              <div className="flex items-center space-x-2 text-background/70">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-background/70">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/70">
          <p>&copy; 2024 BizAnalyzer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};