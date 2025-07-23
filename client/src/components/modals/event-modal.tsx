import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertEventSchema } from "@shared/schema";
import type { Event } from "@shared/schema";
import { z } from "zod";

const eventFormSchema = insertEventSchema.extend({
  date: z.string().min(1, "Date is required"),
});

type EventForm = z.infer<typeof eventFormSchema>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
}

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EventForm>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      imageUrl: "",
      status: "upcoming",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      return apiRequest("POST", "/api/events", eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      const eventData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      return apiRequest("PUT", `/api/events/${event!.id}`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description,
        date: new Date(event.date).toISOString().split('T')[0],
        time: event.time,
        location: event.location,
        imageUrl: event.imageUrl || "",
        status: event.status || "upcoming",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        imageUrl: "",
        status: "upcoming",
      });
    }
  }, [event, form]);

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
          <DialogTitle>
            {event ? "Edit Event" : "Create New Event"}
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
                        Event Title *
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
                        Description *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Annual outdoor jazz music celebration featuring local and regional artists..."
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
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Event Image URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/event-image.jpg"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500">
                        Upload to your preferred image hosting service and paste the URL here
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                {isLoading ? "Saving..." : event ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
