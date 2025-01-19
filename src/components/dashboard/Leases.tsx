import React, { useEffect, useState } from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Pencil,
  Trash,
  Check,
  X,
  ArrowRightLeft,
  Ban,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { AddLeaseModal } from "./add-lease-modal";
import { EditLeaseModal } from "./edit-lease-modal";
import { ViewLeaseDetailsModal } from "./view-lease-details-modal";
import { TransferLeaseModal, TransferLeaseData } from "./transfer-lease-modal";

interface UnitDetails {
  id: string;
  unit_number: string;
  property_name: string;
}

interface Lease {
  id: string;
  tenant_name: string;
  unit_details: UnitDetails;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  security_deposit: string;
  status: string;
  created_at: string;
  updated_at: string;
  unit: string;
  tenant: string;
}

interface PropertyLeases {
  [key: string]: Lease[];
}

export function Leases() {
  const [propertyLeases, setPropertyLeases] = useState<PropertyLeases>({});
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/leases/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch leases");
      const data: PropertyLeases = await response.json();
      setPropertyLeases(data);
      if (Object.keys(data).length > 0) {
        setSelectedProperty(Object.keys(data)[0]);
      }
    } catch (error) {
      console.error("Error fetching leases:", error);
      toast({
        title: "Error",
        description: "Failed to fetch leases. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddLease = (newLease: Lease) => {
    setPropertyLeases((prev) => ({
      ...prev,
      [selectedProperty]: [...(prev[selectedProperty] || []), newLease],
    }));
    setIsAddModalOpen(false);
  };

  const handleEditLease = (updatedLease: Lease) => {
    setPropertyLeases((prev) => ({
      ...prev,
      [selectedProperty]: prev[selectedProperty].map((lease) =>
        lease.id === updatedLease.id ? updatedLease : lease,
      ),
    }));
    setIsEditModalOpen(false);
    setSelectedLease(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to delete lease");
      setPropertyLeases((prev) => ({
        ...prev,
        [selectedProperty]: prev[selectedProperty].filter(
          (lease) => lease.id !== id,
        ),
      }));
      toast({
        title: "Success",
        description: "Lease deleted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting lease:", error);
      toast({
        title: "Error",
        description: "Failed to delete lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (id: string) => {
    await updateLeaseStatus(id, "ACTIVE");
  };

  const handleDeactivate = async (id: string) => {
    await updateLeaseStatus(id, "INACTIVE");
  };

  const updateLeaseStatus = async (id: string, status: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok)
        throw new Error(`Failed to ${status.toLowerCase()} lease`);
      const updatedLease = await response.json();
      setPropertyLeases((prev) => ({
        ...prev,
        [selectedProperty]: prev[selectedProperty].map((lease) =>
          lease.id === id ? updatedLease : lease,
        ),
      }));
      toast({
        title: "Success",
        description: `Lease ${status.toLowerCase()}d successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing lease:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status.toLowerCase()} lease. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const handleTransfer = (id: string) => {
    setSelectedLease(
      propertyLeases[selectedProperty].find((lease) => lease.id === id) || null,
    );
    setIsTransferModalOpen(true);
  };

  const handleLeaseTransfer = async (transferData: TransferLeaseData) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${selectedLease?.id}/transfer_lease/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(transferData),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transfer lease");
      }
      await fetchLeases();
      setIsTransferModalOpen(false);
      toast({
        title: "Success",
        description: "Lease transferred successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error transferring lease:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to transfer lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTerminate = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${id}/terminate_lease/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to terminate lease");

      // Update the lease status in the local state
      setPropertyLeases((prev) => ({
        ...prev,
        [selectedProperty]: prev[selectedProperty].map((lease) =>
          lease.id === id ? { ...lease, status: "TERMINATED" } : lease,
        ),
      }));

      toast({
        title: "Success",
        description: "Lease terminated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error terminating lease:", error);
      toast({
        title: "Error",
        description: "Failed to terminate lease. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewLease = (lease: Lease) => {
    setSelectedLease(lease);
    setIsViewModalOpen(true);
  };

  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
  };

  return (
    <DashboardShell>
      <DashboardHeader heading="Leases" text="Manage your property leases.">
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#38b000] hover:bg-[#2d8a00]"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Lease
        </Button>
      </DashboardHeader>
      <div className="rounded-md border">
        <div className="bg-green-100 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-green-800">
            Property Leases
          </h2>
          <div className="flex items-center space-x-4">
            <label
              htmlFor="property-select"
              className="text-sm font-medium text-green-700"
            >
              Select Property:
            </label>
            <Select
              onValueChange={handlePropertyChange}
              value={selectedProperty}
            >
              <SelectTrigger
                id="property-select"
                className="w-[200px] bg-white"
              >
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(propertyLeases).map((property) => (
                  <SelectItem key={property} value={property}>
                    {property}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Security Deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedProperty &&
              propertyLeases[selectedProperty]?.map((lease) => (
                <TableRow key={lease.id} className="hover:bg-green-50">
                  <TableCell className="font-medium">
                    {lease.tenant_name}
                  </TableCell>
                  <TableCell>{lease.unit_details.unit_number}</TableCell>
                  <TableCell>
                    {new Date(lease.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(lease.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{lease.monthly_rent}</TableCell>
                  <TableCell>{lease.security_deposit}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        lease.status === "ACTIVE"
                          ? "bg-green-200 text-green-900"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {lease.status}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLease(lease);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(lease.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        {lease.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(lease.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleActivate(lease.id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleTransfer(lease.id)}
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Transfer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleTerminate(lease.id)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Terminate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewLease(lease)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <AddLeaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddLease}
      />
      <EditLeaseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLease(null);
        }}
        onEdit={handleEditLease}
        lease={selectedLease}
      />
      <ViewLeaseDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        lease={selectedLease}
      />
      <TransferLeaseModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleLeaseTransfer}
        leaseId={selectedLease?.id || ""}
      />
    </DashboardShell>
  );
}
