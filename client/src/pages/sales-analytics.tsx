import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Store,
  Receipt,
  BarChart3,
  PieChart,
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
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(var(--chart-2))",
  },
  avgSpend: {
    label: "Avg Spend",
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
const dailyRevenueData = [
  { date: "Jan 1", revenue: 12450, transactions: 89, avgSpend: 139.89 },
  { date: "Jan 2", revenue: 15670, transactions: 112, avgSpend: 139.91 },
  { date: "Jan 3", revenue: 18920, transactions: 134, avgSpend: 141.19 },
  { date: "Jan 4", revenue: 16780, transactions: 118, avgSpend: 142.2 },
  { date: "Jan 5", revenue: 21340, transactions: 156, avgSpend: 136.79 },
  { date: "Jan 6", revenue: 28560, transactions: 198, avgSpend: 144.24 },
  { date: "Jan 7", revenue: 25890, transactions: 178, avgSpend: 145.45 },
];

const categoryRevenueData = [
  { name: "Dining & Restaurants", value: 45, revenue: 156780, fill: COLORS[0] },
  { name: "Retail & Shopping", value: 28, revenue: 97650, fill: COLORS[1] },
  { name: "Entertainment", value: 15, revenue: 52340, fill: COLORS[2] },
  { name: "Services", value: 8, revenue: 27890, fill: COLORS[3] },
  { name: "Other", value: 4, revenue: 13940, fill: COLORS[4] },
];

const topBusinessesData = [
  {
    name: "Flagler Grill",
    revenue: 28450,
    transactions: 234,
    category: "Dining",
  },
  {
    name: "Stuart Hardware",
    revenue: 24670,
    transactions: 189,
    category: "Retail",
  },
  {
    name: "Coffee Culture",
    revenue: 18920,
    transactions: 456,
    category: "Dining",
  },
  { name: "Boutique 27", revenue: 16780, transactions: 98, category: "Retail" },
  {
    name: "Stuart Theater",
    revenue: 15340,
    transactions: 167,
    category: "Entertainment",
  },
];

const paymentMethodData = [
  { method: "Credit Card", percentage: 52, amount: 182340 },
  { method: "Debit Card", percentage: 28, amount: 98120 },
  { method: "Cash", percentage: 15, amount: 52560 },
  { method: "Mobile Pay", percentage: 5, amount: 17540 },
];

const hourlySpendingData = [
  { hour: "9 AM", avgSpend: 45.2, transactions: 12 },
  { hour: "10 AM", avgSpend: 67.8, transactions: 28 },
  { hour: "11 AM", avgSpend: 89.4, transactions: 45 },
  { hour: "12 PM", avgSpend: 124.6, transactions: 89 },
  { hour: "1 PM", avgSpend: 156.8, transactions: 112 },
  { hour: "2 PM", avgSpend: 98.2, transactions: 67 },
  { hour: "3 PM", avgSpend: 112.4, transactions: 78 },
  { hour: "4 PM", avgSpend: 134.6, transactions: 94 },
  { hour: "5 PM", avgSpend: 167.8, transactions: 123 },
  { hour: "6 PM", avgSpend: 189.2, transactions: 145 },
  { hour: "7 PM", avgSpend: 145.6, transactions: 98 },
  { hour: "8 PM", avgSpend: 98.4, transactions: 56 },
];

export default function SalesAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales Analytics</h1>
        <p className="text-slate-600">
          Revenue, spending patterns, and business performance data
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-slate-900">$348,600</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +18% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-slate-900">2,847</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Avg. Transaction
                </p>
                <p className="text-2xl font-bold text-slate-900">$122.45</p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +5% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Active Businesses
                </p>
                <p className="text-2xl font-bold text-slate-900">47</p>
                <p className="text-sm text-slate-600 mt-1">Processing sales</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="var(--color-revenue)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Hourly Spending Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Hourly Spending Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlySpendingData}>
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    yAxisId="right"
                    dataKey="transactions"
                    fill="var(--color-transactions)"
                    opacity={0.7}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgSpend"
                    stroke="var(--color-avgSpend)"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Revenue and Top Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryRevenueData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ value }) => `${value}%`}
                      >
                        {categoryRevenueData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryRevenueData.map((item, index) => (
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
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        ${item.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.value}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Businesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Top Performing Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBusinessesData.map((business, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {business.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {business.category}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {business.transactions} transactions
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${business.revenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods and Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethodData.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700">
                      {method.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${method.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-900 w-12 text-right">
                      {method.percentage}%
                    </span>
                    <span className="text-sm text-slate-500 w-20 text-right">
                      ${method.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  Peak Sales Hours
                </h4>
                <p className="text-sm text-green-700">
                  6-7 PM generates the highest average transaction value at
                  $189.20
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Category Performance
                </h4>
                <p className="text-sm text-blue-700">
                  Dining & Restaurants account for 45% of total downtown revenue
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  Payment Trends
                </h4>
                <p className="text-sm text-purple-700">
                  Credit card usage increased 15% this month, cash decreased 8%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
