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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBusinessSchema } from "@shared/schema";
import type { Business } from "@shared/schema";
import { z } from "zod";

const businessFormSchema = insertBusinessSchema.extend({
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  waitTime: z.coerce.number().optional(),
});

type BusinessForm = z.infer<typeof businessFormSchema>;

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  business?: Business | null;
}

export function BusinessModal({
  isOpen,
  onClose,
  business,
}: BusinessModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BusinessForm>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      website: "",
      phone: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      hours: "",
      imageUrl: "",
      isOpen: true,
      isFeatured: false,
      waitTime: undefined,
      ownerId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BusinessForm) => {
      return apiRequest("POST", "/api/businesses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Success",
        description: "Business created successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create business",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessForm) => {
      return apiRequest("PUT", `/api/businesses/${business!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/businesses"] });
      toast({
        title: "Success",
        description: "Business updated successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update business",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (business) {
      form.reset({
        name: business.name,
        category: business.category,
        description: business.description || "",
        website: business.website || "",
        phone: business.phone || "",
        address: business.address || "",
        latitude: business.latitude || undefined,
        longitude: business.longitude || undefined,
        hours: business.hours || "",
        imageUrl: business.imageUrl || "",
        isOpen: business.isOpen ?? true,
        isFeatured: business.isFeatured ?? false,
        waitTime: business.waitTime || undefined,
        ownerId: business.ownerId || "",
      });
    } else {
      form.reset({
        name: "",
        category: "",
        description: "",
        website: "",
        phone: "",
        address: "",
        latitude: undefined,
        longitude: undefined,
        hours: "",
        imageUrl: "",
        isOpen: true,
        isFeatured: false,
        waitTime: undefined,
        ownerId: "",
      });
    }
  }, [business, form]);

  function onSubmit(data: BusinessForm) {
    if (business) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const businessCategories = [
    "Restaurant",
    "Cafe",
    "Bar/Lounge",
    "Retail",
    "Service",
    "Entertainment",
    "Art Gallery",
    "Health & Wellness",
    "Professional Services",
    "Automotive",
    "Beauty & Personal Care",
    "Home & Garden",
    "Sports & Recreation",
    "Education",
    "Other",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {business ? "Edit Business" : "Create New Business"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Business Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Stuart Coffee Shop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Category *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {businessCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          placeholder="Describe your business..."
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(555) 123-4567"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com"
                        {...field}
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St, Stuart, FL 34994"
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
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Latitude
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="27.1972"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      Decimal degrees (e.g., 27.1972 for Stuart, FL)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Longitude
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-80.2528"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        value={field.value || ""}
                      />
                    </FormControl>
                    <p className="text-xs text-slate-500">
                      Decimal degrees (e.g., -80.2528 for Stuart, FL)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="https://example.com/image.jpg"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waitTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Wait Time (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="15"
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
                  name="hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Business Hours (JSON format)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder='{"monday":"9:00-17:00","tuesday":"9:00-17:00","wednesday":"9:00-17:00","thursday":"9:00-17:00","friday":"9:00-17:00","saturday":"10:00-16:00","sunday":"closed"}'
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
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Currently Open
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Is this business currently open for customers?
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

              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Featured Business
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Highlight this business as featured on the main app
                      </div>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
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
                  : business
                  ? "Update Business"
                  : "Create Business"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
