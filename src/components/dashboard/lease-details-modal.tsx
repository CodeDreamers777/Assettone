"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

// Define lease status type
type LeaseStatus = "active" | "terminated" | "expired" | "pending" | "inactive";

interface LeaseDetails {
  id: string;
  tenant_name: string;
  unit_details: {
    id: string;
    unit_number: string;
    property_name: string;
  };
  start_date: string;
  end_date: string;
  monthly_rent: string;
  security_deposit: string;
  payment_period: string;
  status: LeaseStatus;
  notes: string;
  is_signed: boolean;
  signed_at: string;
}

interface LeaseSummary {
  total_leases: number;
  active_leases: number;
  terminated_leases: number;
  expired_leases: number;
  pending_leases: number;
  inactive_leases: number;
}

interface LeaseResponse {
  summary: LeaseSummary;
  leases: {
    active: LeaseDetails[];
    terminated: LeaseDetails[];
    expired: LeaseDetails[];
    pending: LeaseDetails[];
    inactive: LeaseDetails[];
  };
}

interface LeaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string | null;
  unitId?: string | null;
  type: "tenant" | "unit";
}

// Define status colors with proper typing
const statusColors: Record<LeaseStatus, string> = {
  active: "bg-green-100 text-green-800",
  terminated: "bg-red-100 text-red-800",
  expired: "bg-orange-100 text-orange-800",
  pending: "bg-blue-100 text-blue-800",
  inactive: "bg-gray-100 text-gray-800",
};

const getStatusColor = (status: string): string => {
  return (
    statusColors[status.toLowerCase() as LeaseStatus] ||
    "bg-gray-100 text-gray-800"
  );
};

const formatDateTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);

  // Format date as "Feb 12, 2025"
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Format time as "6:18 PM"
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const formattedDate = date.toLocaleDateString("en-US", dateOptions);
  const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

  return `${formattedDate} at ${formattedTime}`;
};

export function LeaseDetailsModal({
  isOpen,
  onClose,
  tenantId,
  unitId,
  type,
}: LeaseDetailsModalProps) {
  const [leaseData, setLeaseData] = useState<LeaseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && (tenantId || unitId)) {
      fetchLeaseDetails();
    }
  }, [isOpen, tenantId, unitId]);

  const fetchLeaseDetails = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const id = type === "tenant" ? tenantId : unitId;
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/leases/get_lease_details/?type=${type}&id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch lease details");
      const data: LeaseResponse = await response.json();
      setLeaseData(data);
    } catch (error) {
      console.error("Error fetching lease details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSummaryCard = (
    title: string,
    value: number,
    className: string,
  ) => (
    <Card className={`${className} transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );

  const renderLeaseDetails = (lease: LeaseDetails) => (
    <Card
      key={lease.id}
      className="mb-4 hover:shadow-md transition-all border-l-4 border-l-green-500"
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-green-800">
              {lease.unit_details.property_name} - Unit{" "}
              {lease.unit_details.unit_number}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge className={`${getStatusColor(lease.status)} font-medium`}>
                {lease.status}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <p className="flex justify-between">
            <span className="text-gray-600">Tenant:</span>
            <span className="font-medium">{lease.tenant_name}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Start Date:</span>
            <span className="font-medium">{lease.start_date}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">End Date:</span>
            <span className="font-medium">{lease.end_date}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Monthly Rent:</span>
            <span className="font-medium text-green-700">
              KES {lease.monthly_rent}
            </span>
          </p>
        </div>
        <div className="space-y-2">
          <p className="flex justify-between">
            <span className="text-gray-600">Security Deposit:</span>
            <span className="font-medium">KES {lease.security_deposit}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Payment Period:</span>
            <span className="font-medium">{lease.payment_period}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-600">Signed:</span>
            <span className="font-medium">
              {lease.is_signed ? (
                <span className="text-green-600">
                  Yes ({formatDateTime(lease.signed_at)})
                </span>
              ) : (
                <span className="text-red-600">No</span>
              )}
            </span>
          </p>
        </div>
        {lease.notes && (
          <div className="col-span-2 mt-2 bg-gray-50 p-3 rounded-md">
            <p className="text-gray-600 font-medium mb-1">Notes:</p>
            <p className="text-gray-800">{lease.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 bg-green-50">
          <DialogTitle className="text-2xl font-bold text-green-800">
            {type === "tenant" ? "Tenant" : "Unit"} Lease Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : leaseData ? (
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                {renderSummaryCard(
                  "Active Leases",
                  leaseData.summary.active_leases,
                  "bg-green-50",
                )}
                {renderSummaryCard(
                  "Pending Leases",
                  leaseData.summary.pending_leases,
                  "bg-blue-50",
                )}
                {renderSummaryCard(
                  "Total Leases",
                  leaseData.summary.total_leases,
                  "bg-gray-50",
                )}
              </div>

              <Tabs defaultValue="active" className="mt-6">
                <TabsList className="bg-green-50 p-1">
                  <TabsTrigger
                    value="active"
                    className="data-[state=active]:bg-green-200"
                  >
                    Active ({leaseData.leases.active.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="data-[state=active]:bg-green-200"
                  >
                    Pending ({leaseData.leases.pending.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="data-[state=active]:bg-green-200"
                  >
                    Expired ({leaseData.leases.expired.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="terminated"
                    className="data-[state=active]:bg-green-200"
                  >
                    Terminated ({leaseData.leases.terminated.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="inactive"
                    className="data-[state=active]:bg-green-200"
                  >
                    Inactive ({leaseData.leases.inactive.length})
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="active">
                    {leaseData.leases.active.map(renderLeaseDetails)}
                  </TabsContent>
                  <TabsContent value="pending">
                    {leaseData.leases.pending.map(renderLeaseDetails)}
                  </TabsContent>
                  <TabsContent value="expired">
                    {leaseData.leases.expired.map(renderLeaseDetails)}
                  </TabsContent>
                  <TabsContent value="terminated">
                    {leaseData.leases.terminated.map(renderLeaseDetails)}
                  </TabsContent>
                  <TabsContent value="inactive">
                    {leaseData.leases.inactive.map(renderLeaseDetails)}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-6">
            <p className="text-gray-600">No lease details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
