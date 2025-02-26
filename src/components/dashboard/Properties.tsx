"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, MapPin, Calendar, Building, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";

import { LogoUploadModal } from "./LogoUploadModal";
import { AddEditPropertyModal } from "./AddEditPropertyModal";
import { PropertyDetailsModal } from "./PropertyDetailsModal";
import { AddUnitModal } from "./add-unit-modal";
import type { Unit } from "./Units";

interface Property {
  id: string;
  name: string;
  logo: string | null;
  logo_url: string | null;
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [selectedPropertyForLogo, setSelectedPropertyForLogo] =
    useState<Property | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/properties/",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

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

  const fetchUnits = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.get(
        `https://assettoneestates.pythonanywhere.com/api/v1/properties/${propertyId}/units/`,
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

  const handleFileSelect = (property: Property, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(previewUrl);
    setSelectedLogo(file);
    setSelectedPropertyForLogo(property);
    setIsLogoModalOpen(true);
  };

  const handleModalClose = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }
    setIsLogoModalOpen(false);
    setLogoPreviewUrl(null);
    setSelectedLogo(null);
    setSelectedPropertyForLogo(null);
  };

  const handleLogoUpload = async (file: File) => {
    if (!selectedPropertyForLogo) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await axios.post(
        `https://assettoneestates.pythonanywhere.com/api/v1/properties/${selectedPropertyForLogo.id}/upload-logo/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Logo uploaded successfully",
        });
        await fetchProperties();
        handleModalClose();
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCreateUnit = (newUnit: Unit) => {
    setUnits([...units, newUnit]);
  };

  const handleAddEditProperty = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("Access token not found");
        return;
      }

      const url = selectedProperty
        ? `https://assettoneestates.pythonanywhere.com/api/v1/properties/${selectedProperty.id}/`
        : "https://assettoneestates.pythonanywhere.com/api/v1/properties/";

      // For new properties, use POST with all fields
      if (!selectedProperty) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(newProperty),
        });

        if (!response.ok) {
          throw new Error("Failed to create property");
        }
      }
      // For existing properties, use PATCH with only changed fields
      else {
        // Get only the fields that changed
        const changedData = {};

        // Always include the ID for the API to identify the property
        changedData.id = selectedProperty.id;

        // Check each editable field to see if it changed
        const editableFields = [
          "name",
          "address_line1",
          "address_line2",
          "city",
          "state",
          "postal_code",
          "country",
          "description",
        ];

        editableFields.forEach((field) => {
          // Only include field if it's different from the original
          if (newProperty[field] !== selectedProperty[field]) {
            changedData[field] = newProperty[field];
          }
        });

        // Make the PATCH request with only changed fields
        const response = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(changedData),
        });

        if (!response.ok) {
          throw new Error("Failed to update property");
        }
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
        `https://assettoneestates.pythonanywhere.com/api/v1/properties/${selectedProperty.id}/`,
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

  const openPropertyDetails = async (property: Property) => {
    setSelectedProperty(property);
    setIsDetailModalOpen(true);
    await fetchUnits(property.id);
  };

  const renderPropertyLogoSection = (property: Property) => {
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(property, file);
      }
    };

    return (
      <div className="w-full h-32 bg-white/10 rounded-lg overflow-hidden">
        {property.logo_url ? (
          <img
            src={property.logo_url}
            alt={`${property.name} logo`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id={`logo-upload-${property.id}`}
              />
              <Button
                variant="outline"
                className="bg-white/20 hover:bg-white/30"
                onClick={() => {
                  const fileInput = document.getElementById(
                    `logo-upload-${property.id}`,
                  );
                  if (fileInput) {
                    fileInput.click();
                  }
                }}
              >
                Choose Logo
              </Button>
            </div>
          </div>
        )}
      </div>
    );
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

      <LogoUploadModal
        isOpen={isLogoModalOpen}
        onClose={handleModalClose}
        onConfirm={handleLogoUpload}
        selectedImage={selectedLogo}
        previewUrl={logoPreviewUrl}
        propertyName={selectedPropertyForLogo?.name || ""}
        isUploading={uploadingLogo} // Pass the loading state
      />

      <AddEditPropertyModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        onConfirm={handleAddEditProperty}
        property={selectedProperty}
        newProperty={newProperty}
        setNewProperty={setNewProperty}
      />

      <PropertyDetailsModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        property={selectedProperty}
        units={units}
        isLoading={isLoading}
        onEditProperty={openPropertyModal}
        onDeleteProperty={() => setIsDeleteDialogOpen(true)}
        onAddUnit={() => setIsCreateModalOpen(true)}
        handleFileSelect={handleFileSelect}
      />

      <AddUnitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateUnit={handleCreateUnit}
        selectedProperty={selectedProperty}
      />

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
                "overflow-hidden transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-2 hover:border-primary/50",
                "border-transparent border-2",
              )}
            >
              <CardHeader
                className="bg-gradient-to-r from-[#38b000] to-[#38b000]/70 
                  text-white p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-lg font-bold truncate">
                    {property.name}
                  </CardTitle>
                  <Edit
                    onClick={() => openPropertyModal(property)}
                    className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  />
                </div>
                {renderPropertyLogoSection(property)}
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
