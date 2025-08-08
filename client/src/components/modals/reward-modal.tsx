import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRewardItemSchema } from "@shared/schema";
import type { RewardItem } from "@shared/schema";
import { z } from "zod";

const rewardFormSchema = insertRewardItemSchema.extend({
  pointThreshold: z.coerce
    .number()
    .min(1, "Point threshold must be at least 1"),
  expirationDate: z.string().optional(),
  expirationTime: z.string().optional(),
  maxRedemptions: z.coerce.number().optional(),
});

type RewardForm = z.infer<typeof rewardFormSchema>;

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward?: RewardItem | null;
}

export function RewardModal({ isOpen, onClose, reward }: RewardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RewardForm>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      pointThreshold: 100,
      expirationDate: "",
      expirationTime: "23:59",
      maxRedemptions: undefined,
      isActive: true,
      businessId: undefined,
      imageUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RewardForm) => {
      // Format expiration date for Supabase - AI recommended approach
      let formattedExpirationDate = null;
      if (data.expirationDate) {
        const dateTimeString = `${data.expirationDate}T${
          data.expirationTime || "23:59"
        }:00.000Z`; // Ensure UTC format
        const parsedDate = new Date(dateTimeString);
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid expiration date and time combination");
        }
        // Best Practice: Always use UTC ISO 8601 format
        formattedExpirationDate = parsedDate.toISOString();
        console.log(
          "Creating reward with expiration timestamp:",
          formattedExpirationDate
        );
      }

      const rewardData = {
        ...data,
        expirationDate: formattedExpirationDate,
        maxRedemptions: data.maxRedemptions || null,
        description: data.description || null,
        businessId: data.businessId || null,
        imageUrl: data.imageUrl || null,
      };
      // Remove expirationTime from the data sent to API
      delete rewardData.expirationTime;
      const response = await apiRequest(
        "POST",
        "/api/reward-items",
        rewardData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reward-items"] });
      toast({
        title: "Success",
        description: "Reward created successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create reward",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RewardForm) => {
      // Format expiration date for Supabase - AI recommended approach
      let formattedExpirationDate = null;
      if (data.expirationDate) {
        const dateTimeString = `${data.expirationDate}T${
          data.expirationTime || "23:59"
        }:00.000Z`; // Ensure UTC format
        const parsedDate = new Date(dateTimeString);
        if (isNaN(parsedDate.getTime())) {
          throw new Error("Invalid expiration date and time combination");
        }
        // Best Practice: Always use UTC ISO 8601 format
        formattedExpirationDate = parsedDate.toISOString();
        console.log(
          "Updating reward with expiration timestamp:",
          formattedExpirationDate
        );
      }

      const rewardData = {
        ...data,
        expirationDate: formattedExpirationDate,
        maxRedemptions: data.maxRedemptions || null,
        description: data.description || null,
        businessId: data.businessId || null,
        imageUrl: data.imageUrl || null,
      };
      // Remove expirationTime from the data sent to API
      delete rewardData.expirationTime;
      const response = await apiRequest(
        "PUT",
        `/api/reward-items/${reward!.id}`,
        rewardData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reward-items"] });
      toast({
        title: "Success",
        description: "Reward updated successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update reward",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (reward) {
      const rewardDate = reward.expirationDate
        ? new Date(reward.expirationDate)
        : null;
      const dateString = rewardDate
        ? rewardDate.toISOString().split("T")[0]
        : "";
      const timeString = rewardDate
        ? rewardDate.toTimeString().slice(0, 5)
        : "23:59";

      form.reset({
        name: reward.name,
        description: reward.description || "",
        pointThreshold: reward.pointThreshold,
        expirationDate: dateString,
        expirationTime: timeString,
        maxRedemptions: reward.maxRedemptions || undefined,
        isActive: reward.isActive ?? true,
        businessId: reward.businessId || undefined,
        imageUrl: reward.imageUrl || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        pointThreshold: 100,
        expirationDate: "",
        expirationTime: "23:59",
        maxRedemptions: undefined,
        isActive: true,
        businessId: undefined,
        imageUrl: "",
      });
    }
  }, [reward, form]);

  function onSubmit(data: RewardForm) {
    if (reward) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {reward ? "Edit Reward" : "Create New Reward"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Reward Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Free Coffee" {...field} />
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
                          placeholder="Get a free coffee of your choice at Downtown Coffee Co."
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
                name="pointThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Points Required *
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxRedemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Max Redemptions
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Leave empty for unlimited"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || undefined)
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Image URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/reward-image.jpg"
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
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Expiration Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expirationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Expiration Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || "23:59"}
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
                      <FormLabel className="text-base">Active Reward</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this reward available for redemption
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? true}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
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
                  : reward
                  ? "Update Reward"
                  : "Create Reward"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
