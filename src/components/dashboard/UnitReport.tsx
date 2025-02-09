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

interface Unit {
  id: string;
  unit_number: string;
}

const BASE_URL = "https://assettoneestates.pythonanywhere.com/api/v1";

export const UnitReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty);
    }
  }, [selectedProperty]);

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

  const fetchUnits = async (propertyId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${BASE_URL}/properties/${propertyId}/units/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      setUnits(response.data.units || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch units",
        variant: "destructive",
      });
      setUnits([]);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(`${BASE_URL}/reports/unit_report/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          unit_id: selectedUnit,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Select value={selectedUnit} onValueChange={setSelectedUnit}>
          <SelectTrigger className="border-green-200 bg-white">
            <SelectValue placeholder="Select Unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.unit_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {loading ? "Generating..." : "Generate Unit Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="unit_report" />

          <Card className="border-green-200 bg-white hover:bg-green-50 transition-colors">
            <CardHeader>
              <CardTitle className="text-green-800">Unit Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-4 text-green-700">
                Total Leases:{" "}
                <span className="font-bold">{reportData.total_leases}</span>
              </p>
              <h3 className="font-semibold mb-2 text-green-800">
                Current Lease
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
                <div className="space-y-2 text-green-700">
                  <p>
                    Tenant: {reportData.current_lease.tenant__first_name}{" "}
                    {reportData.current_lease.tenant__last_name}
                  </p>
                  <p>
                    Start Date:{" "}
                    {format(
                      new Date(reportData.current_lease.start_date),
                      "PP",
                    )}
                  </p>
                  <p>
                    End Date:{" "}
                    {format(new Date(reportData.current_lease.end_date), "PP")}
                  </p>
                </div>
                <div className="space-y-2 text-green-700">
                  <p>Status: {reportData.current_lease.status}</p>
                  <p>
                    Monthly Rent: KES
                    {reportData.current_lease.monthly_rent.toFixed(2)}
                  </p>
                  <p>
                    Security Deposit: KES
                    {reportData.current_lease.security_deposit.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">Lease History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-green-200 bg-green-50">
                      <th className="px-4 py-2 text-left text-green-800">
                        Tenant
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Start Date
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        End Date
                      </th>
                      <th className="px-4 py-2 text-left text-green-800">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.lease_history.map(
                      (lease: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-green-100 hover:bg-green-50"
                        >
                          <td className="px-4 py-2">{`${lease.tenant__first_name} ${lease.tenant__last_name}`}</td>
                          <td className="px-4 py-2">
                            {format(new Date(lease.start_date), "PP")}
                          </td>
                          <td className="px-4 py-2">
                            {format(new Date(lease.end_date), "PP")}
                          </td>
                          <td className="px-4 py-2">{lease.status}</td>
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
              <CardTitle className="text-green-800">Rent Payments</CardTitle>
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
                        Tenant
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rent_payments.map(
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
                          <td className="px-4 py-2">{`${payment.lease__tenant__first_name} ${payment.lease__tenant__last_name}`}</td>
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
