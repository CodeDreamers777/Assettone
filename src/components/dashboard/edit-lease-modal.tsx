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
import { toast } from "@/hooks/use-toast";

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
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (lease) {
      setFormData({
        start_date: lease.start_date,
        end_date: lease.end_date,
      });
    }
  }, [lease]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/leases/${lease.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to update lease");
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
        description: "Failed to update lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Lease</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            Update Lease
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
