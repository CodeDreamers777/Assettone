import React, { useEffect, useState } from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Pencil,
  Trash,
  FileText,
  Ban,
  ArrowRightLeft,
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
import { AddTenantModal } from "./add-tenant-modal";
import { EditTenantModal } from "./edit-tenant-modal";
import { toast } from "@/hooks/use-toast";
interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}

export function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch("http://127.0.0.1:8000/api/v1/tenants/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data = await response.json();
      setTenants(data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tenants. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTenant = (newTenant: Tenant) => {
    setTenants([...tenants, newTenant]);
    setIsAddModalOpen(false);
  };

  const handleEditTenant = (updatedTenant: Tenant) => {
    setTenants(
      tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t)),
    );
    setIsEditModalOpen(false);
    setSelectedTenant(null);
  };

  const handleDelete = async (id: string) => {
    // Implement delete functionality
    toast({
      title: "Not Implemented",
      description: "Delete functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleLease = (id: string) => {
    // Implement lease functionality
    toast({
      title: "Not Implemented",
      description: "Lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleTerminateLease = (id: string) => {
    // Implement terminate lease functionality
    toast({
      title: "Not Implemented",
      description: "Terminate lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleDeactivateLease = (id: string) => {
    // Implement deactivate lease functionality
    toast({
      title: "Not Implemented",
      description: "Deactivate lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleTransferLease = (id: string) => {
    // Implement transfer lease functionality
    toast({
      title: "Not Implemented",
      description: "Transfer lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tenants"
        text="Manage your tenants and their information."
      >
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#38b000] hover:bg-[#2d8a00]"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Tenant
        </Button>
      </DashboardHeader>
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-green-100">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id} className="hover:bg-green-50">
                <TableCell className="font-medium">
                  {tenant.first_name} {tenant.last_name}
                </TableCell>
                <TableCell>{tenant.email}</TableCell>
                <TableCell>{tenant.phone_number}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      tenant.status === "ACTIVE"
                        ? "bg-green-200 text-green-900"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tenant.status}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(tenant.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          ></path>
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(tenant.id)}>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleLease(tenant.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Lease
                      </DropdownMenuItem>
                      {tenant.status === "ACTIVE" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleTerminateLease(tenant.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Terminate Lease
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeactivateLease(tenant.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Deactivate Lease
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTransferLease(tenant.id)}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transfer Lease
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AddTenantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTenant}
      />
      <EditTenantModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTenant(null);
        }}
        onEdit={handleEditTenant}
        tenant={selectedTenant}
      />
    </DashboardShell>
  );
}
