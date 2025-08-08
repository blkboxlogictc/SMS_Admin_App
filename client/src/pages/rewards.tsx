import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Coffee,
  Gift as GiftIcon,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RewardModal } from "@/components/modals/reward-modal";
import { apiRequest } from "@/lib/queryClient";
import type { RewardItem } from "@shared/schema";

export default function Rewards() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["/api/reward-items"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reward-items");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reward-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reward-items"] });
      toast({
        title: "Success",
        description: "Reward item deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete reward",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (reward: RewardItem) => {
    setSelectedReward(reward);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this reward?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setSelectedReward(null);
    setIsModalOpen(true);
  };

  const getRewardIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("coffee")) return Coffee;
    if (lowerName.includes("dinner") || lowerName.includes("food"))
      return Utensils;
    return GiftIcon;
  };

  if (isLoading) {
    return <div>Loading rewards...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Rewards Management
        </h2>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Reward
        </Button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards?.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <GiftIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">
              No rewards found. Create your first reward to get started.
            </p>
          </div>
        ) : (
          rewards?.map((reward: RewardItem) => {
            const IconComponent = getRewardIcon(reward.name);
            return (
              <Card key={reward.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reward)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reward.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2">
                    {reward.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    {reward.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Points Required:</span>
                      <span className="font-medium text-slate-900">
                        {reward.pointThreshold}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Max Redemptions:</span>
                      <span className="font-medium text-slate-900">
                        {reward.maxRedemptions || "Unlimited"}
                      </span>
                    </div>
                    {reward.expirationDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Expires:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(reward.expirationDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge
                      className={
                        reward.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {reward.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <RewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reward={selectedReward}
      />
    </div>
  );
}
