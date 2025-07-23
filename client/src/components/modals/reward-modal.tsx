import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertRewardSchema } from "@shared/schema";
import type { Reward } from "@shared/schema";
import { z } from "zod";

const rewardFormSchema = insertRewardSchema.extend({
  pointThreshold: z.coerce.number().min(1, "Point threshold must be at least 1"),
  expirationDate: z.string().optional(),
});

type RewardForm = z.infer<typeof rewardFormSchema>;

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward?: Reward | null;
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
      active: true,
      businessId: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RewardForm) => {
      const rewardData = {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
      };
      return apiRequest("POST", "/api/rewards", rewardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
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
      const rewardData = {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate).toISOString() : null,
      };
      return apiRequest("PUT", `/api/rewards/${reward!.id}`, rewardData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
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
      form.reset({
        name: reward.name,
        description: reward.description,
        pointThreshold: reward.pointThreshold,
        expirationDate: reward.expirationDate ? new Date(reward.expirationDate).toISOString().split('T')[0] : "",
        active: reward.active,
        businessId: reward.businessId || undefined,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        pointThreshold: 100,
        expirationDate: "",
        active: true,
        businessId: undefined,
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
                        Description *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Get a free coffee of your choice at Downtown Coffee Co."
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
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Expiration Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
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
                {isLoading ? "Saving..." : reward ? "Update Reward" : "Create Reward"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
