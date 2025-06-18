import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  CheckCircle2,
  Clock,
  Building2,
  Users,
} from "lucide-react";

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
  { value: "id", label: "National ID", icon: CreditCard },
  { value: "passport", label: "Passport", icon: CreditCard },
  { value: "workPermit", label: "Work Permit", icon: CreditCard },
  { value: "militaryId", label: "Military ID", icon: CreditCard },
  { value: "driversLicense", label: "Driver's License", icon: CreditCard },
];

const RequiredLabel = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: any;
}) => (
  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
    {Icon && <Icon className="h-4 w-4" />}
    {children}
    <span className="text-red-500">*</span>
  </Label>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-100">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 text-green-600">
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  </div>
);

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
      // Reset form when modal opens
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        identification_type: "",
        identification_number: "",
        property_id: "",
      });
    }
  }, [isOpen]);

  const fetchProperties = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettone-rental-management.onrender.com/api/v1/properties/",
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
        "https://assettone-rental-management.onrender.com/api/v1/tenants/",
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
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
      }, 2500);
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

  const selectedProperty = properties.find(
    (p) => p.id === formData.property_id,
  );
  const selectedIdType = IDENTIFICATION_TYPES.find(
    (t) => t.value === formData.identification_type,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-green-50/30">
        <DialogHeader className="space-y-3 pb-6 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Add New Tenant
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Create a new tenant profile for your property management
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={User} title="Personal Information" />

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel icon={User}>First Name</RequiredLabel>
                      <Input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter first name"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel icon={User}>Last Name</RequiredLabel>
                      <Input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Enter last name"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel icon={Mail}>Email Address</RequiredLabel>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tenant@example.com"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel icon={Phone}>Phone Number</RequiredLabel>
                      <Input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        required
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Identification Section */}
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={CreditCard} title="Identification" />

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <RequiredLabel icon={CreditCard}>
                      Identification Type
                    </RequiredLabel>
                    <Select
                      onValueChange={(value) =>
                        handleSelectChange("identification_type", value)
                      }
                      value={formData.identification_type}
                    >
                      <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400">
                        <SelectValue placeholder="Select identification type" />
                      </SelectTrigger>
                      <SelectContent>
                        {IDENTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4 text-gray-500" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <RequiredLabel>
                      {selectedIdType?.label || "Identification"} Number
                    </RequiredLabel>
                    <Input
                      type="text"
                      name="identification_number"
                      value={formData.identification_number}
                      onChange={handleChange}
                      placeholder="Enter identification number"
                      required
                      className="border-green-200 focus:border-green-400 focus:ring-green-400"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Assignment Section */}
            <Card className="border-green-100 shadow-sm bg-green-50/30">
              <CardContent className="p-6">
                <SectionHeader icon={Building2} title="Property Assignment" />

                <div className="space-y-2">
                  <RequiredLabel icon={MapPin}>Property</RequiredLabel>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange("property_id", value)
                    }
                    value={formData.property_id}
                  >
                    <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400 bg-white">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            {property.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProperty && (
                    <Badge
                      variant="outline"
                      className="w-fit mt-2 bg-green-50 text-green-700 border-green-200"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedProperty.name}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator className="bg-green-100" />

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-300 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding Tenant...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Tenant
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 p-8">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-green-700">
                Tenant Added Successfully!
              </h3>
              <p className="text-gray-600">
                The tenant has been added to your property management system.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              This modal will close automatically
            </div>

            <div className="w-full bg-green-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-2500 ease-out"
                style={{ width: "100%", animation: "progress 2.5s ease-out" }}
              />
            </div>

            <style jsx>{`
              @keyframes progress {
                from {
                  width: 0%;
                }
                to {
                  width: 100%;
                }
              }
            `}</style>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
