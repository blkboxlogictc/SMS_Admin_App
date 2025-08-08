import { useEffect, useState } from "react";
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
import { getAuthToken } from "@/lib/supabase";
import { insertEventSchema } from "@shared/schema";
import type { Event } from "@shared/schema";
import { z } from "zod";

const eventFormSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  imageUrl: z.string().optional(),
  organizerId: z.string().optional(),
});

type EventForm = z.infer<typeof eventFormSchema>;

interface UploadedImage {
  file: File;
  preview: string;
  tempImagePath?: string;
  tempEventId?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
}

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventForm>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      date: "",
      time: "",
      location: "",
      imageUrl: "",
      organizerId: undefined,
    },
  });

  // Handle image file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setSelectedImage(file);
    setImagePreview(preview);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      // Combine date and time into a single timestamp - treat as Eastern Time
      const dateTimeString = `${data.date}T${data.time}:00`; // Local time format
      const parsedDate = new Date(dateTimeString);

      // Validate date
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date and time combination");
      }

      // Store as Eastern Time without UTC conversion
      const easternTimeString = `${data.date}T${data.time}:00`;
      console.log("Creating event with Eastern Time:", easternTimeString);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("eventDate", easternTimeString);
      formData.append("location", data.location);
      if (data.organizerId) {
        formData.append("organizerId", data.organizerId);
      }

      // Add image file if selected
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const token = getAuthToken();
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create event");
      }

      return response.json();
    },
    onSuccess: () => {
      // Force refetch of events data
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.refetchQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });

      // Clean up image preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(null);
      setImagePreview(null);

      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Event create error:", error);
      toast({
        title: "Error",
        description: `Failed to create event: ${
          error.message || "Unknown error"
        }`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      // Combine date and time into a single timestamp - treat as Eastern Time
      const dateTimeString = `${data.date}T${data.time}:00`; // Local time format
      const parsedDate = new Date(dateTimeString);

      // Validate date
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date and time combination");
      }

      // Store as Eastern Time without UTC conversion
      const easternTimeString = `${data.date}T${data.time}:00`;
      console.log("Updating event with Eastern Time:", easternTimeString);

      const eventData = {
        name: data.name,
        description: data.description || null,
        eventDate: easternTimeString, // Store as Eastern Time
        location: data.location,
        imageUrl: data.imageUrl || null,
        organizerId: data.organizerId || null,
      };
      const response = await apiRequest(
        "PUT",
        `/api/events/${event!.id}`,
        eventData
      );
      return response.json();
    },
    onSuccess: () => {
      // Force refetch of events data
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.refetchQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      // Clean up image preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(null);
      setImagePreview(null);

      onClose();
      form.reset();
    },
    onError: (error: any) => {
      console.error("Event update error:", error);
      toast({
        title: "Error",
        description: `Failed to update event: ${
          error.message || "Unknown error"
        }`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (event) {
      // Parse the stored date as Eastern Time (no timezone conversion)
      const eventDateString = event.eventDate.toString();
      const dateString = eventDateString.split("T")[0];
      const timeString = eventDateString.split("T")[1].slice(0, 5);

      form.reset({
        name: event.name,
        description: event.description || "",
        date: dateString,
        time: timeString,
        location: event.location,
        imageUrl: event.imageUrl || "",
        organizerId: event.organizerId || undefined,
      });

      // Clear image preview when editing existing event
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(null);
      setImagePreview(null);
    } else {
      form.reset({
        name: "",
        description: "",
        date: "",
        time: "",
        location: "",
        imageUrl: "",
        organizerId: undefined,
      });

      // Clear image preview when creating new event
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(null);
      setImagePreview(null);
    }
  }, [event, form]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  function onSubmit(data: EventForm) {
    if (event) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? "Edit Event" : "Create New Event"}</DialogTitle>
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
                        Event Name *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Summer Jazz Festival" {...field} />
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
                          rows={4}
                          placeholder="Annual outdoor jazz music celebration featuring local and regional artists..."
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Date *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Time *
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Location *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Main Street Park" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">
                    Event Image
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Event preview"
                            className="w-full h-48 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="event-image-upload"
                          />
                          <label
                            htmlFor="event-image-upload"
                            className="cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="text-slate-500">
                                <p>Click to upload an event image</p>
                                <p className="text-xs">
                                  PNG, JPG, GIF up to 5MB
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-slate-500">
                    Upload an image for your event. It will be stored in a
                    folder named with the event ID.
                  </p>
                </FormItem>
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
                  : event
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
