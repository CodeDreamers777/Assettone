import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Pencil,
  Trash,
  FileText,
  Ban,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
}

interface PropertyTenants {
  [key: string]: Tenant[];
}

export function Tenants() {
  const [propertyTenants, setPropertyTenants] = useState<PropertyTenants>({});
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/tenants/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch tenants");
      const data: PropertyTenants = await response.json();
      setPropertyTenants(data);
      if (Object.keys(data).length > 0) {
        setSelectedProperty(Object.keys(data)[0]);
      }
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
    setPropertyTenants((prev) => ({
      ...prev,
      [selectedProperty]: [...(prev[selectedProperty] || []), newTenant],
    }));
    setIsAddModalOpen(false);
  };

  const handleEditTenant = (updatedTenant: Tenant) => {
    setPropertyTenants((prev) => ({
      ...prev,
      [selectedProperty]: prev[selectedProperty]?.map((t) =>
        t.id === updatedTenant.id ? updatedTenant : t,
      ),
    }));
    setIsEditModalOpen(false);
    setSelectedTenant(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/tenants/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to delete tenant");

      // If successful (204 No Content), update the local state
      setPropertyTenants((prev) => ({
        ...prev,
        [selectedProperty]: prev[selectedProperty]?.filter(
          (tenant) => tenant.id !== id,
        ),
      }));

      toast({
        title: "Success",
        description: "Tenant successfully deleted",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: "Failed to delete tenant. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLease = () => {
    // Implement lease functionality
    toast({
      title: "Not Implemented",
      description: "Lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleTerminateLease = () => {
    // Implement terminate lease functionality
    toast({
      title: "Not Implemented",
      description: "Terminate lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleDeactivateLease = () => {
    // Implement deactivate lease functionality
    toast({
      title: "Not Implemented",
      description: "Deactivate lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handleTransferLease = () => {
    // Implement transfer lease functionality
    toast({
      title: "Not Implemented",
      description: "Transfer lease functionality is not yet implemented.",
      variant: "default",
    });
  };

  const handlePropertyChange = (value: string) => {
    setSelectedProperty(value);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Property Tenants"
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
        <div className="bg-green-100 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-green-800">
            Property Tenants
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
                {Object.keys(propertyTenants).map((property) => (
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
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedProperty &&
              propertyTenants[selectedProperty].map((tenant) => (
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
                        <DropdownMenuItem
                          onClick={() => handleDelete(tenant.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleLease(tenant.id)}
                        >
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
