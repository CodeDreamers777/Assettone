"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets } from "lucide-react";

interface Unit {
  id: string;
  unit_number: string;
  water_units_used: string;
  water_price_per_unit: string;
  current_water_bill: number;
  water_bill_last_updated: string | null;
}

interface WaterBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  onUpdate: (
    unitId: string,
    waterUnits: number,
    pricePerUnit: number,
  ) => Promise<void>;
}

export function WaterBillModal({
  isOpen,
  onClose,
  unit,
  onUpdate,
}: WaterBillModalProps) {
  const [waterUnits, setWaterUnits] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (unit) {
      setWaterUnits(unit.water_units_used || "");
      setPricePerUnit(unit.water_price_per_unit || "");
    }
  }, [unit]);

  // Clean up when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWaterUnits("");
      setPricePerUnit("");
      setIsLoading(false);
      // Ensure body styles are reset
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unit) return;

    setIsLoading(true);
    try {
      await onUpdate(
        unit.id,
        Number.parseFloat(waterUnits),
        Number.parseFloat(pricePerUnit),
      );
      // Close immediately without setTimeout
      onClose();
    } catch (error) {
      console.error("Error updating water bill:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    const units = Number.parseFloat(waterUnits) || 0;
    const price = Number.parseFloat(pricePerUnit) || 0;
    return (units * price).toFixed(2);
  };

  // Simple close handler - no event manipulation or setTimeout
  const handleOpenChange = (open: boolean) => {
    if (!open && !isLoading) {
      onClose();
    }
  };

  if (!unit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-600" />
            Water Bill - Unit {unit.unit_number}
          </DialogTitle>
          <DialogDescription>
            Update the water bill information for this unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Current Bill
              </Label>
              <p className="text-lg font-semibold">
                KES {unit.current_water_bill?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">
                Last Updated
              </Label>
              <p className="text-sm text-gray-500">
                {unit.water_bill_last_updated
                  ? new Date(unit.water_bill_last_updated).toLocaleDateString()
                  : "Never"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="waterUnits">Water Units Used</Label>
              <Input
                id="waterUnits"
                type="number"
                step="0.01"
                value={waterUnits}
                onChange={(e) => setWaterUnits(e.target.value)}
                placeholder="Enter water units used"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (KES)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="Enter price per unit"
                required
                disabled={isLoading}
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium text-blue-800">
                New Total Bill
              </Label>
              <p className="text-xl font-bold text-blue-900">
                KES {calculateTotal()}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Water Bill"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
