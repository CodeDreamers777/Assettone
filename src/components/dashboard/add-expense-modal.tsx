"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRangePicker } from "./date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, ArrowRight, Check } from "lucide-react";

// Types definitions
interface ExpenseCategory {
  value: string;
  label: string;
}

interface PaymentMethod {
  value: string;
  label: string;
}

interface Expense {
  title: string;
  description?: string;
  amount: number;
  expense_date: string;
  category: string;
  custom_category?: string;
  property: string;
  unit: string | null;
  tenant: string | null;
  payment_method: string;
  vendor_name?: string;
  vendor_contact?: string;
  receipt_number?: string;
  is_tax_deductible: boolean;
  receipt_file?: File;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property: string;
  current_lease: {
    tenant: {
      id: string;
      name: string;
      email: string;
      phone_number: string;
    };
  } | null;
  is_occupied: boolean;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

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

const PAYMENT_METHODS: PaymentMethod[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHECK", label: "Check" },
  { value: "OTHER", label: "Other" },
];

// API function
const API_URL =
  "https://assettone-rental-management-production.up.railway.app/api/v1";
const getAuthHeaders = () => {
  const accessToken = localStorage.getItem("accessToken");
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

const createExpense = async (expense: FormData) => {
  const authHeaders = getAuthHeaders();
  const response = await axios.post(`${API_URL}/expenses/`, expense, {
    headers: {
      ...authHeaders.headers,
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// API function to fetch units for a property
// API function to fetch units for a property
const fetchUnitsForProperty = async (propertyId: string) => {
  if (!propertyId) return [];
  const response = await axios.get(
    `${API_URL}/properties/${propertyId}/units/`,
    getAuthHeaders(),
  );
  return response.data.units || [];
};

// Safe date parsing utility
const parseDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date();

  try {
    const parsedDate = new Date(dateStr);
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      return new Date();
    }
    return parsedDate;
  } catch (error) {
    return new Date();
  }
};

interface AddExpenseModalProps {
  properties: Property[];
  tenants: Tenant[];
  onAddExpense: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  properties = [], // Provide default empty arrays to prevent map errors
  tenants = [],
  onAddExpense,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const today = format(new Date(), "yyyy-MM-dd");
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // State for selected unit tenant information
  const [selectedUnitTenant, setSelectedUnitTenant] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: "",
    description: "",
    amount: 0,
    expense_date: today,
    category: "MAINTENANCE",
    custom_category: "",
    property: "",
    unit: null,
    tenant: null,
    payment_method: "CASH",
    vendor_name: "",
    vendor_contact: "",
    receipt_number: "",
    is_tax_deductible: true,
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Reset steps when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      resetNewExpenseForm();
    }
  }, [isOpen]);

  // Fetch units when property changes
  useEffect(() => {
    if (newExpense.property) {
      setIsLoadingUnits(true);
      fetchUnitsForProperty(newExpense.property)
        .then((fetchedUnits) => {
          setUnits(fetchedUnits);
          setIsLoadingUnits(false);
        })
        .catch((error) => {
          console.error("Error fetching units:", error);
          toast({
            title: "Error",
            description: "Failed to load units for this property",
            variant: "destructive",
          });
          setIsLoadingUnits(false);
          setUnits([]);
        });
    } else {
      setUnits([]);
    }
  }, [newExpense.property, toast]);

  // Update tenant info when unit changes
  useEffect(() => {
    if (newExpense.unit) {
      const selectedUnit = units.find((unit) => unit.id === newExpense.unit);
      if (selectedUnit && selectedUnit.current_lease) {
        const tenant = selectedUnit.current_lease.tenant;
        setSelectedUnitTenant({
          id: tenant.id,
          name: tenant.name,
        });
        setNewExpense({
          ...newExpense,
          tenant: tenant.id,
        });
      } else {
        setSelectedUnitTenant(null);
        setNewExpense({
          ...newExpense,
          tenant: null,
        });
      }
    } else {
      setSelectedUnitTenant(null);
    }
  }, [newExpense.unit, units]);

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast({ title: "Success", description: "Expense created successfully" });
      setIsOpen(false);
      resetNewExpenseForm();
      onAddExpense();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Error creating expense: ${error.response?.data?.detail || "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const resetNewExpenseForm = () => {
    setNewExpense({
      title: "",
      description: "",
      amount: 0,
      expense_date: today,
      category: "MAINTENANCE",
      custom_category: "",
      property: "",
      unit: null,
      tenant: null,
      payment_method: "CASH",
      vendor_name: "",
      vendor_contact: "",
      receipt_number: "",
      is_tax_deductible: true,
    });
    setReceiptFile(null);
    setCurrentStep(0);
    setSelectedUnitTenant(null);
    setUnits([]);
  };

  const handleAddExpense = async () => {
    // Validate required fields
    if (
      !newExpense.title ||
      !newExpense.property ||
      !newExpense.amount ||
      !newExpense.expense_date
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Format the data for submission
    const expenseData = new FormData();

    // Add all expense data to FormData
    Object.entries(newExpense).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        expenseData.append(key, String(value));
      }
    });

    // Add receipt file if available
    if (receiptFile) {
      expenseData.append("receipt_file", receiptFile);
    }

    try {
      await createMutation.mutateAsync(expenseData);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const handleNewExpensePropertyChange = (propertyId: string) => {
    setNewExpense({
      ...newExpense,
      property: propertyId,
      unit: null,
      tenant: null,
    });
    setSelectedUnitTenant(null);
  };

  const handleUnitChange = (unitId: string) => {
    const unitValue = unitId === "none" ? null : unitId;
    setNewExpense({
      ...newExpense,
      unit: unitValue,
      // Tenant will be set in the useEffect
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  // Initialize date range with proper defaults to prevent errors
  const dateRange = {
    from: parseDate(newExpense.expense_date),
    to: parseDate(newExpense.expense_date),
  };

  // Check if basic step is completed
  const isBasicStepComplete = () => {
    return (
      !!newExpense.title &&
      !!newExpense.property &&
      !!newExpense.amount &&
      !!newExpense.expense_date
    );
  };

  // Navigate to next step
  const goToNextStep = () => {
    if (currentStep === 0 && !isBasicStepComplete()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields before proceeding",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Step indicators component
  const StepIndicator = () => {
    const steps = ["Basic Info", "Details", "Receipt", "Review"];

    return (
      <div className="flex justify-between mb-6 w-full">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center text-white text-sm ${
                index === currentStep
                  ? "bg-blue-600"
                  : index < currentStep
                    ? "bg-green-600"
                    : "bg-gray-300"
              }`}
            >
              {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <span className="text-xs mt-1">{step}</span>
          </div>
        ))}
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-4 -z-10 mx-10">
          <div
            className="h-full bg-green-600"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new expense record.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
          <StepIndicator />
        </div>

        <div className="grid gap-4 py-4">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label
                    htmlFor="title"
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                  >
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newExpense.title || ""}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="amount"
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                  >
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newExpense.amount || ""}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="expense-date"
                    className="after:content-['*'] after:ml-0.5 after:text-red-500"
                  >
                    Date
                  </Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(range) => {
                      if (range?.from) {
                        setNewExpense({
                          ...newExpense,
                          expense_date: format(range.from, "yyyy-MM-dd"),
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="property"
                  className="after:content-['*'] after:ml-0.5 after:text-red-500"
                >
                  Property
                </Label>
                <Select
                  value={newExpense.property || ""}
                  onValueChange={handleNewExpensePropertyChange}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select Property" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(properties) && properties.length > 0 ? (
                      properties.map((property: Property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-properties" disabled>
                        No properties available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={newExpense.unit || ""}
                  onValueChange={handleUnitChange}
                  disabled={!newExpense.property || isLoadingUnits}
                >
                  <SelectTrigger id="unit">
                    <SelectValue
                      placeholder={
                        isLoadingUnits
                          ? "Loading units..."
                          : !newExpense.property
                            ? "Select Property First"
                            : "Select Unit (Optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Unit</SelectItem>
                    {isLoadingUnits ? (
                      <SelectItem value="loading" disabled>
                        Loading units...
                      </SelectItem>
                    ) : !newExpense.property ? (
                      <SelectItem value="select-property" disabled>
                        Select a property first
                      </SelectItem>
                    ) : units.length > 0 ? (
                      units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_number}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-units" disabled>
                        No units available for this property
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <div className="relative">
                  {isLoadingUnits ? (
                    <div className="p-2 border rounded-md bg-gray-50">
                      <p className="text-gray-500">
                        Loading units and tenants...
                      </p>
                    </div>
                  ) : !newExpense.property ? (
                    <div className="p-2 border rounded-md bg-gray-50">
                      <p className="text-gray-500">Select a property first</p>
                    </div>
                  ) : newExpense.unit ? (
                    selectedUnitTenant ? (
                      <div className="p-2 border rounded-md bg-gray-50">
                        <p>{selectedUnitTenant.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Unit's current tenant
                        </p>
                      </div>
                    ) : (
                      <div className="p-2 border rounded-md bg-gray-50">
                        <p className="text-gray-500">This unit has no tenant</p>
                      </div>
                    )
                  ) : (
                    <Select
                      value={newExpense.tenant || ""}
                      onValueChange={(val) =>
                        setNewExpense({
                          ...newExpense,
                          tenant: val === "none" ? null : val,
                        })
                      }
                      disabled={!newExpense.property}
                    >
                      <SelectTrigger id="tenant">
                        <SelectValue placeholder="Select Tenant (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Tenant</SelectItem>
                        {Array.isArray(tenants) && tenants.length > 0 ? (
                          tenants.map((tenant: Tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.first_name} {tenant.last_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-tenants" disabled>
                            No tenants available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="category"
                  className="after:content-['*'] after:ml-0.5 after:text-red-500"
                >
                  Category
                </Label>
                <Select
                  value={newExpense.category || "MAINTENANCE"}
                  onValueChange={(val) =>
                    setNewExpense({ ...newExpense, category: val })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newExpense.category === "OTHER" && (
                <div>
                  <Label htmlFor="custom-category">Custom Category</Label>
                  <Input
                    id="custom-category"
                    value={newExpense.custom_category || ""}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        custom_category: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newExpense.description || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={newExpense.payment_method || "CASH"}
                  onValueChange={(val) =>
                    setNewExpense({ ...newExpense, payment_method: val })
                  }
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input
                  id="vendor-name"
                  value={newExpense.vendor_name || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      vendor_name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="vendor-contact">Vendor Contact</Label>
                <Input
                  id="vendor-contact"
                  value={newExpense.vendor_contact || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      vendor_contact: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-tax-deductible"
                  checked={
                    newExpense.is_tax_deductible === undefined
                      ? true
                      : newExpense.is_tax_deductible
                  }
                  onCheckedChange={(checked) =>
                    setNewExpense({
                      ...newExpense,
                      is_tax_deductible: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is-tax-deductible">Tax Deductible</Label>
              </div>
            </div>
          )}

          {/* Step 3: Receipt (Optional) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="text-sm text-blue-700">
                  Receipt information is optional. You can skip this step if you
                  don't have a receipt.
                </p>
              </div>

              <div>
                <Label htmlFor="receipt-number">Receipt Number</Label>
                <Input
                  id="receipt-number"
                  value={newExpense.receipt_number || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      receipt_number: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="receipt-file">Upload Receipt</Label>
                <Input
                  id="receipt-file"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                {receiptFile && (
                  <p className="text-sm text-green-600 mt-2">
                    File selected: {receiptFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md mb-4">
                <p className="text-sm text-green-700 font-medium">
                  Please review your expense details before submitting
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Basic Information</h3>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>
                      <span className="font-medium">Title:</span>{" "}
                      {newExpense.title}
                    </li>
                    <li>
                      <span className="font-medium">Amount:</span> $
                      {newExpense.amount?.toFixed(2)}
                    </li>
                    <li>
                      <span className="font-medium">Date:</span>{" "}
                      {newExpense.expense_date}
                    </li>
                    <li>
                      <span className="font-medium">Property:</span>{" "}
                      {properties.find((p) => p.id === newExpense.property)
                        ?.name || "Unknown"}
                    </li>
                    {newExpense.unit && (
                      <li>
                        <span className="font-medium">Unit:</span>{" "}
                        {units.find((u) => u.id === newExpense.unit)
                          ?.unit_number || "None"}
                      </li>
                    )}
                    {selectedUnitTenant && (
                      <li>
                        <span className="font-medium">Tenant:</span>{" "}
                        {selectedUnitTenant.name}
                      </li>
                    )}
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-sm">Details</h3>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>
                      <span className="font-medium">Category:</span>{" "}
                      {EXPENSE_CATEGORIES.find(
                        (c) => c.value === newExpense.category,
                      )?.label || "Unknown"}
                    </li>
                    {newExpense.description && (
                      <li>
                        <span className="font-medium">Description:</span>{" "}
                        {newExpense.description}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">Payment Method:</span>{" "}
                      {PAYMENT_METHODS.find(
                        (m) => m.value === newExpense.payment_method,
                      )?.label || "Unknown"}
                    </li>
                    {newExpense.vendor_name && (
                      <li>
                        <span className="font-medium">Vendor:</span>{" "}
                        {newExpense.vendor_name}
                      </li>
                    )}
                    <li>
                      <span className="font-medium">Tax Deductible:</span>{" "}
                      {newExpense.is_tax_deductible ? "Yes" : "No"}
                    </li>
                    {receiptFile && (
                      <li>
                        <span className="font-medium">Receipt:</span>{" "}
                        {receiptFile.name}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={goToNextStep}
              className="flex items-center gap-1"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleAddExpense}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Expense
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
