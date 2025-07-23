import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard",
    subtitle: "Overview of key metrics and recent activity",
  },
  "/events": {
    title: "Events Management",
    subtitle: "Create and manage community events",
  },
  "/rewards": {
    title: "Rewards Management",
    subtitle: "Configure point-based rewards for businesses",
  },
  "/surveys": {
    title: "Surveys Management",
    subtitle: "Create and analyze customer feedback surveys",
  },
  "/businesses": {
    title: "Businesses Management",
    subtitle: "Manage participating local businesses",
  },
  "/analytics": {
    title: "Detailed Analytics",
    subtitle: "Comprehensive data analysis and insights",
  },
};

export function Header() {
  const [location] = useLocation();
  const pageInfo = pageTitles[location] || { title: "Admin Panel", subtitle: "" };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{pageInfo.title}</h1>
        <p className="text-sm text-slate-600">{pageInfo.subtitle}</p>
      </div>
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <Badge className="absolute -top-1 -right-1 w-3 h-3 p-0 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
            
          </Badge>
        </button>
        {/* Real-time indicator */}
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
