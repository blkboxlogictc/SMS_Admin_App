import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/supabase";
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

const chartConfig = {
  checkins: {
    label: "Check-ins",
    color: "hsl(var(--chart-1))",
  },
  rsvps: {
    label: "RSVPs",
    color: "hsl(var(--chart-2))",
  },
  redemptions: {
    label: "Redemptions",
    color: "hsl(var(--chart-3))",
  },
  responses: {
    label: "Responses",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const token = getAuthToken();

  const { data: checkinData } = useQuery({
    queryKey: ["/api/analytics/checkins-by-event"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/checkins-by-event", {
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

  const { data: redemptionData } = useQuery({
    queryKey: ["/api/analytics/reward-redemption-trends"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/reward-redemption-trends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch redemption data");
      return response.json();
    },
  });

  const { data: surveyData } = useQuery({
    queryKey: ["/api/analytics/survey-response-distribution"],
    queryFn: async () => {
      const response = await fetch(
        "/api/analytics/survey-response-distribution",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch survey data");
      return response.json();
    },
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        Detailed Analytics
      </h2>

      {/* Filter Controls */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <select className="px-3 py-2 border border-slate-300 rounded-lg">
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Apply Filters
          </Button>
          <Button variant="outline">Export Data</Button>
        </div>
      </Card>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Check-ins by Event */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Check-ins by Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkinData || []}>
                  <XAxis dataKey="eventName" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="checkins" fill="var(--color-checkins)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Survey Response Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Survey Response Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={surveyData || []}
                    dataKey="responses"
                    nameKey="surveyTitle"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {(surveyData || []).map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Reward Redemption Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Reward Redemption Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={redemptionData || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="redemptions"
                    stroke="var(--color-redemptions)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Event Engagement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Event Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rsvpData || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rsvps" fill="var(--color-rsvps)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tables */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Event Performance Details
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                  Event
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                  Check-ins
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                  RSVPs
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                  Attendance Rate
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {checkinData?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No analytics data available yet
                  </td>
                </tr>
              ) : (
                checkinData?.map((event: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {event.eventName}
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {event.checkins}
                    </td>
                    <td className="px-6 py-4 text-slate-900">N/A</td>
                    <td className="px-6 py-4 text-slate-900">N/A</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-slate-900 mr-2">Active</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
