import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Navigation,
  Activity,
  BarChart3,
  Map,
} from "lucide-react";
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
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--chart-1))",
  },
  footTraffic: {
    label: "Foot Traffic",
    color: "hsl(var(--chart-2))",
  },
  dwellTime: {
    label: "Dwell Time",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Mock data for demonstration
const hourlyTrafficData = [
  { hour: "6 AM", visitors: 12, footTraffic: 8 },
  { hour: "7 AM", visitors: 28, footTraffic: 22 },
  { hour: "8 AM", visitors: 45, footTraffic: 38 },
  { hour: "9 AM", visitors: 67, footTraffic: 58 },
  { hour: "10 AM", visitors: 89, footTraffic: 76 },
  { hour: "11 AM", visitors: 112, footTraffic: 98 },
  { hour: "12 PM", visitors: 156, footTraffic: 134 },
  { hour: "1 PM", visitors: 178, footTraffic: 152 },
  { hour: "2 PM", visitors: 134, footTraffic: 118 },
  { hour: "3 PM", visitors: 145, footTraffic: 128 },
  { hour: "4 PM", visitors: 167, footTraffic: 142 },
  { hour: "5 PM", visitors: 189, footTraffic: 165 },
  { hour: "6 PM", visitors: 201, footTraffic: 178 },
  { hour: "7 PM", visitors: 156, footTraffic: 138 },
  { hour: "8 PM", visitors: 98, footTraffic: 87 },
  { hour: "9 PM", visitors: 67, footTraffic: 58 },
];

const weeklyTrendData = [
  { day: "Mon", visitors: 1245, dwellTime: 28 },
  { day: "Tue", visitors: 1156, dwellTime: 32 },
  { day: "Wed", visitors: 1389, dwellTime: 35 },
  { day: "Thu", visitors: 1567, dwellTime: 38 },
  { day: "Fri", visitors: 2134, dwellTime: 45 },
  { day: "Sat", visitors: 2567, dwellTime: 52 },
  { day: "Sun", visitors: 1876, dwellTime: 41 },
];

const visitorOriginData = [
  { name: "Local (Stuart)", value: 45, fill: COLORS[0] },
  { name: "Martin County", value: 28, fill: COLORS[1] },
  { name: "Palm Beach County", value: 15, fill: COLORS[2] },
  { name: "St. Lucie County", value: 8, fill: COLORS[3] },
  { name: "Other Florida", value: 4, fill: COLORS[4] },
];

const hotspotData = [
  { location: "Flagler Avenue", visitors: 2456, avgDwell: "42 min" },
  { location: "Osceola Street", visitors: 1876, avgDwell: "38 min" },
  { location: "Colorado Avenue", visitors: 1654, avgDwell: "35 min" },
  { location: "Seminole Street", visitors: 1432, avgDwell: "31 min" },
  { location: "St. Lucie Avenue", visitors: 1234, avgDwell: "28 min" },
];

export default function GeographicAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Geographic Analytics
        </h1>
        <p className="text-slate-600">
          Foot traffic patterns and visitor geographic data
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Daily Visitors
                </p>
                <p className="text-2xl font-bold text-slate-900">2,847</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from yesterday
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Avg. Dwell Time
                </p>
                <p className="text-2xl font-bold text-slate-900">38 min</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +5 min from last week
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Peak Hour</p>
                <p className="text-2xl font-bold text-slate-900">6 PM</p>
                <p className="text-sm text-slate-600 mt-1">201 visitors</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Top Hotspot
                </p>
                <p className="text-2xl font-bold text-slate-900">Flagler Ave</p>
                <p className="text-sm text-slate-600 mt-1">2,456 visitors</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Traffic Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Hourly Traffic Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyTrafficData}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stackId="1"
                    stroke="var(--color-visitors)"
                    fill="var(--color-visitors)"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="footTraffic"
                    stackId="1"
                    stroke="var(--color-footTraffic)"
                    fill="var(--color-footTraffic)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Visitor Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendData}>
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="left"
                    dataKey="visitors"
                    fill="var(--color-visitors)"
                    opacity={0.7}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="dwellTime"
                    stroke="var(--color-dwellTime)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Origins and Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Origins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Visitor Origins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visitorOriginData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ value }) => `${value}%`}
                      >
                        {visitorOriginData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-2">
                {visitorOriginData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-slate-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Hotspots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Top Traffic Hotspots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hotspotData.map((hotspot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {hotspot.location}
                      </p>
                      <p className="text-sm text-slate-500">
                        Avg. dwell: {hotspot.avgDwell}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {hotspot.visitors.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">visitors</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Peak Traffic Days
              </h4>
              <p className="text-sm text-blue-700">
                Fridays and Saturdays see 40% more foot traffic than weekdays
              </p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <h4 className="font-semibold text-emerald-900 mb-2">
                Visitor Retention
              </h4>
              <p className="text-sm text-emerald-700">
                68% of visitors stay longer than 30 minutes in the downtown area
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <h4 className="font-semibold text-amber-900 mb-2">
                Geographic Reach
              </h4>
              <p className="text-sm text-amber-700">
                Downtown Stuart attracts visitors from a 50-mile radius
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
