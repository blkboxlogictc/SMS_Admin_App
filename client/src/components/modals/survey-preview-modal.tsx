import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle } from "lucide-react";
import type { Survey } from "@shared/schema";

interface SurveyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: Survey | null;
}

export function SurveyPreviewModal({
  isOpen,
  onClose,
  survey,
}: SurveyPreviewModalProps) {
  if (!survey) return null;

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

  const renderQuestionPreview = (question: any, index: number) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="space-y-2">
            <p className="font-medium text-slate-900">{question.text}</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-6 h-6 text-yellow-400 fill-current"
                />
              ))}
            </div>
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-2">
            <p className="font-medium text-slate-900">{question.text}</p>
            <div className="space-y-2">
              {question.options?.map((option: string, optionIndex: number) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                  <span className="text-slate-700">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            <p className="font-medium text-slate-900">{question.text}</p>
            <p className="text-xs text-slate-500 mb-2">Select all that apply</p>
            <div className="space-y-2">
              {question.options?.map((option: string, optionIndex: number) => (
                <div key={optionIndex} className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-300 rounded-sm"></div>
                  <span className="text-slate-700">{option}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "yes_no":
        return (
          <div className="space-y-2">
            <p className="font-medium text-slate-900">{question.text}</p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                <span className="text-slate-700">Yes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                <span className="text-slate-700">No</span>
              </div>
            </div>
          </div>
        );

      default: // text
        return (
          <div className="space-y-2">
            <p className="font-medium text-slate-900">{question.text}</p>
            <div className="w-full h-10 border-2 border-slate-200 rounded-md bg-slate-50"></div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Survey Preview: {survey.title}</span>
            <Badge
              className={
                survey.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }
            >
              {survey.isActive ? "Active" : "Inactive"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Survey Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{survey.title}</CardTitle>
              {survey.description && (
                <p className="text-slate-600">{survey.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span>Reward: {survey.rewardPoints} points</span>
                <span>Questions: {questions.length}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
            {questions.map((question: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {renderQuestionPreview(question, index)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Survey Footer */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>
                    Complete survey to earn {survey.rewardPoints} points
                  </span>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                  Submit Survey (Preview)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
