import React, { useState, useEffect } from "react";
import { DashboardShell } from "./shell";
import { DashboardHeader } from "./header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Phone, Search, Users, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CommunicationHistory from "./Communications";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PropertyTenants {
  [propertyName: string]: Array<Tenant>;
}

export function Messages() {
  const [propertyTenants, setPropertyTenants] = useState<PropertyTenants>({});
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messagingMode, setMessagingMode] = useState("email");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/tenants/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data: PropertyTenants = await response.json();
      setPropertyTenants(data);
      if (Object.keys(data).length > 0) {
        setSelectedProperty(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tenants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTenantSelection = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId],
    );
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedTenants(
        propertyTenants[selectedProperty]?.map((tenant) => tenant.id) || [],
      );
    } else {
      setSelectedTenants([]);
    }
  };

  const sendMessage = async () => {
    if (messagingMode !== "email") {
      toast({
        title: "Coming Soon",
        description: `${messagingMode === "sms" ? "SMS" : "In-app messaging"} is not yet available.`,
      });
      return;
    }

    if (!subject || !message || selectedTenants.length === 0) {
      toast({
        title: "Error",
        description:
          "Please fill in all fields and select at least one tenant.",
        variant: "destructive",
      });
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/email-tenants/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            subject,
            message,
            tenants: selectedTenants,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to send email");

      toast({
        title: "Success",
        description: "Email sent successfully.",
      });

      // Reset form
      setSubject("");
      setMessage("");
      setSelectedTenants([]);
      setSelectAll(false);
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredTenants =
    propertyTenants[selectedProperty]?.filter((tenant) =>
      `${tenant.first_name} ${tenant.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    ) || [];

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tenant Communications Hub"
        text="Send messages and updates to your tenants efficiently."
      />
      <Tabs defaultValue="compose" className="w-full space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-green-50">
          <TabsTrigger
            value="compose"
            className="data-[state=active]:bg-green-100"
          >
            <Mail className="w-4 h-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-green-100"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card className="border-green-100">
            <CardHeader className="bg-green-50 border-b border-green-100">
              <CardTitle className="text-green-800">New Message</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Recipients */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <Label className="text-lg font-semibold text-green-800">
                        Recipients
                      </Label>
                    </div>

                    <Select
                      value={selectedProperty}
                      onValueChange={setSelectedProperty}
                    >
                      <SelectTrigger className="bg-green-50 border-green-200">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(propertyTenants).map((propertyName) => (
                          <SelectItem key={propertyName} value={propertyName}>
                            {propertyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="select-all"
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all">Select All Tenants</Label>
                      </div>
                      <span className="text-sm text-green-600">
                        {selectedTenants.length} selected
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search tenants by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-green-200"
                        />
                      </div>
                      <ScrollArea className="h-[250px] border border-green-100 rounded-lg">
                        <div className="p-4 space-y-2">
                          {filteredTenants.map((tenant) => (
                            <div
                              key={tenant.id}
                              className="flex items-center space-x-3 p-2 hover:bg-green-50 rounded-md transition-colors"
                            >
                              <input
                                type="checkbox"
                                id={tenant.id}
                                checked={selectedTenants.includes(tenant.id)}
                                onChange={() =>
                                  handleTenantSelection(tenant.id)
                                }
                                className="rounded border-green-300 text-green-600 focus:ring-green-500"
                              />
                              <Label
                                htmlFor={tenant.id}
                                className="flex-1 cursor-pointer"
                              >
                                {`${tenant.first_name} ${tenant.last_name}`}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>

                {/* Right Column - Message Content */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-green-600" />
                      <Label className="text-lg font-semibold text-green-800">
                        Message Details
                      </Label>
                    </div>

                    <Select
                      value={messagingMode}
                      onValueChange={setMessagingMode}
                    >
                      <SelectTrigger className="bg-green-50 border-green-200">
                        <SelectValue placeholder="Select messaging mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-green-600" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="sms" disabled>
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4" />
                            SMS (Coming Soon)
                          </div>
                        </SelectItem>
                        <SelectItem value="in-app" disabled>
                          <div className="flex items-center">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            In-app (Coming Soon)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter message subject"
                        className="border-green-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message Content</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={6}
                        className="border-green-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Send Button and Info */}
              <div className="pt-4 border-t border-green-100">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <Alert className="bg-green-50 border-green-200">
                    <Info className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      Selected recipients will receive the message via their
                      preferred communication method.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={sendMessage}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]"
                    disabled={
                      !subject || !message || selectedTenants.length === 0
                    }
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-green-100">
            <CardHeader className="bg-green-50 border-b border-green-100">
              <CardTitle className="text-green-800">Message History</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CommunicationHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
