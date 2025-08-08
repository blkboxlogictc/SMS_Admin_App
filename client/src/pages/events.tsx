import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { EventModal } from "@/components/modals/event-modal";
import { getAuthToken } from "@/lib/supabase";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export default function Events() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = getAuthToken();

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await fetch("/api/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });

  const { data: rsvpCounts } = useQuery({
    queryKey: ["/api/events/rsvp-counts"],
    queryFn: async () => {
      const response = await fetch("/api/events/rsvp-counts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch RSVP counts");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      // Force refetch of events data
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.refetchQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const filteredEvents =
    events?.filter(
      (event: Event) =>
        event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getEventStatus = (eventDate: string) => {
    const now = new Date();

    // Parse the stored date as Eastern Time (no timezone conversion)
    const eventDateString = eventDate.toString();
    const [datePart] = eventDateString.split("T");
    const [year, month, day] = datePart.split("-");
    const eventDay = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );

    // Reset time to start of day for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (eventDay < today) {
      return "Past";
    } else if (eventDay > today) {
      return "Upcoming";
    } else {
      return "Today";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Past":
        return "bg-gray-100 text-gray-800";
      case "Today":
        return "bg-blue-100 text-blue-800";
      case "Upcoming":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRsvpCount = (eventId: number) => {
    if (!rsvpCounts) return 0;
    const rsvpData = rsvpCounts.find((item: any) => item.eventId === eventId);
    return rsvpData ? rsvpData.rsvpCount : 0;
  };

  if (isLoading) {
    return <div>Loading events...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Events Management</h2>
        <Button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select className="px-3 py-2 border border-slate-300 rounded-lg">
            <option>All Status</option>
            <option>Upcoming</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg">
            <option>All Locations</option>
            <option>Downtown</option>
            <option>Main Street</option>
            <option>Community Center</option>
          </select>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  RSVPs
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No events found.{" "}
                    {searchTerm && "Try adjusting your search."}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event: Event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {event.imageUrl && (
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {event.name}
                          </p>
                          <p className="text-sm text-slate-500 line-clamp-1">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {(() => {
                          // Parse the stored date as Eastern Time (no timezone conversion)
                          const eventDateString = event.eventDate.toString();
                          const [datePart, timePart] =
                            eventDateString.split("T");
                          const [year, month, day] = datePart.split("-");
                          const localDate = new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day)
                          );
                          return localDate.toLocaleDateString("en-US");
                        })()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {(() => {
                          // Parse the stored time as Eastern Time (no timezone conversion)
                          const eventDateString = event.eventDate.toString();
                          const [datePart, timePart] =
                            eventDateString.split("T");
                          if (timePart) {
                            const [hours, minutes] = timePart.split(":");
                            const hour24 = parseInt(hours);
                            const hour12 =
                              hour24 === 0
                                ? 12
                                : hour24 > 12
                                ? hour24 - 12
                                : hour24;
                            const ampm = hour24 >= 12 ? "PM" : "AM";
                            return `${hour12}:${minutes} ${ampm}`;
                          }
                          return "";
                        })()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">{event.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-900">
                        {getRsvpCount(event.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const status = getEventStatus(
                          event.eventDate.toString()
                        );
                        return (
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
