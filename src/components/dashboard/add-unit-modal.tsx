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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Building2,
  Users,
  Calendar,
  DollarSign,
  FileText,
  MapPin,
  Home,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UnitType, UNIT_TYPE_LABELS } from "./Units";
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
  selectedProperty: { id: string; name?: string } | null;
}

const LEASE_STATUSES = [
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "EXPIRED", label: "Expired", color: "bg-red-100 text-red-800" },
  {
    value: "TERMINATED",
    label: "Terminated",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "PENDING",
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
  },
];

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
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

  const [leaseDetails, setLeaseDetails] = useState({
    start_date: "",
    end_date: "",
    security_deposit: "",
    status: "ACTIVE",
    notes: "",
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (newUnit.is_occupied && selectedProperty) {
      fetchTenants();
    }
  }, [newUnit.is_occupied, selectedProperty]);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://assettone-rental-management.onrender.com/api/v1/tenants/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      let tenantsArray = [];

      if (selectedProperty?.name && response.data[selectedProperty.name]) {
        tenantsArray = response.data[selectedProperty.name];
      } else {
        const allTenants = Object.values(response.data).flat() as Tenant[];
        tenantsArray = allTenants.filter(
          (tenant: any) => tenant.property === selectedProperty?.id,
        );
      }

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
    setIsLoading(true);

    if (!selectedProperty) {
      toast({
        title: "Error",
        description: "Please select a property before creating a unit.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newUnit.unit_type === UnitType.CUSTOM && !newUnit.custom_unit_type) {
      toast({
        title: "Validation Error",
        description: "Please provide a custom unit type name.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newUnit.is_occupied && !newUnit.tenant_id) {
      toast({
        title: "Validation Error",
        description: "Please select a tenant for this occupied unit.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newUnit.is_occupied) {
      if (
        !leaseDetails.start_date ||
        !leaseDetails.end_date ||
        !leaseDetails.security_deposit
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please fill in all required lease details for occupied units.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (
        new Date(leaseDetails.start_date) >= new Date(leaseDetails.end_date)
      ) {
        toast({
          title: "Validation Error",
          description: "End date must be after start date.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const accessToken = localStorage.getItem("accessToken");

      const requestData = {
        ...newUnit,
        property: selectedProperty.id,
        ...(newUnit.is_occupied
          ? {
              tenant_id: newUnit.tenant_id,
              lease_details: leaseDetails,
            }
          : {}),
      };

      const response = await axios.post(
        `https://assettone-rental-management.onrender.com/api/v1/units/`,
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
      setLeaseDetails({
        start_date: "",
        end_date: "",
        security_deposit: "",
        status: "ACTIVE",
        notes: "",
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaseDetailChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setLeaseDetails({ ...leaseDetails, [e.target.name]: e.target.value });
  };

  const handleLeaseSelectChange = (name: string, value: string) => {
    setLeaseDetails({ ...leaseDetails, [name]: value });
  };

  const selectedStatus = LEASE_STATUSES.find(
    (s) => s.value === leaseDetails.status,
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white to-green-50/30">
          <DialogHeader className="space-y-3 pb-6 border-b border-green-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Create New Unit
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Add a new property unit to your inventory with detailed
                  information
                </DialogDescription>
              </div>
            </div>
            {selectedProperty && (
              <Badge
                variant="outline"
                className="w-fit bg-green-50 text-green-700 border-green-200"
              >
                <MapPin className="h-3 w-3 mr-1" />
                {selectedProperty.name || `Property ${selectedProperty.id}`}
              </Badge>
            )}
          </DialogHeader>

          <form onSubmit={handleCreateUnit} className="space-y-8">
            {/* Unit Details Section */}
            <Card className="border-green-100 shadow-sm">
              <CardContent className="p-6">
                <SectionHeader icon={Home} title="Unit Details" />

                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel>Unit Number</RequiredLabel>
                      <Input
                        placeholder="e.g. A101, Suite 205"
                        required
                        value={newUnit.unit_number || ""}
                        onChange={(e) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            unit_number: e.target.value,
                          }))
                        }
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel>Floor</RequiredLabel>
                      <Input
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
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel>Unit Type</RequiredLabel>
                      <Select
                        value={newUnit.unit_type}
                        onValueChange={(value: UnitType) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            unit_type: value,
                            custom_unit_type:
                              value === UnitType.CUSTOM ? "" : null,
                          }))
                        }
                      >
                        <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400">
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

                    <div className="space-y-2">
                      <RequiredLabel>Occupancy Status</RequiredLabel>
                      <Select
                        value={newUnit.is_occupied ? "true" : "false"}
                        onValueChange={(value) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            is_occupied: value === "true",
                          }))
                        }
                      >
                        <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-gray-500" />
                              Vacant
                            </div>
                          </SelectItem>
                          <SelectItem value="true">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Occupied
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newUnit.unit_type === UnitType.CUSTOM && (
                    <div className="space-y-2">
                      <RequiredLabel>Custom Type Name</RequiredLabel>
                      <Input
                        placeholder="Enter custom unit type"
                        required
                        value={newUnit.custom_unit_type || ""}
                        onChange={(e) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            custom_unit_type: e.target.value,
                          }))
                        }
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <RequiredLabel>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Rent Amount
                      </RequiredLabel>
                      <Input
                        type="number"
                        placeholder="0.00"
                        required
                        value={newUnit.rent || ""}
                        onChange={(e) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            rent: e.target.value,
                          }))
                        }
                        className="border-green-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <RequiredLabel>Payment Period</RequiredLabel>
                      <Select
                        value={newUnit.payment_period}
                        onValueChange={(
                          value: "MONTHLY" | "QUARTERLY" | "YEARLY",
                        ) =>
                          setNewUnit((prev: any) => ({
                            ...prev,
                            payment_period: value,
                          }))
                        }
                      >
                        <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lease Details Section */}
            {newUnit.is_occupied && (
              <Card className="border-green-100 shadow-sm bg-green-50/30">
                <CardContent className="p-6">
                  <SectionHeader icon={Users} title="Lease Details" />

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <RequiredLabel>
                        <Users className="h-4 w-4 mr-1" />
                        Tenant
                      </RequiredLabel>
                      <div className="flex gap-3">
                        <Select
                          value={newUnit.tenant_id || ""}
                          onValueChange={(value) =>
                            setNewUnit((prev: any) => ({
                              ...prev,
                              tenant_id: value,
                            }))
                          }
                        >
                          <SelectTrigger className="flex-1 border-green-200 focus:border-green-400 focus:ring-green-400 bg-white">
                            <SelectValue placeholder="Select a tenant" />
                          </SelectTrigger>
                          <SelectContent>
                            {tenants.length > 0 ? (
                              tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {`${tenant.first_name} ${tenant.last_name}`}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      {tenant.email}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No inactive tenants available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsAddTenantModalOpen(true)}
                          className="border-green-200 hover:bg-green-50 hover:border-green-300"
                        >
                          <PlusCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <RequiredLabel>
                          <DollarSign className="h-4 w-4 mr-1" />
                          Security Deposit
                        </RequiredLabel>
                        <Input
                          type="number"
                          name="security_deposit"
                          value={leaseDetails.security_deposit}
                          onChange={handleLeaseDetailChange}
                          required
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel>Status</RequiredLabel>
                        <Select
                          name="status"
                          value={leaseDetails.status}
                          onValueChange={(value) =>
                            handleLeaseSelectChange("status", value)
                          }
                        >
                          <SelectTrigger className="border-green-200 focus:border-green-400 focus:ring-green-400 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEASE_STATUSES.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                              >
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <RequiredLabel>
                          <Calendar className="h-4 w-4 mr-1" />
                          Start Date
                        </RequiredLabel>
                        <Input
                          type="date"
                          name="start_date"
                          value={leaseDetails.start_date}
                          onChange={handleLeaseDetailChange}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel>
                          <Calendar className="h-4 w-4 mr-1" />
                          End Date
                        </RequiredLabel>
                        <Input
                          type="date"
                          name="end_date"
                          value={leaseDetails.end_date}
                          onChange={handleLeaseDetailChange}
                          required
                          className="border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Notes
                      </Label>
                      <Textarea
                        name="notes"
                        value={leaseDetails.notes}
                        onChange={handleLeaseDetailChange}
                        placeholder="Add any additional notes about the lease..."
                        className="h-24 resize-none border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Create Unit
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => {
          setIsAddTenantModalOpen(false);
          fetchTenants();
        }}
        onAdd={(newTenant) => {
          setTenants((prevTenants) => [...prevTenants, newTenant]);
        }}
      />
    </>
  );
}
