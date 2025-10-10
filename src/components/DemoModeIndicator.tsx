import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DemoModeIndicator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isDemoMode = localStorage.getItem("demo_mode") === "true";

  if (!isDemoMode) return null;

  const exitDemoMode = () => {
    localStorage.removeItem("demo_mode");
    toast({
      title: "Demo Mode Disabled",
      description: "Real AI analysis will now be used"
    });
    navigate("/");
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge variant="secondary" className="bg-yellow-500 text-white">
        DEMO MODE (Mock Data)
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={exitDemoMode}
        className="h-7"
      >
        <LogOut className="h-3 w-3 mr-1" />
        Exit Demo
      </Button>
    </div>
  );
};
