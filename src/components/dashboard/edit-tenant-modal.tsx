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

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tenant: any) => void;
  tenant: any;
}

export function EditTenantModal({
  isOpen,
  onClose,
  onEdit,
  tenant,
}: EditTenantModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email,
        phone_number: tenant.phone_number,
      });
    }
  }, [tenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/tenants/${tenant.id}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (!response.ok) throw new Error("Failed to update tenant");
      const updatedTenant = await response.json();
      onEdit(updatedTenant);
      toast({
        title: "Success",
        description: "Tenant updated successfully.",
        variant: "default",
      });
      onClose();
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to update tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#38b000] hover:bg-[#2d8a00]"
          >
            Update Tenant
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
