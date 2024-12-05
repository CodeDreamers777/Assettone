import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { format } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash,
  FileText,
  PlusCircle,
  Building2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
const UNIT_TYPE_LABELS: Record<UnitType, string> = {
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

interface Unit {
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
  created_at: string;
  updated_at: string;
}

export function Units() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<Unit>>({
    unit_type: UnitType.STUDIO,
    payment_period: "MONTHLY",
    is_occupied: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get("http://127.0.0.1:8000/api/v1/units/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast({
        title: "Error",
        description: "Failed to fetch units. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate custom unit type if CUSTOM is selected
    if (newUnit.unit_type === UnitType.CUSTOM && !newUnit.custom_unit_type) {
      toast({
        title: "Validation Error",
        description: "Please provide a custom unit type name.",
        variant: "destructive",
      });
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/units/",
        newUnit,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      setUnits([...units, response.data]);
      setIsCreateModalOpen(false);
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

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.delete(`http://127.0.0.1:8000/api/v1/units/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
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

  const handleLease = (id: string) => {
    navigate(`/dashboard/leases/create?unitId=${id}`);
  };

  const handleUpdateUnit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUnit) return;

    // Validate custom unit type if CUSTOM is selected
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
      setUnits(
        units.map((unit) => (unit.id === updatedUnit.id ? updatedUnit : unit)),
      );
      setIsEditModalOpen(false);
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center">
            <Building2 className="mr-2 h-6 w-6" /> Property Units
          </CardTitle>
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
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[100px]">Unit Number</TableHead>
                <TableHead>Unit Type</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Payment Period</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {unit.unit_number}
                  </TableCell>
                  <TableCell>
                    {unit.unit_type === UnitType.CUSTOM
                      ? unit.custom_unit_type
                      : UNIT_TYPE_LABELS[unit.unit_type]}
                  </TableCell>
                  <TableCell>${unit.rent}</TableCell>
                  <TableCell>{unit.payment_period}</TableCell>
                  <TableCell>{unit.floor}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        unit.is_occupied
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {unit.is_occupied ? "Occupied" : "Vacant"}
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
                        <DropdownMenuItem onClick={() => handleDelete(unit.id)}>
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleLease(unit.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Lease
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Unit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
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
                    setNewUnit((prev) => ({
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
                    setNewUnit((prev) => ({
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
                      setNewUnit((prev) => ({
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
                    setNewUnit((prev) => ({ ...prev, rent: e.target.value }))
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
                    setNewUnit((prev) => ({ ...prev, payment_period: value }))
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
                    setNewUnit((prev) => ({ ...prev, floor: e.target.value }))
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
                    setNewUnit((prev) => ({
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
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">
                Create Unit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
    </div>
  );
}
