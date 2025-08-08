import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSurveySchema } from "@shared/schema";
import type { Survey, Business } from "@shared/schema";
import { z } from "zod";
import { getAuthToken } from "@/lib/supabase";

const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "rating", "multiple_choice", "checkbox", "yes_no"]),
  options: z.array(z.string()).optional(),
});

const surveyFormSchema = insertSurveySchema.extend({
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required"),
});

type SurveyForm = z.infer<typeof surveyFormSchema>;

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey?: Survey | null;
}

export function SurveyModal({ isOpen, onClose, survey }: SurveyModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = getAuthToken();

  const { data: businesses } = useQuery({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const response = await fetch("/api/businesses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch businesses");
      return response.json();
    },
  });

  const form = useForm<SurveyForm>({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [{ question: "", type: "text" }],
      rewardPoints: 10,
      isActive: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const createMutation = useMutation({
    mutationFn: async (data: SurveyForm) => {
      // Transform questions to include IDs and convert to JSON string for database storage
      const questionsWithIds = data.questions.map((q, index) => ({
        id: index + 1,
        question: q.question,
        type: q.type,
        options: q.options || [],
      }));

      const surveyData = {
        ...data,
        questions: JSON.stringify(questionsWithIds),
      };
      return apiRequest("POST", "/api/surveys", surveyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Success",
        description: "Survey created successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create survey",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SurveyForm) => {
      // Transform questions to include IDs and convert to JSON string for database storage
      const questionsWithIds = data.questions.map((q, index) => ({
        id: index + 1,
        question: q.question,
        type: q.type,
        options: q.options || [],
      }));

      const surveyData = {
        ...data,
        questions: JSON.stringify(questionsWithIds),
      };
      return apiRequest("PUT", `/api/surveys/${survey!.id}`, surveyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Success",
        description: "Survey updated successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update survey",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (survey) {
      let questions = [];
      try {
        const parsedQuestions =
          typeof survey.questions === "string"
            ? JSON.parse(survey.questions)
            : Array.isArray(survey.questions)
            ? survey.questions
            : [];

        questions = parsedQuestions.map((q: any) => ({
          question: q.question || q.text || "",
          type:
            q.type === "text" ||
            q.type === "rating" ||
            q.type === "multiple_choice" ||
            q.type === "checkbox" ||
            q.type === "yes_no"
              ? q.type
              : "text",
          options: q.options || [],
        }));
      } catch (e) {
        questions = [{ question: "", type: "text" as const }];
      }

      form.reset({
        title: survey.title,
        description: survey.description || "",
        questions:
          questions.length > 0 ? questions : [{ question: "", type: "text" }],
        rewardPoints: survey.rewardPoints || 10,
        isActive: survey.isActive ?? true,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        questions: [{ question: "", type: "text" }],
        rewardPoints: 10,
        isActive: true,
      });
    }
  }, [survey, form]);

  function onSubmit(data: SurveyForm) {
    if (survey) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const addQuestion = () => {
    append({ question: "", type: "text" });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {survey ? "Edit Survey" : "Create New Survey"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Survey Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Customer Satisfaction Survey"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Help us improve your experience at local businesses"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="rewardPoints"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Reward Points
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 10)
                        }
                        value={field.value || 10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Survey</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this survey available to users
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">
                  Questions
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900">
                        Question {index + 1}
                      </h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.question`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-slate-700">
                                Question Text *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="How would you rate your experience?"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`questions.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-700">
                              Question Type *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="rating">
                                  Rating Scale
                                </SelectItem>
                                <SelectItem value="multiple_choice">
                                  Multiple Choice
                                </SelectItem>
                                <SelectItem value="checkbox">
                                  Checkbox (Multiple Select)
                                </SelectItem>
                                <SelectItem value="yes_no">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(form.watch(`questions.${index}.type`) ===
                      "multiple_choice" ||
                      form.watch(`questions.${index}.type`) === "checkbox") && (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.options`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-slate-700">
                                Options (one per line)
                                {form.watch(`questions.${index}.type`) ===
                                  "checkbox" && (
                                  <span className="text-xs text-slate-500 ml-1">
                                    (users can select multiple)
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <textarea
                                  rows={4}
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Option 1
Option 2
Option 3"
                                  defaultValue={field.value?.join("\n") || ""}
                                  onBlur={(e) => {
                                    const options = e.target.value
                                      .split("\n")
                                      .filter((line) => line.trim() !== "");
                                    field.onChange(options);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading
                  ? "Saving..."
                  : survey
                  ? "Update Survey"
                  : "Create Survey"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
