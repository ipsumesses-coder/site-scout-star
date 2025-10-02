import { Button } from "@/components/ui/button";
import { Search, BarChart3, Mail, Code } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  const isDevMode = localStorage.getItem("dev_mode") === "true";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold gradient-text">BizAnalyzer</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-foreground hover:text-primary transition-colors animated-underline">
            Home
          </Link>
          <Link to="/search" className="text-foreground hover:text-primary transition-colors animated-underline">
            Business Search
          </Link>
          <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors animated-underline">
            Dashboard
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/search")}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {!isDevMode && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/dev-login")}
            >
              <Code className="h-4 w-4 mr-2" />
              Dev Mode
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="btn-hero"
          >
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
};