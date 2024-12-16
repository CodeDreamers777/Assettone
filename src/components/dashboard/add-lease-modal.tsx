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
import { toast } from "@/hooks/use-toast";

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

export function AddLeaseModal({ isOpen, onClose, onAdd }: AddLeaseModalProps) {
  const [formData, setFormData] = useState({
    tenant: "",
    unit: "",
    start_date: "",
    end_date: "",
  });
  const [inactiveTenants, setInactiveTenants] = useState<Tenant[]>([]);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchInactiveTenants();
      fetchAvailableUnits();
    }
  }, [isOpen]);

  const fetchInactiveTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/tenants/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data = await response.json();
      const inactiveTenantsData = data.filter(
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
      const response = await fetch("http://127.0.0.1:8000/api/v1/units/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/leases/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Lease</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="tenant">Tenant</Label>
            <Select
              name="tenant"
              onValueChange={(value) => handleSelectChange("tenant", value)}
            >
              <SelectTrigger>
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
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Select
              name="unit"
              onValueChange={(value) => handleSelectChange("unit", value)}
            >
              <SelectTrigger>
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
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#38b000] hover:bg-[#2d8a00]"
          >
            Add Lease
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
