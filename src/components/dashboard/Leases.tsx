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
import { toast } from "@/hooks/use-toast";
import { AddLeaseModal } from "./add-lease-modal";
import { EditLeaseModal } from "./edit-lease-modal";
import { ViewLeaseDetailsModal } from "./view-lease-details-modal";

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

export function Leases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchLeases();
  }, []);

  const fetchLeases = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/leases/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch leases");
      const data = await response.json();
      setLeases(data);
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
    setLeases([...leases, newLease]);
    setIsAddModalOpen(false);
  };

  const handleEditLease = (updatedLease: Lease) => {
    setLeases(
      leases.map((lease) =>
        lease.id === updatedLease.id ? updatedLease : lease,
      ),
    );
    setIsEditModalOpen(false);
    setSelectedLease(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/leases/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to delete lease");
      setLeases(leases.filter((lease) => lease.id !== id));
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
        `http://127.0.0.1:8000/api/v1/leases/${id}/`,
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
      setLeases(
        leases.map((lease) => (lease.id === id ? updatedLease : lease)),
      );
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
    // Implement transfer functionality
    toast({
      title: "Not Implemented",
      description: "Transfer functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleTerminate = (id: string) => {
    // Implement terminate functionality
    toast({
      title: "Not Implemented",
      description: "Terminate functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleViewLease = (lease: Lease) => {
    setSelectedLease(lease);
    setIsViewModalOpen(true);
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
        <Table>
          <TableHeader className="bg-green-100">
            <TableRow>
              <TableHead>Tenant Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Security Deposit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leases.map((lease) => (
              <TableRow key={lease.id} className="hover:bg-green-50">
                <TableCell className="font-medium">
                  {lease.tenant_name}
                </TableCell>
                <TableCell>{lease.unit_details.unit_number}</TableCell>
                <TableCell>{lease.unit_details.property_name}</TableCell>
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
                      <DropdownMenuItem onClick={() => handleDelete(lease.id)}>
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
                      <DropdownMenuItem onClick={() => handleViewLease(lease)}>
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
    </DashboardShell>
  );
}
