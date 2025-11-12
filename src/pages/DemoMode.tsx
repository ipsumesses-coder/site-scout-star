import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play } from "lucide-react";

const DemoMode = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEnableDemo = () => {
    localStorage.setItem("demo_mode", "true");
    toast({
      title: "Demo Mode Enabled",
      description: "All AI analysis will use mock data to save tokens"
    });
    navigate("/search");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Play className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Demo Mode</CardTitle>
          <CardDescription className="text-center">
            Enable demo mode to use mock data and save tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleEnableDemo} className="w-full">
            Enable Demo Mode
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoMode;
