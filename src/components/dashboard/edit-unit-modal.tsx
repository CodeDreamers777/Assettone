import React from "react";
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
import { UnitType, UNIT_TYPE_LABELS } from "./Units"; // Assuming these are exported from units.tsx

interface EditUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUnit: (updatedUnit: any) => void;
  editingUnit: any;
  setEditingUnit: React.Dispatch<React.SetStateAction<any>>;
}

export function EditUnitModal({
  isOpen,
  onClose,
  onUpdateUnit,
  editingUnit,
  setEditingUnit,
}: EditUnitModalProps) {
  const handleUpdateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUnit) return;

    if (
      editingUnit.unit_type === UnitType.CUSTOM &&
      !editingUnit.custom_unit_type
    ) {
      toast({
        title: "Validation Error",
        description: "Please provide a custom unit type name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.put(
        `http://127.0.0.1:8000/api/v1/units/${editingUnit.id}`,
        editingUnit,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const updatedUnit = response.data;
      onUpdateUnit(updatedUnit);
      onClose();
      toast({
        title: "Success",
        description: "Unit updated successfully.",
      });
    } catch (error) {
      console.error("Error updating unit:", error);
      toast({
        title: "Error",
        description: "Failed to update unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Unit</DialogTitle>
          <DialogDescription>
            Make changes to the unit here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateUnit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_unit_number" className="text-right">
                Unit Number
              </Label>
              <Input
                id="edit_unit_number"
                value={editingUnit?.unit_number}
                onChange={(e) =>
                  setEditingUnit({
                    ...editingUnit!,
                    unit_number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_unit_type" className="text-right">
                Unit Type
              </Label>
              <Select
                value={editingUnit?.unit_type}
                onValueChange={(value: UnitType) =>
                  setEditingUnit({
                    ...editingUnit!,
                    unit_type: value,
                    custom_unit_type: value === UnitType.CUSTOM ? "" : null,
                  })
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
            {editingUnit?.unit_type === UnitType.CUSTOM && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_custom_unit_type" className="text-right">
                  Custom Type Name
                </Label>
                <Input
                  id="edit_custom_unit_type"
                  placeholder="Enter custom unit type"
                  required
                  value={editingUnit?.custom_unit_type || ""}
                  onChange={(e) =>
                    setEditingUnit({
                      ...editingUnit!,
                      custom_unit_type: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_rent" className="text-right">
                Rent
              </Label>
              <Input
                id="edit_rent"
                type="number"
                value={editingUnit?.rent}
                onChange={(e) =>
                  setEditingUnit({ ...editingUnit!, rent: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_payment_period" className="text-right">
                Payment Period
              </Label>
              <Select
                value={editingUnit?.payment_period}
                onValueChange={(value: "MONTHLY" | "QUARTERLY" | "YEARLY") =>
                  setEditingUnit({ ...editingUnit!, payment_period: value })
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
              <Label htmlFor="edit_floor" className="text-right">
                Floor
              </Label>
              <Input
                id="edit_floor"
                type="number"
                value={editingUnit?.floor}
                onChange={(e) =>
                  setEditingUnit({ ...editingUnit!, floor: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_is_occupied" className="text-right">
                Occupancy Status
              </Label>
              <Select
                value={editingUnit?.is_occupied ? "true" : "false"}
                onValueChange={(value) =>
                  setEditingUnit({
                    ...editingUnit!,
                    is_occupied: value === "true",
                  })
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
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
