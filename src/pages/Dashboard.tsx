import { Header } from "@/components/Header";
import { DashboardStats } from "@/components/DashboardStats";
import { RecentAnalysis } from "@/components/RecentAnalysis";
import { ActionPlansList } from "@/components/ActionPlansList";
import { EmailCampaigns } from "@/components/EmailCampaigns";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Business Analysis Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor your business intelligence insights and outreach campaigns
          </p>
        </div>

        <div className="space-y-8">
          {/* Stats Overview */}
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Analysis */}
            <RecentAnalysis />
            
            {/* Action Plans */}
            <ActionPlansList />
          </div>
          
          {/* Email Campaigns */}
          <EmailCampaigns />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;