import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Users,
  BarChart3,
  PieChart,
  FileText,
  CheckSquare,
  Star,
  ThumbsUp,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  responses: {
    label: "Responses",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function SurveyAnalytics() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const token = getAuthToken();

  const navigate = (path: string) => setLocation(path);

  const {
    data: analytics,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/surveys/${id}/analytics`],
    queryFn: async () => {
      const response = await fetch(`/api/surveys/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch survey analytics");
      return response.json();
    },
    enabled: !!id,
  });

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
      case "radio":
        return <BarChart3 className="w-4 h-4" />;
      case "checkbox":
        return <CheckSquare className="w-4 h-4" />;
      case "rating":
        return <Star className="w-4 h-4" />;
      case "yes_no":
        return <ThumbsUp className="w-4 h-4" />;
      case "text":
      case "textarea":
        return <FileText className="w-4 h-4" />;
      default:
        return <PieChart className="w-4 h-4" />;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "checkbox":
        return "Checkbox (Multi-select)";
      case "rating":
        return "Rating";
      case "yes_no":
        return "Yes/No";
      case "text":
        return "Text";
      case "textarea":
        return "Long Text";
      case "radio":
        return "Single Choice";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const renderQuestionAnalytics = (question: any) => {
    const { questionType, responses, textResponses } = question;

    // For text questions, show sample responses
    if (questionType === "text" || questionType === "textarea") {
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Total Responses: {textResponses?.length || 0}
            </span>
            {textResponses && textResponses.length > 10 && (
              <Badge variant="secondary">Showing first 10</Badge>
            )}
          </div>
          {textResponses && textResponses.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {textResponses.map((response: string, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg border text-sm"
                >
                  "{response}"
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No text responses yet
            </div>
          )}
        </div>
      );
    }

    // For choice-based questions, show charts
    if (responses && responses.length > 0) {
      const totalResponses = responses.reduce(
        (sum: number, r: any) => sum + r.count,
        0
      );

      // Prepare data for charts
      const chartData = responses.map((r: any, index: number) => ({
        ...r,
        fill: COLORS[index % COLORS.length],
        percentage: ((r.count / totalResponses) * 100).toFixed(1),
      }));

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Total Responses: {totalResponses}
            </span>
          </div>

          {/* Bar Chart */}
          <div>
            <h5 className="text-sm font-medium text-slate-700 mb-3">
              Response Distribution
            </h5>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <XAxis
                    dataKey="answer"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-responses)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Pie Chart for better visualization */}
          <div>
            <h5 className="text-sm font-medium text-slate-700 mb-3">
              Response Breakdown
            </h5>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <ChartContainer config={chartConfig} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ percentage }) => `${percentage}%`}
                      >
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-2">
                {chartData.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-slate-700 truncate max-w-32">
                        {item.answer}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count}</div>
                      <div className="text-xs text-slate-500">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-8 text-slate-500">
        No responses yet for this question
      </div>
    );
  };

  const downloadAnalytics = () => {
    if (!analytics) return;

    // Create CSV content
    let csvContent = `Survey Analytics Report\n`;
    csvContent += `Survey: ${analytics.survey.title}\n`;
    csvContent += `Description: ${analytics.survey.description || "N/A"}\n`;
    csvContent += `Total Responses: ${analytics.totalResponses}\n`;
    csvContent += `Questions: ${analytics.questionAnalytics.length}\n`;
    csvContent += `Points Reward: ${analytics.survey.rewardPoints}\n`;
    csvContent += `Status: ${
      analytics.survey.isActive ? "Active" : "Inactive"
    }\n\n`;

    analytics.questionAnalytics.forEach((question: any, index: number) => {
      csvContent += `\nQuestion ${question.questionId}: ${question.questionText}\n`;
      csvContent += `Type: ${getQuestionTypeLabel(question.questionType)}\n`;

      if (
        question.questionType === "text" ||
        question.questionType === "textarea"
      ) {
        csvContent += `Total Text Responses: ${
          question.textResponses?.length || 0
        }\n`;
        if (question.textResponses && question.textResponses.length > 0) {
          csvContent += `Sample Responses:\n`;
          question.textResponses
            .slice(0, 5)
            .forEach((response: string, i: number) => {
              csvContent += `${i + 1}. "${response}"\n`;
            });
        }
      } else if (question.responses && question.responses.length > 0) {
        csvContent += `Response Distribution:\n`;
        question.responses.forEach((response: any) => {
          const percentage = question.responses.reduce(
            (sum: number, r: any) => sum + r.count,
            0
          );
          const percent = ((response.count / percentage) * 100).toFixed(1);
          csvContent += `"${response.answer}": ${response.count} responses (${percent}%)\n`;
        });
      }
      csvContent += `\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `survey-analytics-${analytics.survey.id}-${Date.now()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div>Loading survey analytics...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Failed to load survey analytics</div>
        <Button onClick={() => navigate("/surveys")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Surveys
        </Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500 mb-4">Survey not found</div>
        <Button onClick={() => navigate("/surveys")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Surveys
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/surveys")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Surveys
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Survey Analytics
            </h1>
            <p className="text-slate-600">{analytics.survey.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={downloadAnalytics}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Badge
            className={
              analytics.survey.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          >
            {analytics.survey.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Survey Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Survey Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {analytics.totalResponses}
              </div>
              <div className="text-sm text-slate-600">Total Responses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {analytics.questionAnalytics.length}
              </div>
              <div className="text-sm text-slate-600">Questions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.survey.rewardPoints}
              </div>
              <div className="text-sm text-slate-600">Points Reward</div>
            </div>
          </div>
          {analytics.survey.description && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                {analytics.survey.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Analytics */}
      <div className="space-y-6">
        {analytics.questionAnalytics.map((question: any, index: number) => (
          <Card key={question.questionId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {getQuestionIcon(question.questionType)}
                <span className="text-slate-600">Q{question.questionId}.</span>
                {question.questionText}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getQuestionTypeLabel(question.questionType)}
                </Badge>
                {question.options && question.options.length > 0 && (
                  <Badge variant="outline">
                    {question.options.length} options
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>{renderQuestionAnalytics(question)}</CardContent>
          </Card>
        ))}
      </div>

      {analytics.questionAnalytics.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">No questions found in this survey.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
