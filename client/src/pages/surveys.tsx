import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Building,
  List,
  PieChart,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SurveyModal } from "@/components/modals/survey-modal";
import { SurveyPreviewModal } from "@/components/modals/survey-preview-modal";
import { getAuthToken } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";
import type { Survey } from "@shared/schema";

export default function Surveys() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [previewSurvey, setPreviewSurvey] = useState<Survey | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = getAuthToken();
  const [, setLocation] = useLocation();

  const { data: surveys, isLoading } = useQuery({
    queryKey: ["/api/surveys"],
    queryFn: async () => {
      const response = await fetch("/api/surveys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch surveys");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Success",
        description: "Survey deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete survey",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (survey: Survey) => {
    setSelectedSurvey(survey);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this survey?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setSelectedSurvey(null);
    setIsModalOpen(true);
  };

  const handlePreview = (survey: Survey) => {
    setPreviewSurvey(survey);
    setIsPreviewOpen(true);
  };

  const handleAnalytics = (survey: Survey) => {
    setLocation(`/surveys/${survey.id}/analytics`);
  };

  if (isLoading) {
    return <div>Loading surveys...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Surveys Management
        </h2>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Survey
        </Button>
      </div>

      {/* Surveys List */}
      <div className="space-y-6">
        {surveys?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">
                No surveys found. Create your first survey to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          surveys?.map((survey: Survey) => (
            <Card key={survey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {survey.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {survey.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="text-sm text-slate-500 flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        Business: All Businesses
                      </span>
                      <span className="text-sm text-slate-500 flex items-center">
                        <List className="w-4 h-4 mr-1" />
                        {(() => {
                          try {
                            const questions =
                              typeof survey.questions === "string"
                                ? JSON.parse(survey.questions)
                                : Array.isArray(survey.questions)
                                ? survey.questions
                                : [];
                            return questions.length;
                          } catch (e) {
                            return 0;
                          }
                        })()}{" "}
                        questions
                      </span>
                      <span className="text-sm text-slate-500 flex items-center">
                        <PieChart className="w-4 h-4 mr-1" />0 responses
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        survey.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {survey.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnalytics(survey)}
                      className="text-blue-600 hover:text-blue-700"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(survey)}
                      className="text-slate-600 hover:text-slate-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(survey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Survey Questions Preview */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-medium text-slate-900 mb-3">
                    Questions Preview:
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      let questions = [];
                      try {
                        questions =
                          typeof survey.questions === "string"
                            ? JSON.parse(survey.questions)
                            : Array.isArray(survey.questions)
                            ? survey.questions
                            : [];
                      } catch (e) {
                        questions = [];
                      }

                      return questions.length > 0 ? (
                        <>
                          {questions
                            .slice(0, 3)
                            .map((question: any, index: number) => (
                              <div key={index} className="text-sm">
                                <span className="text-slate-600">
                                  {index + 1}.
                                </span>
                                <span className="text-slate-900 ml-2">
                                  {question.text ||
                                    question.question ||
                                    "Question text"}{" "}
                                  ({question.type || "text"})
                                </span>
                              </div>
                            ))}
                          {questions.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 mt-2"
                              onClick={() => handlePreview(survey)}
                            >
                              View all {questions.length} questions →
                            </Button>
                          )}
                          {questions.length <= 3 && questions.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 mt-2"
                              onClick={() => handlePreview(survey)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Preview Survey
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-slate-500">
                          No questions configured
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <SurveyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        survey={selectedSurvey}
      />

      <SurveyPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        survey={previewSurvey}
      />
    </div>
  );
}
