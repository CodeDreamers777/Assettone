import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, DollarSign, FileCheck, ClipboardList } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface EditLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lease: any) => void;
  lease: any;
}

export function EditLeaseModal({
  isOpen,
  onClose,
  onEdit,
  lease,
}: EditLeaseModalProps) {
  const [formData, setFormData] = useState({
    unit: "",
    tenant: "",
    start_date: "",
    end_date: "",
    monthly_rent: "",
    security_deposit: "",
    payment_period: "",
    is_signed: false,
    notes: "",
  });

  // Track which fields have been modified
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Reset form data when lease changes or modal opens
  useEffect(() => {
    if (lease) {
      setFormData({
        unit: lease.unit || "",
        tenant: lease.tenant || "",
        start_date: lease.start_date || "",
        end_date: lease.end_date || "",
        monthly_rent: lease.monthly_rent ? String(lease.monthly_rent) : "",
        security_deposit: lease.security_deposit
          ? String(lease.security_deposit)
          : "",
        payment_period: lease.payment_period || "MONTHLY",
        is_signed: lease.is_signed || false,
        notes: lease.notes || "",
      });
      // Reset modified fields when the modal opens with new data
      setModifiedFields(new Set());
    }
  }, [lease, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const fieldValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData({ ...formData, [name]: fieldValue });

    // Track this field as modified
    setModifiedFields((prev) => {
      const updated = new Set(prev);
      updated.add(name);
      return updated;
    });
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Track this field as modified
    setModifiedFields((prev) => {
      const updated = new Set(prev);
      updated.add(field);
      return updated;
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, is_signed: checked });

    // Track this field as modified
    setModifiedFields((prev) => {
      const updated = new Set(prev);
      updated.add("is_signed");
      return updated;
    });
  };

  const setStandardLeaseTerm = () => {
    // Calculate end date as 2 years from start date
    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setFullYear(startDate.getFullYear() + 2);

      // Format to YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split("T")[0];
      setFormData({ ...formData, end_date: formattedEndDate });

      // Track end_date as modified
      setModifiedFields((prev) => {
        const updated = new Set(prev);
        updated.add("end_date");
        return updated;
      });
    } else {
      toast({
        title: "Error",
        description: "Please set a start date first",
        variant: "destructive",
      });
    }
  };

  const setSecurityDepositToRent = () => {
    // Set security deposit equal to monthly rent
    if (formData.monthly_rent) {
      setFormData({ ...formData, security_deposit: formData.monthly_rent });

      // Track security_deposit as modified
      setModifiedFields((prev) => {
        const updated = new Set(prev);
        updated.add("security_deposit");
        return updated;
      });
    } else {
      toast({
        title: "Error",
        description: "Please set monthly rent first",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create a new object with only the modified fields for PATCH
      const patchData: { [key: string]: any } = {};
      modifiedFields.forEach((field) => {
        patchData[field] = formData[field as keyof typeof formData];
      });

      // If nothing was modified, show a message and close
      if (Object.keys(patchData).length === 0) {
        toast({
          title: "No changes",
          description: "No changes were made to the lease.",
          variant: "default",
        });
        onClose();
        return;
      }

      console.log("Sending PATCH with modified fields:", patchData);

      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${lease.id}/`,
        {
          method: "PATCH", // Changed from PUT to PATCH
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(patchData), // Only send modified fields
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const updatedLease = await response.json();
      onEdit(updatedLease);
      toast({
        title: "Success",
        description: "Lease updated successfully.",
        variant: "default",
      });
      onClose();
    } catch (error) {
      console.error("Error updating lease:", error);
      toast({
        title: "Error",
        description:
          typeof error === "string"
            ? error
            : "Failed to update lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!lease) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <div className="bg-green-50 p-4 border-b border-green-100">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-green-800">
                  Edit Lease
                </DialogTitle>
                <DialogDescription className="text-green-700 mt-1">
                  Unit: {lease.unit_details?.unit_number} | Tenant:{" "}
                  {lease.tenant_name}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  form="edit-lease-form"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form id="edit-lease-form" onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="col-span-8 space-y-6">
              {/* Property & Tenant Section - Hidden fields */}
              <input
                type="hidden"
                name="unit"
                id="unit"
                value={formData.unit}
              />
              <input
                type="hidden"
                name="tenant"
                id="tenant"
                value={formData.tenant}
              />

              {/* Lease Period Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5" /> Lease Period
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleChange}
                      className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date" className="text-sm font-medium">
                      End Date
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        id="end_date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                        required
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={setStandardLeaseTerm}
                        className="bg-green-100 hover:bg-green-200 text-green-800 whitespace-nowrap"
                      >
                        2Y
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Details Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5" /> Financial Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="monthly_rent"
                      className="text-sm font-medium"
                    >
                      Monthly Rent
                    </Label>
                    <Input
                      type="text"
                      id="monthly_rent"
                      name="monthly_rent"
                      value={formData.monthly_rent}
                      onChange={handleChange}
                      className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="security_deposit"
                      className="text-sm font-medium"
                    >
                      Security Deposit
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        id="security_deposit"
                        name="security_deposit"
                        value={formData.security_deposit}
                        onChange={handleChange}
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                        required
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={setSecurityDepositToRent}
                        className="bg-green-100 hover:bg-green-200 text-green-800 whitespace-nowrap"
                      >
                        = Rent
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section - Full Width */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                  <ClipboardList className="h-5 w-5" /> Notes
                </h3>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes about this lease"
                  className="border-green-200 focus:border-green-400 focus:ring-green-400 min-h-[120px] w-full"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-span-4 space-y-6">
              {/* Payment & Status Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                  <FileCheck className="h-5 w-5" /> Payment & Status
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="payment_period"
                      className="text-sm font-medium"
                    >
                      Payment Period
                    </Label>
                    <Select
                      value={formData.payment_period}
                      onValueChange={(value) =>
                        handleSelectChange("payment_period", value)
                      }
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400 w-full">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="BIMONTHLY">Bi-Monthly</SelectItem>
                        <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium mb-2 block">
                      Lease Status
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_signed"
                        checked={formData.is_signed}
                        onCheckedChange={handleCheckboxChange}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <label
                        htmlFor="is_signed"
                        className="text-sm font-medium leading-none"
                      >
                        Lease is signed
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100 shadow-sm">
                <h3 className="font-semibold text-green-800 mb-3">
                  Lease Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit ID:</span>
                    <span className="font-medium">{formData.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Number:</span>
                    <span className="font-medium">
                      {lease.unit_details?.unit_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant ID:</span>
                    <span className="font-medium">{formData.tenant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenant Name:</span>
                    <span className="font-medium">{lease.tenant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      $
                      {formData.monthly_rent
                        ? (
                            parseFloat(formData.monthly_rent) * 24
                          ).toLocaleString()
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Term:</span>
                    <span className="font-medium">
                      {formData.start_date && formData.end_date
                        ? Math.round(
                            (new Date(formData.end_date).getTime() -
                              new Date(formData.start_date).getTime()) /
                              (1000 * 60 * 60 * 24 * 30),
                          )
                        : 0}{" "}
                      months
                    </span>
                  </div>
                  {/* Debug: Show which fields are being modified */}
                  <div className="mt-3 pt-2 border-t border-green-200">
                    <span className="text-xs text-green-700">
                      Modified fields:
                    </span>
                    <div className="text-xs text-green-600 font-mono mt-1 break-all">
                      {Array.from(modifiedFields).join(", ") || "None"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
