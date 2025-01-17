import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RepairCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cost: number) => void;
}

export const RepairCostModal: React.FC<RepairCostModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [repairCost, setRepairCost] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(repairCost);
    if (!isNaN(cost) && cost > 0) {
      onSubmit(cost);
      setRepairCost("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Repair Cost</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="repairCost" className="text-right">
                Repair Cost
              </Label>
              <Input
                id="repairCost"
                type="number"
                step="0.01"
                min="0"
                value={repairCost}
                onChange={(e) => setRepairCost(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
