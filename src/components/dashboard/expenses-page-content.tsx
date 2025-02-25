"use client";

import type React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, MoreVertical, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "./date-range-picker";
import { AddExpenseModal } from "./add-expense-modal";
import { ExpenseDetailsModal } from "./expense-details-modal"; // Import the new ExpenseDetailsModal

// Types
interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  category: string;
  category_display: string;
  custom_category: string | null;
  property: string;
  property_name: string;
  unit: string | null;
  unit_number: string | null;
  tenant: string | null;
  tenant_name: string | null;
  payment_method: string;
  vendor_name: string | null;
  vendor_contact: string | null;
  receipt_number: string | null;
  receipt_file: string | null;
  receipt_url: string | null;
  is_tax_deductible: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ExpenseCategory {
  value: string;
  label: string;
}

// Define the props interface for AddExpenseModal
interface AddExpenseModalProps {
  properties: Property[];
  onAddExpense: () => Promise<void>;
  // Add missing props that the component expects
  units?: Unit[];
  tenants?: Tenant[];
}

interface FilterState {
  property: string | null;
  unit: string | null;
  tenant: string | null;
  category: string | null;
  startDate: Date | undefined;
  endDate: Date | undefined;
  minAmount: string;
  maxAmount: string;
  search: string;
  taxDeductible: boolean | null;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// API service functions
const API_URL = "https://assettoneestates.pythonanywhere.com/api/v1";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

const fetchExpenses = async (filters: FilterState) => {
  const queryParams = new URLSearchParams();

  if (filters.property) queryParams.append("property", filters.property);
  if (filters.unit) queryParams.append("unit", filters.unit);
  if (filters.tenant) queryParams.append("tenant", filters.tenant);
  if (filters.category) queryParams.append("category", filters.category);
  if (filters.startDate)
    queryParams.append("start_date", format(filters.startDate, "yyyy-MM-dd"));
  if (filters.endDate)
    queryParams.append("end_date", format(filters.endDate, "yyyy-MM-dd"));
  if (filters.minAmount) queryParams.append("min_amount", filters.minAmount);
  if (filters.maxAmount) queryParams.append("max_amount", filters.maxAmount);
  if (filters.search) queryParams.append("search", filters.search);
  if (filters.taxDeductible !== null)
    queryParams.append("tax_deductible", String(filters.taxDeductible));

  const response = await axios.get(
    `${API_URL}/expenses/?${queryParams.toString()}`,
    getAuthHeaders(),
  );
  return response.data;
};

const fetchProperties = async () => {
  const response = await axios.get(`${API_URL}/properties/`, getAuthHeaders());
  return response.data.properties || [];
};

const fetchUnits = async (propertyId: string | null) => {
  let url = `${API_URL}/units/`;
  if (propertyId) url += `?property=${propertyId}`;
  const response = await axios.get(url, getAuthHeaders());
  return response.data;
};

const fetchTenants = async (propertyId: string | null) => {
  let url = `${API_URL}/tenants/`;
  if (propertyId) url += `?property=${propertyId}`;
  const response = await axios.get(url, getAuthHeaders());

  // Handle the structured response
  const data = response.data;

  // If we're requesting for a specific property, return only those tenants
  if (propertyId) {
    // Find the property name that matches our property ID
    for (const propertyName in data) {
      const tenants = data[propertyName];
      // Check if any tenant in this array has the matching property ID
      if (tenants.some((tenant: any) => tenant.property === propertyId)) {
        return tenants;
      }
    }
    return []; // Return empty array if no matching property found
  }

  // If no specific property, flatten all tenants into a single array
  let allTenants: Tenant[] = [];
  for (const propertyName in data) {
    allTenants = [...allTenants, ...data[propertyName]];
  }
  return allTenants;
};

const deleteExpense = async (id: string) => {
  const response = await axios.delete(
    `${API_URL}/expenses/${id}/`,
    getAuthHeaders(),
  );
  return response.data;
};

// Constants
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "REPAIRS", label: "Repairs" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "TAXES", label: "Property Taxes" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "CLEANING", label: "Cleaning" },
  { value: "LANDSCAPING", label: "Landscaping" },
  { value: "MANAGEMENT", label: "Management Fees" },
  { value: "LEGAL", label: "Legal Fees" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "OTHER", label: "Other" },
];

// Main component
const ExpensesPageContent: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [filters, setFilters] = useState<FilterState>({
    property: null,
    unit: null,
    tenant: null,
    category: null,
    startDate: undefined,
    endDate: undefined,
    minAmount: "",
    maxAmount: "",
    search: "",
    taxDeductible: null,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: expensesData = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => fetchExpenses(filters),
  });

  const { data: propertiesData = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const { data: unitsData = [] } = useQuery({
    queryKey: ["units", filters.property],
    queryFn: () => fetchUnits(filters.property),
    enabled: !!filters.property,
  });

  const { data: tenantsData = [] } = useQuery({
    queryKey: ["tenants", filters.property],
    queryFn: () => fetchTenants(filters.property),
    enabled: !!filters.property,
  });

  // Ensure our data is array, even if API returns something else
  const expenses = Array.isArray(expensesData) ? expensesData : [];
  const properties = Array.isArray(propertiesData) ? propertiesData : [];
  const units = Array.isArray(unitsData) ? unitsData : [];
  const tenants = Array.isArray(tenantsData) ? tenantsData : [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Success", description: "Expense deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Error deleting expense: ${error.response?.data?.detail || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const resetFilters = () => {
    setFilters({
      property: null,
      unit: null,
      tenant: null,
      category: null,
      startDate: undefined,
      endDate: undefined,
      minAmount: "",
      maxAmount: "",
      search: "",
      taxDeductible: null,
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      deleteMutation.mutate(id);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setFilters({
      ...filters,
      property: propertyId === "all" ? null : propertyId,
      unit: null,
      tenant: null,
    });
  };

  const handleDateRangeChange = (date: DateRange) => {
    setFilters({
      ...filters,
      startDate: date.from,
      endDate: date.to,
    });
  };

  // Render
  return (
    <div className="container mx-auto py-6 bg-green-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-800">Expenses</h1>
          <p className="text-green-600">
            Manage and track all property expenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-green-700 border-green-700 hover:bg-green-50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <AddExpenseModal
            properties={properties}
            units={units}
            tenants={tenants}
            onAddExpense={() =>
              queryClient.invalidateQueries({ queryKey: ["expenses"] })
            }
          />
        </div>
      </div>

      {/* Search and filters */}
      <Card className="mb-6 bg-white shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search expenses..."
                  className="pl-8 bg-white"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
              {filters.search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ ...filters, search: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label htmlFor="property-filter">Property</Label>
                  <Select
                    value={filters.property || "all"}
                    onValueChange={(val) => handlePropertyChange(val)}
                  >
                    <SelectTrigger id="property-filter">
                      <SelectValue placeholder="All Properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property: Property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit-filter">Unit</Label>
                  <Select
                    value={filters.unit || "all"}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        unit: val === "all" ? null : val,
                      })
                    }
                    disabled={!filters.property}
                  >
                    <SelectTrigger id="unit-filter">
                      <SelectValue placeholder="All Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Units</SelectItem>
                      {units.map((unit: Unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tenant-filter">Tenant</Label>
                  <Select
                    value={filters.tenant || "all"}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        tenant: val === "all" ? null : val,
                      })
                    }
                    disabled={!filters.property}
                  >
                    <SelectTrigger id="tenant-filter">
                      <SelectValue placeholder="All Tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {tenants.map((tenant: Tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category-filter">Category</Label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(val) =>
                      setFilters({
                        ...filters,
                        category: val === "all" ? null : val,
                      })
                    }
                  >
                    <SelectTrigger id="category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <DateRangePicker
                    value={{
                      from: filters.startDate,
                      to: filters.endDate,
                    }}
                    onChange={handleDateRangeChange}
                  />
                </div>

                <div>
                  <Label htmlFor="min-amount">Min Amount</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) =>
                      setFilters({ ...filters, minAmount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max-amount">Max Amount</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) =>
                      setFilters({ ...filters, maxAmount: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax-deductible"
                    checked={filters.taxDeductible === true}
                    onCheckedChange={(checked) => {
                      if (checked === "indeterminate") return;
                      setFilters({
                        ...filters,
                        taxDeductible: checked || null,
                      });
                    }}
                  />
                  <Label htmlFor="tax-deductible">Tax Deductible Only</Label>
                </div>

                <div className="md:col-span-2 flex items-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full md:w-auto"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="bg-green-700 text-white">
          <CardTitle className="text-2xl">Expense Records</CardTitle>
          <CardDescription className="text-green-100">
            {expenses.length} expenses found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExpenses ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-500">No expenses found</p>
              <Button
                variant="outline"
                className="mt-4 text-green-700 border-green-700 hover:bg-green-50"
                onClick={() =>
                  toast({
                    title: "Add Expense",
                    description: "Please use the Add Expense button at the top",
                  })
                }
              >
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100">
                    <TableHead className="text-green-800">Date</TableHead>
                    <TableHead className="text-green-800">Title</TableHead>
                    <TableHead className="text-green-800">Category</TableHead>
                    <TableHead className="text-green-800">Property</TableHead>
                    <TableHead className="text-green-800">Unit</TableHead>
                    <TableHead className="text-green-800">Amount</TableHead>
                    <TableHead className="text-green-800 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense: Expense) => (
                    <TableRow key={expense.id} className="hover:bg-green-50">
                      <TableCell className="font-medium text-green-800">
                        {format(new Date(expense.expense_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-800">
                          {expense.title}
                        </div>
                        {expense.vendor_name && (
                          <div className="text-sm text-green-600">
                            Vendor: {expense.vendor_name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-green-700">
                        {expense.category === "OTHER" && expense.custom_category
                          ? expense.custom_category
                          : expense.category_display}
                      </TableCell>
                      <TableCell className="text-green-700">
                        {expense.property_name}
                      </TableCell>
                      <TableCell className="text-green-700">
                        {expense.unit_number || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-green-800">
                        $
                        {Number.parseFloat(expense.amount.toString()).toFixed(
                          2,
                        )}
                        {expense.is_tax_deductible && (
                          <span className="ml-1 text-xs text-green-600">
                            TD
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-700 hover:text-green-800 hover:bg-green-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-green-700">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <ExpenseDetailsModal
                                expense={expense}
                                trigger={
                                  <button className="w-full text-left px-2 py-1.5 text-sm cursor-pointer">
                                    View Details
                                  </button>
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Delete Expense
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesPageContent;
