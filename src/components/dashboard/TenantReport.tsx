"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportOptions } from "./ExportOptions";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

const BASE_URL = "https://assettoneestates.pythonanywhere.com/api/v1";

export const TenantReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/tenants/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const fetchedTenants = Object.values(response.data).flat() as Tenant[];
      setTenants(fetchedTenants);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenants",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/reports/tenant_report/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          tenant_id: selectedTenant,
        },
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger>
            <SelectValue placeholder="Select Tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {`${tenant.first_name} ${tenant.last_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        onClick={generateReport}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading ? "Generating..." : "Generate Tenant Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="tenant_report" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Leases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{reportData.total_leases}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Active Leases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{reportData.active_leases}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Terminated Leases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {reportData.terminated_leases}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Rent Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  ${reportData.total_rent_paid.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Property</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payment_history.map(
                      (payment: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            {format(new Date(payment.payment_date), "PP")}
                          </td>
                          <td className="px-4 py-2">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2">
                            {payment.lease__unit__property__name}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Title</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Priority</th>
                      <th className="px-4 py-2 text-left">Requested Date</th>
                      <th className="px-4 py-2 text-left">Property</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.maintenance_requests.map(
                      (request: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">{request.title}</td>
                          <td className="px-4 py-2">{request.status}</td>
                          <td className="px-4 py-2">{request.priority}</td>
                          <td className="px-4 py-2">
                            {format(new Date(request.requested_date), "PP")}
                          </td>
                          <td className="px-4 py-2">
                            {request.unit__property__name}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
