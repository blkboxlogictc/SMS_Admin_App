import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthToken } from "@/lib/supabase";
import { 
  MapPin, 
  Calendar, 
  Vote, 
  Gift,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from "lucide-react";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const chartConfig = {
  checkins: {
    label: "Check-ins",
    color: "hsl(var(--chart-1))",
  },
  rsvps: {
    label: "RSVPs",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const token = getAuthToken();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: checkinData } = useQuery({
    queryKey: ["/api/analytics/checkins-by-business"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/checkins-by-business", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch checkin data");
      return response.json();
    },
  });

  const { data: rsvpData } = useQuery({
    queryKey: ["/api/analytics/event-rsvp-trends"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/event-rsvp-trends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch RSVP data");
      return response.json();
    },
  });

  if (statsLoading) {
    return <div>Loading dashboard...</div>;
  }

  const statCards = [
    {
      title: "Total Check-ins",
      value: stats?.totalCheckins || 0,
      change: "+12% from last month",
      trend: "up",
      icon: MapPin,
      color: "blue",
    },
    {
      title: "Active Events",
      value: stats?.activeEvents || 0,
      change: "+3 this week",
      trend: "up",
      icon: Calendar,
      color: "emerald",
    },
    {
      title: "Survey Responses",
      value: stats?.surveyResponses || 0,
      change: "-2% from last month",
      trend: "down",
      icon: Vote,
      color: "amber",
    },
    {
      title: "Rewards Redeemed",
      value: stats?.rewardsRedeemed || 0,
      change: "+18% from last month",
      trend: "up",
      icon: Gift,
      color: "purple",
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-amber-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                    <p className={`text-sm mt-1 flex items-center gap-1 ${getTrendColor(stat.trend)}`}>
                      {getTrendIcon(stat.trend)}
                      {stat.change}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Check-ins Chart */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Check-ins by Business
            </CardTitle>
            <select className="text-sm border border-slate-300 rounded-lg px-3 py-1">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last year</option>
            </select>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkinData || []}>
                  <XAxis dataKey="businessName" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="checkins" fill="var(--color-checkins)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Event RSVPs Chart */}
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Event RSVP Trends
            </CardTitle>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View Details
            </button>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rsvpData || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="rsvps" stroke="var(--color-rsvps)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">
                  New event created: <span className="font-medium">Summer Jazz Festival</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  2 hours ago
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">
                  Business marked as featured: <span className="font-medium">Downtown Coffee Co.</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  4 hours ago
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                <Gift className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-900">
                  New reward added: <span className="font-medium">Free Coffee - 100 points</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  6 hours ago
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
