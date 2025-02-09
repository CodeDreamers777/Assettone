import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RepairCostModal } from "@/components/RepairCostModal";
import { MaintenanceRequestDetailsModal } from "@/components/MaintenanceRequestDetailsModal";
import { Eye, Filter, Check, X, PlusCircle } from "lucide-react";
import { AddMaintenanceRequestModal } from "./AddMaintenanceRequestModal";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority; // Update this
  status: Status;
  requested_date: string;
  approved_rejected_date: string | null;
  completed_date: string | null;
  repair_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  unit: string;
  tenant: string;
  property: string;
  approved_rejected_by: string | null;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unit_number: string;
}

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

interface Lease {
  id: string;
  tenant: {
    id: string;
    name: string;
    email: string;
    phone_number: string;
  };
  start_date: string;
  end_date: string;
  monthly_rent: number;
  payment_period: string;
}

interface UnitWithLease extends Unit {
  current_lease?: {
    id: string;
    tenant: {
      id: string;
      name: string;
      email: string;
      phone_number: string;
    };
    start_date: string;
    end_date: string;
    monthly_rent: number;
    payment_period: string;
  };
}

type Priority = "HIGH" | "MEDIUM" | "LOW";
type Status = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

const Maintenance: React.FC = () => {
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [isRepairCostModalOpen, setIsRepairCostModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MaintenanceRequest | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [isAddRequestModalOpen, setIsAddRequestModalOpen] = useState(false);

  useEffect(() => {
    fetchMaintenanceRequests();
    fetchProperties();
    fetchUnits();
    fetchTenants();
  }, []);

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    setUserType(storedUserType);
  }, []);

  const fetchMaintenanceRequests = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setMaintenanceRequests(data);
      } else {
        console.error(
          "Fetched maintenance requests data is not an array:",
          data,
        );
        setMaintenanceRequests([]);
      }
    } catch (error) {
      console.error("Error fetching maintenance requests:", error);
      setMaintenanceRequests([]);
    }
  };

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
      const data = await response.json();
      if (data.success && Array.isArray(data.properties)) {
        setProperties(data.properties);
      } else {
        console.error("Fetched properties data is not as expected:", data);
        setProperties([]);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/properties/${propertyId}/units/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const data = await response.json();
      if (data.units && Array.isArray(data.units)) {
        setUnits(data.units);
      } else {
        console.error("Fetched units data is not as expected:", data);
        setUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      const data = await response.json();

      // Explicitly type-check or assert data
      if (Array.isArray(data) && data.every((item) => isTenant(item))) {
        setTenants(data);
      } else {
        console.error("Fetched tenants data is not as expected:", data);
        setTenants([]);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setTenants([]);
    }
  };

  // Update the property selection handler
  // Update handlePropertyChange function
  const handlePropertyChange = async (propertyId: string) => {
    setSelectedProperty(propertyId);
    setSelectedUnit(""); // Reset unit selection
    setSelectedTenant(""); // Reset tenant selection
    if (propertyId) {
      await fetchUnits(propertyId);
    } else {
      setUnits([]);
    }
  };

  // Add new function to handle unit selection
  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);

    // Find the selected unit and its tenant
    const selectedUnitData = units.find(
      (unit) => unit.id === unitId,
    ) as UnitWithLease;

    if (selectedUnitData?.current_lease?.tenant) {
      // Automatically set the tenant from the lease
      setSelectedTenant(selectedUnitData.current_lease.tenant.id);

      // Update tenants array if the tenant isn't already in it
      const leaseTenant = {
        id: selectedUnitData.current_lease.tenant.id,
        first_name: selectedUnitData.current_lease.tenant.name.split(" ")[0],
        last_name: selectedUnitData.current_lease.tenant.name
          .split(" ")
          .slice(1)
          .join(" "),
      };

      setTenants((prevTenants) => {
        const tenantExists = prevTenants.some((t) => t.id === leaseTenant.id);
        if (!tenantExists) {
          return [...prevTenants, leaseTenant];
        }
        return prevTenants;
      });
    } else {
      setSelectedTenant(""); // Reset tenant selection if no lease
    }
  };

  // Helper function to validate Tenant objects
  const isTenant = (item: any): item is Tenant => {
    return (
      typeof item.id === "string" &&
      typeof item.first_name === "string" &&
      typeof item.last_name === "string"
    );
  };

  const handleFilter = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      let url =
        "https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/";

      if (selectedProperty) {
        url = `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/by_property/?property_id=${selectedProperty}`;
      } else if (selectedUnit) {
        url = `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/by_unit/?unit_id=${selectedUnit}`;
      } else if (selectedTenant) {
        url = `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/by_tenant/?tenant_id=${selectedTenant}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      setMaintenanceRequests(data);
    } catch (error) {
      console.error("Error filtering maintenance requests:", error);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/${id}/approve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      fetchMaintenanceRequests();
    } catch (error) {
      console.error("Error approving maintenance request:", error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/${id}/reject/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      fetchMaintenanceRequests();
    } catch (error) {
      console.error("Error rejecting maintenance request:", error);
    }
  };

  const handleComplete = async (repairCost: number) => {
    if (selectedRequestId) {
      try {
        const accessToken = localStorage.getItem("accessToken");
        await fetch(
          `https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/${selectedRequestId}/complete/`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ repair_cost: repairCost }),
          },
        );
        fetchMaintenanceRequests();
        setIsRepairCostModalOpen(false);
        setSelectedRequestId(null);
      } catch (error) {
        console.error("Error completing maintenance request:", error);
      }
    }
  };

  const handleAddRequest = async (requestData: {
    title: string;
    description: string;
    priority: string;
  }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/maintenance-requests/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        },
      );
      if (response.ok) {
        fetchMaintenanceRequests();
        setIsAddRequestModalOpen(false);
      } else {
        console.error("Failed to add maintenance request");
      }
    } catch (error) {
      console.error("Error adding maintenance request:", error);
    }
  };

  const getPriorityStyles = (priority: Priority): string => {
    const styles: Record<Priority, string> = {
      HIGH: "bg-red-100 text-red-800 hover:bg-red-200",
      MEDIUM: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      LOW: "bg-green-100 text-green-800 hover:bg-green-200",
    };
    return styles[priority];
  };

  const getStatusStyles = (status: Status): string => {
    const styles: Record<Status, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      COMPLETED: "bg-blue-100 text-blue-800",
    };
    return styles[status];
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-green-50 border-green-100 shadow-md">
        <CardHeader className="border-b border-green-100 bg-white">
          <CardTitle className="text-2xl font-semibold text-green-800">
            Maintenance Requests
          </CardTitle>
          <CardDescription className="text-green-600">
            View and manage maintenance requests across properties
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {userType === "TENANT" && (
            <Button
              onClick={() => setIsAddRequestModalOpen(true)}
              className="mb-4 bg-green-600 hover:bg-green-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Maintenance Request
            </Button>
          )}
          {/* Filters Section */}
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <h3 className="text-lg font-medium text-green-700 mb-4">Filters</h3>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Property Select */}
              <div className="space-y-2">
                <label className="text-sm text-green-600 font-medium">
                  Property
                </label>
                <Select onValueChange={handlePropertyChange}>
                  <SelectTrigger className="w-[200px] border-green-200 focus:ring-green-500">
                    <SelectValue placeholder="Select Property" />
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

              {/* Unit Select */}
              <div className="space-y-2">
                <label className="text-sm text-green-600 font-medium">
                  Unit
                </label>
                <Select
                  onValueChange={handleUnitChange}
                  disabled={!selectedProperty || isLoading}
                  value={selectedUnit}
                >
                  <SelectTrigger className="w-[200px] border-green-200 focus:ring-green-500">
                    <SelectValue
                      placeholder={
                        isLoading
                          ? "Loading units..."
                          : !selectedProperty
                            ? "Select a property first"
                            : "Select Unit"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unit_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-green-600 font-medium">
                  Tenant
                </label>
                <Select
                  onValueChange={setSelectedTenant}
                  value={selectedTenant}
                  disabled={!selectedUnit}
                >
                  <SelectTrigger className="w-[200px] border-green-200 focus:ring-green-500">
                    <SelectValue
                      placeholder={
                        !selectedUnit ? "Select a unit first" : "Select Tenant"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {`${tenant.first_name} ${tenant.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleFilter}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-green-700">Title</TableHead>
                  <TableHead className="text-green-700">Description</TableHead>
                  <TableHead className="text-green-700">Priority</TableHead>
                  <TableHead className="text-green-700">Status</TableHead>
                  <TableHead className="text-green-700">
                    Requested Date
                  </TableHead>
                  <TableHead className="text-green-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-green-50">
                    <TableCell className="font-medium">
                      {request.title}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {request.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPriorityStyles(
                          request.priority as Priority,
                        )}
                      >
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusStyles(request.status as Status)}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(request.requested_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {userType === "TENANT" ? (
                          request.status === "APPROVED" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() =>
                                handleComplete(Number(request.repair_cost))
                              }
                            >
                              Mark as Complete
                            </Button>
                          )
                        ) : (
                          <>
                            {request.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(request.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(request.id)}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {request.status === "APPROVED" && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                  setSelectedRequestId(request.id);
                                  setIsRepairCostModalOpen(true);
                                }}
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RepairCostModal
        isOpen={isRepairCostModalOpen}
        onClose={() => {
          setIsRepairCostModalOpen(false);
          setSelectedRequestId(null);
        }}
        onSubmit={handleComplete}
      />
      <MaintenanceRequestDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
      <AddMaintenanceRequestModal
        isOpen={isAddRequestModalOpen}
        onClose={() => setIsAddRequestModalOpen(false)}
        onSubmit={handleAddRequest}
      />
    </div>
  );
};

export default Maintenance;
