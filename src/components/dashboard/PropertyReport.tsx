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
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="border-green-200 bg-white">
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
        {loading ? "Generating..." : "Generate Property Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="property_report" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Units", value: reportData.total_units },
              { title: "Occupied Units", value: reportData.occupied_units },
              { title: "Total Leases", value: reportData.total_leases },
              { title: "Active Leases", value: reportData.active_leases },
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

          <Card className="border-green-200 bg-white hover:bg-green-50 transition-colors">
            <CardHeader>
              <CardTitle className="text-green-800">
                Total Rent Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700">
                ${reportData.total_rent_collected.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">
                Monthly Rent Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-50">
                      <th className="px-4 py-2 text-left text-green-800">
                        Month
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Total Rent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthly_rent_breakdown.map(
                      (item: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-green-100 hover:bg-green-50"
                        >
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

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">
                Maintenance Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800">
                    Total Requests
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    {reportData.maintenance_requests.total}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800">
                    By Status
                  </h3>
                  <ul className="space-y-2">
                    {reportData.maintenance_requests.by_status.map(
                      (item: any, index: number) => (
                        <li
                          key={index}
                          className="flex justify-between text-green-700"
                        >
                          <span>{item.status}</span>
                          <span className="font-semibold">{item.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-800">
                    By Priority
                  </h3>
                  <ul className="space-y-2">
                    {reportData.maintenance_requests.by_priority.map(
                      (item: any, index: number) => (
                        <li
                          key={index}
                          className="flex justify-between text-green-700"
                        >
                          <span>{item.priority}</span>
                          <span className="font-semibold">{item.count}</span>
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
