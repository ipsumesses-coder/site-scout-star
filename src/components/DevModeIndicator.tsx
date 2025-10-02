import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export const DevModeIndicator = () => {
  const [feedback, setFeedback] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const isDevMode = localStorage.getItem("dev_mode") === "true";

  const handleLogout = () => {
    localStorage.removeItem("dev_mode");
    window.location.href = "/";
  };

  const handleSubmitFeedback = () => {
    console.log("=== AI FEEDBACK ===");
    console.log(feedback);
    console.log("===================");
    
    toast({
      title: "Feedback Logged",
      description: "AI feedback has been logged to console for review",
    });
    
    setFeedback("");
    setIsOpen(false);
  };

  if (!isDevMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Badge variant="default" className="bg-yellow-500 text-black">
        <Code className="h-3 w-3 mr-1" />
        DEV MODE
      </Badge>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            AI Feedback
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Feedback</DialogTitle>
            <DialogDescription>
              Report issues with AI analysis or suggestions for improvement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe the issue with the AI analysis..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={6}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitFeedback} disabled={!feedback.trim()}>
                Submit Feedback
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="destructive" size="sm" onClick={handleLogout}>
        Exit Dev Mode
      </Button>
    </div>
  );
};
