"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import {
  CalendarIcon,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Percent,
  Archive,
} from "lucide-react";
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

const BASE_URL =
  "https://assettone-rental-management-production.up.railway.app/api/v1";

// List of expense categories - update with your actual categories
const EXPENSE_CATEGORIES = [
  "Repairs",
  "Maintenance",
  "Utilities",
  "Insurance",
  "Taxes",
  "Administrative",
  "Legal",
  "Marketing",
  "Cleaning",
  "Other",
];

export const ExpensesReport: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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
      const response = await axios.get(`${BASE_URL}/reports/expenses_report/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          property_id: selectedProperty || undefined,
          unit_id: selectedUnit || undefined,
          category: selectedCategory || undefined,
        },
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate expenses report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxDeductiblePercentage = () => {
    if (!reportData || reportData.total_expenses === 0) return 0;
    return (
      (reportData.tax_deductible_summary.deductible /
        reportData.total_expenses) *
      100
    );
  };

  const getPercentChange = () => {
    if (!reportData || !reportData.previous_period_comparison) return null;
    return reportData.previous_period_comparison.percent_change;
  };

  return (
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="border-green-200 bg-white">
            <SelectValue placeholder="Select Property (Optional)" />
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
            <SelectValue placeholder="Select Unit (Optional)" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.unit_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="border-green-200 bg-white">
            <SelectValue placeholder="Select Category (Optional)" />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
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
        {loading ? "Generating..." : "Generate Expenses Report"}
      </Button>

      {reportData && (
        <div className="mt-6 space-y-6">
          <ExportOptions data={reportData} filename="expenses_report" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-green-800">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center space-x-4">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold text-green-700">
                    KES {reportData.total_expenses.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600">
                    Total expenses for the period
                  </p>
                </div>
              </CardContent>
            </Card>

            {reportData.previous_period_comparison && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Period Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {getPercentChange() !== null && (
                      <>
                        {getPercentChange() > 0 ? (
                          <TrendingUp className="h-8 w-8 text-red-500" />
                        ) : (
                          <TrendingDown className="h-8 w-8 text-green-600" />
                        )}
                      </>
                    )}
                    <div className="flex-1">
                      <p className="text-xl font-bold text-green-700">
                        {getPercentChange() !== null
                          ? `${getPercentChange() > 0 ? "+" : ""}${getPercentChange().toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <p className="text-sm text-green-600">
                        KES{" "}
                        {reportData.previous_period_comparison.absolute_change.toFixed(
                          2,
                        )}{" "}
                        from previous period
                      </p>
                      <p className="text-xs text-green-500 mt-1">
                        Previous: KES{" "}
                        {reportData.previous_period_comparison.previous_period_total.toFixed(
                          2,
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="text-green-800">
                Tax Deductible Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <Percent className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-xl font-bold text-green-700">
                        KES{" "}
                        {reportData.tax_deductible_summary.deductible.toFixed(
                          2,
                        )}
                      </p>
                      <p className="text-sm text-green-600">Tax Deductible</p>
                    </div>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{
                        width: `${calculateTaxDeductiblePercentage()}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-green-600">
                    {calculateTaxDeductiblePercentage().toFixed(1)}% of total
                    expenses
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <Archive className="h-6 w-6 text-red-400" />
                    <div>
                      <p className="text-xl font-bold text-green-700">
                        KES{" "}
                        {reportData.tax_deductible_summary.non_deductible.toFixed(
                          2,
                        )}
                      </p>
                      <p className="text-sm text-green-600">Non-Deductible</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reportData.expense_breakdown_by_category &&
            reportData.expense_breakdown_by_category.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Expenses by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200 bg-green-50">
                          <th className="px-4 py-2 text-left text-green-800">
                            Category
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.expense_breakdown_by_category.map(
                          (category: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">
                                {category.category || "Uncategorized"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {category.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {(
                                  (category.total / reportData.total_expenses) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {reportData.expense_breakdown_by_property &&
            reportData.expense_breakdown_by_property.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Expenses by Property
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200 bg-green-50">
                          <th className="px-4 py-2 text-left text-green-800">
                            Property
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.expense_breakdown_by_property.map(
                          (property: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">
                                {property.property__name || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {property.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {(
                                  (property.total / reportData.total_expenses) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {reportData.expense_breakdown_by_unit &&
            reportData.expense_breakdown_by_unit.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Expenses by Unit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200 bg-green-50">
                          <th className="px-4 py-2 text-left text-green-800">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.expense_breakdown_by_unit.map(
                          (unit: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">
                                {unit.unit__unit_number || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {unit.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {(
                                  (unit.total / reportData.total_expenses) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {reportData.expense_breakdown_by_vendor &&
            reportData.expense_breakdown_by_vendor.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Expenses by Vendor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-green-200 bg-green-50">
                          <th className="px-4 py-2 text-left text-green-800">
                            Vendor
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.expense_breakdown_by_vendor.map(
                          (vendor: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">
                                {vendor.vendor_name || "Unknown"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {vendor.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {(
                                  (vendor.total / reportData.total_expenses) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {reportData.monthly_expense_trend &&
            reportData.monthly_expense_trend.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Monthly Expense Trend
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
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.monthly_expense_trend.map(
                          (month: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">
                                {format(new Date(month.month), "MMMM yyyy")}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {month.total.toFixed(2)}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          {reportData.recent_expenses &&
            reportData.recent_expenses.length > 0 && (
              <Card className="border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-800">
                    Recent Expenses
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
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-green-800">
                            Category
                          </th>
                          <th className="px-4 py-2 text-left text-green-800">
                            Property
                          </th>
                          <th className="px-4 py-2 text-left text-green-800">
                            Unit
                          </th>
                          <th className="px-4 py-2 text-left text-green-800">
                            Vendor
                          </th>
                          <th className="px-4 py-2 text-left text-green-800">
                            Payment Method
                          </th>
                          <th className="px-4 py-2 text-right text-green-800">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-center text-green-800">
                            Tax Deductible
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.recent_expenses.map(
                          (expense: any, index: number) => (
                            <tr
                              key={index}
                              className="border-b border-green-100 hover:bg-green-50"
                            >
                              <td className="px-4 py-2">{expense.title}</td>
                              <td className="px-4 py-2">
                                {format(new Date(expense.expense_date), "PP")}
                              </td>
                              <td className="px-4 py-2">
                                {expense.category || "Uncategorized"}
                              </td>
                              <td className="px-4 py-2">
                                {expense.property__name || "N/A"}
                              </td>
                              <td className="px-4 py-2">
                                {expense.unit__unit_number || "N/A"}
                              </td>
                              <td className="px-4 py-2">
                                {expense.vendor_name || "N/A"}
                              </td>
                              <td className="px-4 py-2">
                                {expense.payment_method || "N/A"}
                              </td>
                              <td className="px-4 py-2 text-right">
                                KES {expense.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {expense.is_tax_deductible ? "Yes" : "No"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}
    </div>
  );
};
