import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { AddTenantModal } from "./add-tenant-modal";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Unit {
  id: string;
  unit_number: string;
  property_name: string;
}

interface AddLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lease: any) => void;
}

const PAYMENT_PERIODS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "BIMONTHLY", label: "Bi-Monthly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
];

const LEASE_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "PENDING", label: "Pending" },
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-1 text-sm mb-1.5">
    {children}
    <span className="text-red-500">*</span>
  </div>
);

export function AddLeaseModal({ isOpen, onClose, onAdd }: AddLeaseModalProps) {
  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    start_date: "",
    end_date: "",
    security_deposit: "",
    payment_period: "MONTHLY",
    status: "PENDING",
    notes: "",
  });
  const [inactiveTenants, setInactiveTenants] = useState<Tenant[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInactiveTenants();
      fetchAvailableUnits();
    }
  }, [isOpen]);

  const fetchInactiveTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/tenants/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data = await response.json();

      // Get the array of tenants from the "Nairobi apartments" key
      const tenantsArray = data["Nairobi apartments"];

      // Now filter the array for inactive tenants
      const inactiveTenantsData = tenantsArray.filter(
        (tenant: Tenant) => tenant.status === "INACTIVE",
      );

      setInactiveTenants(inactiveTenantsData);
    } catch (error) {
      console.error("Error fetching inactive tenants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch inactive tenants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableUnits = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/units/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch units");
      const data = await response.json();
      const availableUnitsData = data.filter((unit: Unit) => !unit.is_occupied);
      setAvailableUnits(availableUnitsData);
    } catch (error) {
      console.error("Error fetching available units:", error);
      toast({
        title: "Error",
        description: "Failed to fetch available units. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/leases/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to add lease");
      const newLease = await response.json();
      onAdd(newLease);
      toast({
        title: "Success",
        description: "Lease added successfully.",
        variant: "default",
      });
      onClose();
    } catch (error) {
      console.error("Error adding lease:", error);
      toast({
        title: "Error",
        description: "Failed to add lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTenantSuccess = () => {
    setIsAddTenantModalOpen(false);
    fetchInactiveTenants();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] p-4 gap-4">
          <DialogHeader className="px-2">
            <DialogTitle className="text-xl font-medium">
              Add New Lease
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3">
              <div>
                <RequiredLabel>Tenant</RequiredLabel>
                <div className="flex gap-2">
                  <Select
                    name="tenant"
                    onValueChange={(value) =>
                      handleSelectChange("tenant", value)
                    }
                  >
                    <SelectTrigger className="flex-1 border-slate-200">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {inactiveTenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddTenantModalOpen(true)}
                    className="shrink-0 border-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <RequiredLabel>Unit</RequiredLabel>
                <Select
                  name="unit"
                  onValueChange={(value) => handleSelectChange("unit", value)}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.property_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>Deposit</RequiredLabel>
                  <Input
                    type="number"
                    id="security_deposit"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <RequiredLabel>Period</RequiredLabel>
                  <Select
                    name="payment_period"
                    onValueChange={(value) =>
                      handleSelectChange("payment_period", value)
                    }
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <RequiredLabel>Status</RequiredLabel>
                <Select
                  name="status"
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEASE_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <RequiredLabel>Start Date</RequiredLabel>
                  <Input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="border-slate-200"
                  />
                </div>
                <div>
                  <RequiredLabel>End Date</RequiredLabel>
                  <Input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm mb-1.5">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes..."
                  className="h-20 resize-none border-slate-200"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#38b000] hover:bg-[#2d8a00] mt-2"
            >
              Add Lease
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onAdd={handleAddTenantSuccess}
      />
    </>
  );
}
