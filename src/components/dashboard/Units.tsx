import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Building2,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash,
  FileText,
  DollarSign,
  Bell,
  Droplets,
} from "lucide-react";
import { AddUnitModal } from "./add-unit-modal";
import { EditUnitModal } from "./edit-unit-modal";
import { PayRentModal } from "./pay-rent-modal";
import { LeaseDetailsModal } from "./lease-details-modal";
import { WaterBillModal } from "./water-bill-modal.tsx";

// Payment Status Enum and Labels
enum PaymentStatus {
  PAID_IN_FULL = "PAID_IN_FULL",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  NOT_PAID = "NOT_PAID",
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID_IN_FULL]: "Fully Paid",
  [PaymentStatus.PARTIALLY_PAID]: "Partially Paid",
  [PaymentStatus.NOT_PAID]: "Not Paid",
};

const PAYMENT_STATUS_STYLES: Record<
  PaymentStatus,
  { bg: string; text: string }
> = {
  [PaymentStatus.PAID_IN_FULL]: { bg: "bg-green-200", text: "text-green-900" },
  [PaymentStatus.PARTIALLY_PAID]: {
    bg: "bg-yellow-200",
    text: "text-yellow-900",
  },
  [PaymentStatus.NOT_PAID]: { bg: "bg-red-200", text: "text-red-900" },
};

// Unit Types Enum
export enum UnitType {
  STUDIO = "STUDIO",
  ONE_BEDROOM = "ONE_BEDROOM",
  TWO_BEDROOM = "TWO_BEDROOM",
  THREE_BEDROOM = "THREE_BEDROOM",
  PENTHOUSE = "PENTHOUSE",
  BEDSITTER = "BEDSITTER",
  DUPLEX = "DUPLEX",
  MAISONETTE = "MAISONETTE",
  CUSTOM = "CUSTOM",
}

// Mapping of Unit Types to Readable Labels
export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  [UnitType.STUDIO]: "Studio Apartments",
  [UnitType.ONE_BEDROOM]: "One-Bedroom Apartments",
  [UnitType.TWO_BEDROOM]: "Two-Bedroom Apartments",
  [UnitType.THREE_BEDROOM]: "Three-Bedroom Apartments",
  [UnitType.PENTHOUSE]: "Penthouses",
  [UnitType.BEDSITTER]: "Bedsitters",
  [UnitType.DUPLEX]: "Duplex Apartments",
  [UnitType.MAISONETTE]: "Maisonettes",
  [UnitType.CUSTOM]: "Custom",
};

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone_number: string;
}

interface Lease {
  id: string;
  tenant: Tenant;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  payment_period: string;
}

interface RentPaymentStatus {
  total_rent: number;
  water_bill: number;
  water_units_used: number;
  total_due: number;
  total_paid: number;
  remaining_balance: number;
  payment_status: string;
  payment_period: string;
  period_start: string;
  period_end: string;
}

export interface Unit {
  id: string;
  unit_number: string;
  property: string;
  unit_type: UnitType;
  custom_unit_type: string | null;
  rent: string;
  payment_period: "MONTHLY" | "QUARTERLY" | "YEARLY";
  floor: string;
  square_footage: string;
  is_occupied: boolean;
  water_units_used: string;
  water_price_per_unit: string;
  water_bill_last_updated: string | null;
  current_water_bill: number;
  created_at: string;
  updated_at: string;
  current_lease: Lease | null;
  rent_payment_status: RentPaymentStatus | null;
}

interface Property {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  owner: string;
  manager: string | null;
  total_units: number;
  description: string;
  created_at: string;
  updated_at: string;
}

export function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayRentModalOpen, setIsPayRentModalOpen] = useState(false);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [isWaterBillModalOpen, setIsWaterBillModalOpen] = useState(false);
  const [selectedUnitForWaterBill, setSelectedUnitForWaterBill] =
    useState<Unit | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty.id);
    } else {
      setUnits([]);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        "https://assettone-rental-management.onrender.com/api/v1/properties/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const propertiesData = response.data.properties;
      const processedProperties = Array.isArray(propertiesData)
        ? propertiesData
        : propertiesData
          ? [propertiesData]
          : [];

      setProperties(processedProperties);
      if (processedProperties.length > 0 && !selectedProperty) {
        setSelectedProperty(processedProperties[0]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to fetch properties. Please try again.",
        variant: "destructive",
      });
      setProperties([]);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  };

  const fetchUnits = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `https://assettone-rental-management.onrender.com/api/v1/properties/${propertyId}/units/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Error",
        description: "Failed to fetch units. Please try again.",
        variant: "destructive",
      });
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUnit = (newUnit: Unit) => {
    setUnits([...units, newUnit]);
  };

  const handleUpdateUnit = (updatedUnit: Unit) => {
    setUnits(
      units.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit)),
    );
  };

  const handleUpdateWaterBill = async (
    unitId: string,
    waterUnits: number,
    pricePerUnit: number,
  ) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.patch(
        `https://assettone-rental-management.onrender.com/api/v1/units/${unitId}/`,
        {
          water_units_used: waterUnits,
          water_price_per_unit: pricePerUnit,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Refresh units after update
      if (selectedProperty) {
        await fetchUnits(selectedProperty.id);
      }

      toast({
        title: "Success",
        description: "Water bill updated successfully.",
      });
    } catch (error) {
      console.error("Error updating water bill:", error);
      toast({
        title: "Error",
        description: "Failed to update water bill. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleWaterBill = (unit: Unit) => {
    setSelectedUnitForWaterBill(unit);
    setIsWaterBillModalOpen(true);
  };

  const handleSendReminder = async (unitId: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.post(
        `https://assettone-rental-management.onrender.com/api/v1/rental-notices/${unitId}/send_notice/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      console.log(response);
      toast({
        title: "Success",
        description: "Reminder sent successfully.",
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(
        `https://assettone-rental-management.onrender.com/api/v1/units/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setUnits(units.filter((unit) => unit.id !== id));
      toast({
        title: "Success",
        description: "Unit deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePayRent = (leaseId: string) => {
    setSelectedLeaseId(leaseId);
    setIsPayRentModalOpen(true);
  };

  const handleLease = (id: string) => {
    setSelectedUnitId(id);
    setIsLeaseModalOpen(true);
  };

  // Make sure your PayRentModal call includes the onPaymentComplete callback:
  const handlePaymentComplete = async () => {
    try {
      if (selectedProperty) {
        await fetchUnits(selectedProperty.id);
      }
    } catch (error) {
      console.error("Error refreshing units:", error);
    }
  };

  // FIXED: Simple modal close handlers - no setTimeout, no event manipulation
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUnit(null);
  };

  const closePayRentModal = () => {
    // Force cleanup just in case
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");

    setIsPayRentModalOpen(false);
    setSelectedLeaseId(null);
  };

  const closeLeaseModal = () => {
    // Force cleanup just in case
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");

    setIsLeaseModalOpen(false);
    setSelectedUnitId(null);
  };

  const closeWaterBillModal = () => {
    setIsWaterBillModalOpen(false);
    setSelectedUnitForWaterBill(null);
  };

  // FIXED: Remove the pr

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-50">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-2xl font-bold flex items-center text-green-900">
              <Building2 className="mr-2 h-6 w-6 text-green-600" /> Property
              Units
            </CardTitle>
            <Select
              value={selectedProperty?.id || ""}
              onValueChange={(value) => {
                const property = properties.find((p) => p.id === value);
                if (property) {
                  setSelectedProperty(property);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                {properties.length > 0 ? (
                  properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No properties available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Unit
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-green-100">
              <TableRow>
                <TableHead className="w-[100px]">Unit Number</TableHead>
                <TableHead>Unit Type</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Payment Period</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lease</TableHead>
                <TableHead>Rent Payment</TableHead>
                <TableHead>Water Bill</TableHead>

                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedProperty ? (
                units.length > 0 ? (
                  units.map((unit) => (
                    <TableRow key={unit.id} className="hover:bg-green-50">
                      <TableCell className="font-medium">
                        {unit.unit_number}
                      </TableCell>
                      <TableCell>
                        {unit.unit_type === UnitType.CUSTOM
                          ? unit.custom_unit_type
                          : UNIT_TYPE_LABELS[unit.unit_type]}
                      </TableCell>
                      <TableCell>KES {unit.rent}</TableCell>
                      <TableCell>{unit.payment_period}</TableCell>
                      <TableCell>{unit.floor}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            unit.is_occupied
                              ? "bg-green-200 text-green-900"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {unit.is_occupied ? "Occupied" : "Vacant"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {unit.current_lease ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-red-600">No Lease</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {unit.rent_payment_status ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              PAYMENT_STATUS_STYLES[
                                unit.rent_payment_status
                                  .payment_status as PaymentStatus
                              ].bg
                            } ${
                              PAYMENT_STATUS_STYLES[
                                unit.rent_payment_status
                                  .payment_status as PaymentStatus
                              ].text
                            }`}
                          >
                            {
                              PAYMENT_STATUS_LABELS[
                                unit.rent_payment_status
                                  .payment_status as PaymentStatus
                              ]
                            }
                          </span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        KES {unit.current_water_bill?.toFixed(2) || "0.00"}
                        <br />
                        <span className="text-xs text-gray-500">
                          Units: {unit.water_units_used} @ KES{" "}
                          {unit.water_price_per_unit}/unit
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(unit)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(unit.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleLease(unit.id)}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Lease
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handlePayRent(unit.current_lease?.id || "")
                              }
                              disabled={!unit.current_lease}
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Pay Rent
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleWaterBill(unit)}
                            >
                              <Droplets className="mr-2 h-4 w-4" />
                              Water Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendReminder(unit.id)}
                              disabled={
                                !unit.current_lease ||
                                unit.rent_payment_status?.payment_status ===
                                  "PAID"
                              }
                            >
                              <Bell className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      No units found for this property.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Please select a property to view its units.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddUnitModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCreateUnit={handleCreateUnit}
        selectedProperty={selectedProperty}
      />

      <EditUnitModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onUpdateUnit={handleUpdateUnit}
        editingUnit={editingUnit}
        setEditingUnit={setEditingUnit}
      />

      <PayRentModal
        isOpen={isPayRentModalOpen}
        onClose={closePayRentModal}
        leaseId={selectedLeaseId || ""}
        onPaymentComplete={handlePaymentComplete}
      />

      <LeaseDetailsModal
        isOpen={isLeaseModalOpen}
        onClose={closeLeaseModal}
        unitId={selectedUnitId}
        type="unit"
      />

      <WaterBillModal
        isOpen={isWaterBillModalOpen}
        onClose={closeWaterBillModal}
        unit={selectedUnitForWaterBill}
        onUpdate={handleUpdateWaterBill}
      />
    </div>
  );
}
