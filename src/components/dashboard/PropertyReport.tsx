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

interface Property {
  id: string;
  name: string;
  created_at: string;
}

const BASE_URL = "https://assettoneestates.pythonanywhere.com/api/v1";

export const PropertyReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/properties/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setProperties(
        response.data.properties.sort(
          (a: Property, b: Property) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch properties",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/reports/property_report/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          property_id: selectedProperty,
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
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger>
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
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
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {loading ? "Generating..." : "Generate Property Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="property_report" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Units</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{reportData.total_units}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Occupied Units</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {reportData.occupied_units}
                </p>
              </CardContent>
            </Card>
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Total Rent Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${reportData.total_rent_collected.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Rent Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-left">Total Rent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthly_rent_breakdown.map(
                      (item: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">
                            {format(new Date(item.month), "MMMM yyyy")}
                          </td>
                          <td className="px-4 py-2">
                            ${item.total_rent.toFixed(2)}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Total Requests</h3>
                  <p className="text-2xl font-bold">
                    {reportData.maintenance_requests.total}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">By Status</h3>
                  <ul>
                    {reportData.maintenance_requests.by_status.map(
                      (item: any, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.status}</span>
                          <span>{item.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">By Priority</h3>
                  <ul>
                    {reportData.maintenance_requests.by_priority.map(
                      (item: any, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.priority}</span>
                          <span>{item.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
