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
import { useToast } from "@/hooks/use-toast";

interface Property {
  id: string;
  name: string;
}

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tenant: any) => void;
}

const IDENTIFICATION_TYPES = [
  { value: "id", label: "National ID" },
  { value: "passport", label: "Passport" },
  { value: "workPermit", label: "Work Permit" },
  { value: "militaryId", label: "Military ID" },
  { value: "driversLicense", label: "Driver's License" },
];

export function AddTenantModal({
  isOpen,
  onClose,
  onAdd,
}: AddTenantModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    identification_type: "",
    identification_number: "",
    property_id: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProperties();
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const fetchProperties = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/properties/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch properties");
      const responseData = await response.json();
      const data = responseData.properties;
      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch properties. Please try again.",
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
    setIsLoading(true);

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/tenants/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const newTenant = await response.json();
      onAdd(newTenant);

      toast({
        title: "Success",
        description: "Tenant added successfully.",
        variant: "default",
      });

      setIsSubmitted(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error adding tenant:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add tenant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
        </DialogHeader>
        {!isSubmitted ? (
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
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="identification_type">Identification Type</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("identification_type", value)
                }
                value={formData.identification_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select identification type" />
                </SelectTrigger>
                <SelectContent>
                  {IDENTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="identification_number">
                Identification Number
              </Label>
              <Input
                type="text"
                id="identification_number"
                name="identification_number"
                value={formData.identification_number}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="property_id">Property</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange("property_id", value)
                }
                value={formData.property_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#38b000] hover:bg-[#2d8a00]"
              disabled={isLoading}
            >
              {isLoading ? "Adding Tenant..." : "Add Tenant"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="text-green-600 text-lg font-semibold">
              Tenant Added Successfully!
            </div>
            <div className="text-sm text-gray-500 text-center">
              The tenant has been added to the property. The modal will close
              shortly.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
