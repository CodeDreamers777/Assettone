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
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="border-green-200 bg-white">
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
            <Button
              variant="outline"
              className="w-full justify-start border-green-200 bg-white hover:bg-green-50"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-green-600" />
              {startDate ? format(startDate, "PPP") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              className="rounded-md border border-green-200"
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start border-green-200 bg-white hover:bg-green-50"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-green-600" />
              {endDate ? format(endDate, "PPP") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              className="rounded-md border border-green-200"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button
        onClick={generateReport}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors"
      >
        {loading ? "Generating..." : "Generate Tenant Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="tenant_report" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Leases", value: reportData.total_leases },
              { title: "Active Leases", value: reportData.active_leases },
              {
                title: "Terminated Leases",
                value: reportData.terminated_leases,
              },
              {
                title: "Total Rent Paid",
                value: `$${reportData.total_rent_paid.toFixed(2)}`,
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-green-200 bg-white hover:bg-green-50 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-green-800">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700">
                    {item.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-50">
                      <th className="px-4 py-2 text-left text-green-800">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Property
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payment_history.map(
                      (payment: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-green-100 hover:bg-green-50"
                        >
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

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">
                Maintenance Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-50">
                      <th className="px-4 py-2 text-left text-green-800">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Priority
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Requested Date
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Property
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.maintenance_requests.map(
                      (request: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-green-100 hover:bg-green-50"
                        >
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
