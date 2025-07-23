import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSurveySchema } from "@shared/schema";
import type { Survey, Business } from "@shared/schema";
import { z } from "zod";
import { getAuthToken } from "@/lib/supabase";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "rating", "multiple_choice", "yes_no"]),
  options: z.array(z.string()).optional(),
});

const surveyFormSchema = insertSurveySchema.extend({
  questions: z.array(questionSchema).min(1, "At least one question is required"),
  businessId: z.coerce.number().optional(),
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
      type: "satisfaction",
      questions: [{ text: "", type: "text" }],
      businessId: undefined,
      active: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const createMutation = useMutation({
    mutationFn: async (data: SurveyForm) => {
      return apiRequest("POST", "/api/surveys", data);
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
      return apiRequest("PUT", `/api/surveys/${survey!.id}`, data);
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
      const questions = Array.isArray(survey.questions) 
        ? survey.questions.map((q: any) => ({
            text: q.text || q.question || "",
            type: (q.type === "text" || q.type === "rating" || q.type === "multiple_choice" || q.type === "yes_no") ? q.type : "text",
            options: q.options || [],
          }))
        : [{ text: "", type: "text" as const }];

      form.reset({
        title: survey.title,
        description: survey.description || "",
        type: survey.type,
        questions,
        businessId: survey.businessId || undefined,
        active: survey.active,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        type: "satisfaction",
        questions: [{ text: "", type: "text" }],
        businessId: undefined,
        active: true,
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
    append({ text: "", type: "text" });
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
                        <Input placeholder="Customer Satisfaction Survey" {...field} />
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Survey Type *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select survey type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="satisfaction">Satisfaction</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Business (Optional)
                    </FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business or leave for all" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">All Businesses</SelectItem>
                        {businesses?.map((business: Business) => (
                          <SelectItem key={business.id} value={business.id.toString()}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Questions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">Questions</h3>
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
                  <div key={field.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900">Question {index + 1}</h4>
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
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-slate-700">
                                Question Text *
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="How would you rate your experience?" {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="rating">Rating Scale</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="yes_no">Yes/No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch(`questions.${index}.type`) === "multiple_choice" && (
                      <div className="mt-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.options`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-slate-700">
                                Options (one per line)
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  rows={3}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  value={field.value?.join('\n') || ''}
                                  onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
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
                {isLoading ? "Saving..." : survey ? "Update Survey" : "Create Survey"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
