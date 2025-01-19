import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Mail,
  MessageSquare,
  Phone,
  Search,
  User,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";

// Define the type for communication history items
interface CommunicationHistoryItem {
  id: string;
  type: string;
  subject: string;
  message: string;
  sent_by: { name: string };
  sent_at: string;
  recipients: { id: string; name: string }[];
  status: string;
  error_message?: string;
}

const CommunicationHistory = () => {
  const [history, setHistory] = useState<CommunicationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [tenantId, setTenantId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [type, startDate, tenantId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      let url =
        "https://assettoneestates.pythonanywhere.com/api/v1/communication-history/";

      const params = new URLSearchParams();
      if (type && type !== "ALL") params.append("type", type);
      if (startDate)
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (tenantId) params.append("tenant_id", tenantId);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch history");

      const { data } = (await response.json()) as {
        data: CommunicationHistoryItem[];
      };
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(
    (item) =>
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sent_by.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      case "SMS":
        return <Phone className="w-4 h-4" />;
      case "IN_APP":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-green-50 p-4 rounded-lg">
        <div>
          <Label>Message Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="IN_APP">In-App</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(day) => setStartDate(day || undefined)} // Handle potential undefined
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-end">
          <Button
            onClick={() => {
              setType("ALL");
              setStartDate(undefined); // Use undefined here
              setTenantId("");
              setSearchTerm("");
            }}
            variant="outline"
            className="w-full"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="h-[600px] rounded-md border border-green-100">
        <div className="space-y-4 p-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <MessageSquare className="h-12 w-12 text-green-300" />
              <p className="text-green-600">No communication history found</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="border border-green-100 rounded-lg p-4 space-y-3 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(item.type)}
                    <span className="font-semibold">{item.subject}</span>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </div>

                <p className="text-gray-600 whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{item.sent_by.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{format(new Date(item.sent_at), "PPpp")}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{item.recipients.length} recipient(s)</span>
                  </div>
                </div>

                {item.error_message && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm mt-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{item.error_message}</span>
                  </div>
                )}

                <div className="text-sm">
                  <strong className="text-gray-600">Recipients: </strong>
                  {item.recipients.map(
                    (
                      recipient: { id: string; name: string },
                      index: number,
                    ) => (
                      <span key={recipient.id}>
                        {recipient.name}
                        {index < item.recipients.length - 1 ? ", " : ""}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunicationHistory;
