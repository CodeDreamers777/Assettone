import React, { useState, useEffect } from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Building,
  Edit,
  Home,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState<Partial<Property>>({
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    description: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter(
      (property) =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProperties(filtered);
  }, [searchTerm, properties]);

  const fetchProperties = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/v1/properties/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      const responseData = await response.json();
      const data = responseData.properties;
      setProperties(
        data.sort(
          (a: Property, b: Property) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const handleAddEditProperty = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      const url = selectedProperty
        ? `http://127.0.0.1:8000/api/v1/properties/${selectedProperty.id}/`
        : "http://127.0.0.1:8000/api/v1/properties/";

      const method = selectedProperty ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newProperty),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${selectedProperty ? "update" : "create"} property`,
        );
      }

      await fetchProperties();
      setIsAddEditModalOpen(false);
      setSelectedProperty(null);
      setNewProperty({
        name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        description: "",
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteProperty = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      if (!selectedProperty) {
        console.error("No property selected for deletion");
        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/properties/${selectedProperty.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      await fetchProperties();
      setIsDetailModalOpen(false);
      setIsDeleteDialogOpen(false);
      setSelectedProperty(null);
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const openPropertyModal = (property?: Property) => {
    if (property) {
      setSelectedProperty(property);
      setNewProperty(property);
    }
    setIsAddEditModalOpen(true);
  };

  const openPropertyDetails = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Properties"
        text="Manage and track your real estate investments."
      >
        <Button
          onClick={() => openPropertyModal()}
          className="group bg-[#38b000] hover:bg-[#38b000]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
          Add Property
        </Button>
      </DashboardHeader>

      {/* Add/Edit Property Modal */}
      <Dialog open={isAddEditModalOpen} onOpenChange={setIsAddEditModalOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProperty ? "Edit Property" : "Add New Property"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label>Property Name</Label>
                <Input
                  value={newProperty.name || ""}
                  onChange={(e) =>
                    setNewProperty({ ...newProperty, name: e.target.value })
                  }
                  placeholder="Enter property name"
                />
              </div>

              <div>
                <Label>Address Line 1</Label>
                <Input
                  value={newProperty.address_line1 || ""}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      address_line1: e.target.value,
                    })
                  }
                  placeholder="Street address"
                />
              </div>

              <div>
                <Label>Address Line 2</Label>
                <Input
                  value={newProperty.address_line2 || ""}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      address_line2: e.target.value,
                    })
                  }
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={newProperty.city || ""}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={newProperty.state || ""}
                    onChange={(e) =>
                      setNewProperty({ ...newProperty, state: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={newProperty.postal_code || ""}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        postal_code: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={newProperty.country || ""}
                    onChange={(e) =>
                      setNewProperty({
                        ...newProperty,
                        country: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newProperty.description || ""}
                  onChange={(e) =>
                    setNewProperty({
                      ...newProperty,
                      description: e.target.value,
                    })
                  }
                  placeholder="Tell us about this property"
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddEditProperty}>
              {selectedProperty ? "Update Property" : "Add Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Property Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          {selectedProperty && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProperty.name}</DialogTitle>
                <DialogDescription>
                  {selectedProperty.address_line1}, {selectedProperty.city},{" "}
                  {selectedProperty.state}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-8">
                {/* Left Column - Property Details */}
                <div className="space-y-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Home className="mr-2 text-primary" /> Property
                      Information
                    </h3>
                    <p>
                      <strong>Full Address:</strong>{" "}
                      {selectedProperty.address_line1}{" "}
                      {selectedProperty.address_line2}
                    </p>
                    <p>
                      <strong>City:</strong> {selectedProperty.city}
                    </p>
                    <p>
                      <strong>State:</strong> {selectedProperty.state}
                    </p>
                    <p>
                      <strong>Postal Code:</strong>{" "}
                      {selectedProperty.postal_code}
                    </p>
                    <p>
                      <strong>Country:</strong> {selectedProperty.country}
                    </p>
                  </div>

                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p>{selectedProperty.description}</p>
                  </div>
                </div>

                {/* Right Column - Units and Actions */}
                <div className="space-y-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Building className="mr-2 text-primary" /> Units
                    </h3>
                    <p className="text-muted-foreground">No units added yet</p>
                    <Button className="mt-2" variant="outline">
                      Add Unit
                    </Button>
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      onClick={() => {
                        openPropertyModal(selectedProperty);
                        setIsDetailModalOpen(false);
                      }}
                      className="flex-1"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit Property
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Property
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              property "{selectedProperty?.name}" along with all its associated
              units and leases. All related data will be permanently removed
              from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProperty}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties by name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md mx-auto shadow-sm border-muted-foreground/20 
  focus:ring-2 focus:ring-[#38b000]/50 transition-all"
          />
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">
            No properties found. Add your first property!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <Card
              key={property.id}
              className={cn(
                "overflow-hidden transition-all duration-300 ",
                "hover:shadow-xl hover:-translate-y-2 hover:border-primary/50", // Keep this part
                "border-transparent border-2",
              )}
            >
              <CardHeader
                className="bg-gradient-to-r from-[#38b000] to-[#38b000]/70 
  text-white p-4 flex flex-row items-center justify-between"
              >
                <CardTitle className="text-lg font-bold truncate">
                  {property.name}
                </CardTitle>
                <Edit
                  onClick={() => openPropertyModal(property)}
                  className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </CardHeader>
              <CardContent className="pt-6 pb-4 px-4 space-y-3">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  <p className="text-sm truncate">
                    {property.address_line1}, {property.city}, {property.state}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {property.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <p>Created: {format(new Date(property.created_at), "PPP")}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 p-4">
                <Button
                  onClick={() => openPropertyDetails(property)}
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-[#38b000] hover:text-white transition-colors"
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

export default Properties;
