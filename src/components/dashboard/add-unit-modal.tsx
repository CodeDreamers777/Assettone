import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { UnitType, UNIT_TYPE_LABELS } from "./Units"; // Assuming these are exported from units.tsx
import { AddTenantModal } from "./add-tenant-modal";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
}

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateUnit: (newUnit: any) => void;
  selectedProperty: { id: string } | null;
}

export function AddUnitModal({
  isOpen,
  onClose,
  onCreateUnit,
  selectedProperty,
}: AddUnitModalProps) {
  const [newUnit, setNewUnit] = useState<any>({
    unit_type: UnitType.STUDIO,
    payment_period: "MONTHLY",
    is_occupied: false,
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);

  useEffect(() => {
    if (newUnit.is_occupied) {
      fetchTenants();
    }
  }, [newUnit.is_occupied]);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://assettoneestates.pythonanywhere.com/api/v1/tenants/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Extract the array of tenants from the "Nairobi apartments" key
      const tenantsArray = response.data["Nairobi apartments"];

      // Set tenants (if further filtering for inactive tenants is needed)
      setTenants(
        tenantsArray.filter((tenant: Tenant) => tenant.status === "INACTIVE"),
      );
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tenants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProperty) {
      toast({
        title: "Error",
        description: "Please select a property before creating a unit.",
        variant: "destructive",
      });
      return;
    }

    if (newUnit.unit_type === UnitType.CUSTOM && !newUnit.custom_unit_type) {
      toast({
        title: "Validation Error",
        description: "Please provide a custom unit type name.",
        variant: "destructive",
      });
      return;
    }

    // Check if occupied status is true, but no tenant is selected
    if (newUnit.is_occupied && !newUnit.tenant_id) {
      toast({
        title: "Validation Error",
        description: "Please select a tenant for this occupied unit.",
        variant: "destructive",
      });
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");

      // Prepare the request data
      const requestData = {
        ...newUnit,
        property: selectedProperty.id,
        // Only include tenant_id if the unit is occupied
        ...(newUnit.is_occupied ? { tenant_id: newUnit.tenant_id } : {}),
      };

      const response = await axios.post(
        `https://assettoneestates.pythonanywhere.com/api/v1/units/`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      onCreateUnit(response.data);
      onClose();
      setNewUnit({
        unit_type: UnitType.STUDIO,
        payment_period: "MONTHLY",
        is_occupied: false,
      });

      toast({
        title: "Success",
        description: "Unit created successfully.",
      });
    } catch (error) {
      console.error("Error creating unit:", error);
      toast({
        title: "Error",
        description: "Failed to create unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Unit</DialogTitle>
            <DialogDescription>
              Add a new property unit to your inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUnit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_number" className="text-right">
                  Unit Number
                </Label>
                <Input
                  id="unit_number"
                  placeholder="e.g. A101"
                  required
                  value={newUnit.unit_number || ""}
                  onChange={(e) =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      unit_number: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_type" className="text-right">
                  Unit Type
                </Label>
                <Select
                  value={newUnit.unit_type}
                  onValueChange={(value: UnitType) =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      unit_type: value,
                      custom_unit_type: value === UnitType.CUSTOM ? "" : null,
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UnitType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {UNIT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newUnit.unit_type === UnitType.CUSTOM && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="custom_unit_type" className="text-right">
                    Custom Type Name
                  </Label>
                  <Input
                    id="custom_unit_type"
                    placeholder="Enter custom unit type"
                    required
                    value={newUnit.custom_unit_type || ""}
                    onChange={(e) =>
                      setNewUnit((prev: any) => ({
                        ...prev,
                        custom_unit_type: e.target.value,
                      }))
                    }
                    className="col-span-3"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rent" className="text-right">
                  Rent
                </Label>
                <Input
                  id="rent"
                  type="number"
                  placeholder="Monthly rent amount"
                  required
                  value={newUnit.rent || ""}
                  onChange={(e) =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      rent: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment_period" className="text-right">
                  Payment Period
                </Label>
                <Select
                  value={newUnit.payment_period}
                  onValueChange={(value: "MONTHLY" | "QUARTERLY" | "YEARLY") =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      payment_period: value,
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payment period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floor" className="text-right">
                  Floor
                </Label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="Floor number"
                  required
                  value={newUnit.floor || ""}
                  onChange={(e) =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      floor: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_occupied" className="text-right">
                  Occupancy Status
                </Label>
                <Select
                  value={newUnit.is_occupied ? "true" : "false"}
                  onValueChange={(value) =>
                    setNewUnit((prev: any) => ({
                      ...prev,
                      is_occupied: value === "true",
                    }))
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select occupancy status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Vacant</SelectItem>
                    <SelectItem value="true">Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUnit.is_occupied && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tenant" className="text-right">
                    Tenant
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Select
                      value={newUnit.tenant_id || ""}
                      onValueChange={(value) =>
                        setNewUnit((prev: any) => ({
                          ...prev,
                          tenant_id: value,
                        }))
                      }
                    >
                      <SelectTrigger className="flex-grow">
                        <SelectValue placeholder="Select a tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {`${tenant.first_name} ${tenant.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddTenantModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                Create Unit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => {
          setIsAddTenantModalOpen(false);
          fetchTenants(); // Refresh the tenants list after adding a new tenant
        }}
        onAdd={(newTenant) => {
          setTenants((prevTenants) => [...prevTenants, newTenant]);
        }}
      />
    </>
  );
}
