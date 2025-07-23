import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Star, Edit, MapPin, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";
import type { Business } from "@shared/schema";

export default function Businesses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = getAuthToken();

  const { data: businesses, isLoading } = useQuery({
    queryKey: ["/api/businesses"],
    queryFn: async () => {
      const response = await fetch("/api/businesses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch businesses");
      return response.json();
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async (business: Business) => {
      await apiRequest("PUT", `/api/businesses/${business.id}`, {
        featured: !business.featured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Success",
        description: "Business featured status updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business",
        variant: "destructive",
      });
    },
  });

  const handleToggleFeatured = (business: Business) => {
    toggleFeaturedMutation.mutate(business);
  };

  const filteredBusinesses = businesses?.filter((business: Business) => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || 
                           business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = ["All Categories", ...Array.from(new Set(businesses?.map((b: Business) => b.category).filter(Boolean) || []))];

  if (isLoading) {
    return <div>Loading businesses...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Businesses Management</h2>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg"
          >
            {categories.map((category: string) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">
              No businesses found. {searchTerm && "Try adjusting your search."}
            </p>
          </div>
        ) : (
          filteredBusinesses.map((business: Business) => (
            <Card key={business.id} className="overflow-hidden">
              {business.imageUrl && (
                <img 
                  src={business.imageUrl} 
                  alt={business.name}
                  className="w-full h-48 object-cover"
                />
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{business.name}</h3>
                    <p className="text-sm text-slate-600">{business.category}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleFeatured(business)}
                      className={`${
                        business.featured 
                          ? "bg-amber-100 text-amber-600 hover:bg-amber-200" 
                          : "text-slate-400 hover:bg-slate-100"
                      } rounded-lg`}
                      title="Toggle Featured"
                    >
                      <Star className={`w-4 h-4 ${business.featured ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {business.address && (
                    <div className="flex items-center text-sm text-slate-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{business.address}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-slate-600">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>0 total check-ins</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Last activity: Never</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={business.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {business.active ? "Active" : "Inactive"}
                    </Badge>
                    {business.featured && (
                      <Badge className="bg-amber-100 text-amber-800">
                        Featured
                      </Badge>
                    )}
                  </div>
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
          ))
        )}
      </div>
    </div>
  );
}
