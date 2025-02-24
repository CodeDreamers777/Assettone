import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building, Edit, Home, Trash2 } from "lucide-react";

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

type Unit = {};

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  units: Unit[];
  isLoading: boolean;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: () => void;
  onAddUnit: () => void;
  handleFileSelect: (property: Property, file: File) => void;
}

export const PropertyDetailsModal = ({
  isOpen,
  onClose,
  property,
  units,
  isLoading,
  onEditProperty,
  onDeleteProperty,
  onAddUnit,
  handleFileSelect,
}: PropertyDetailsModalProps) => {
  if (!property) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && property) {
      handleFileSelect(property.id, property, file);
    }
  };

  const triggerFileInput = (inputId: string) => {
    const fileInput = document.getElementById(inputId);
    if (fileInput) {
      fileInput.click();
    }
  };

  const renderLogoSection = () => {
    const inputId = `logo-upload-detail-${property.id}`;

    if (property.logo_url) {
      return (
        <div className="relative group">
          <img
            src={property.logo_url || "/placeholder.svg"}
            alt={`${property.name} logo`}
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <input
              id={inputId}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInputChange}
            />
            <Button
              variant="outline"
              className="text-white border-white"
              onClick={() => triggerFileInput(inputId)}
            >
              Change Logo
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
        <input
          id={inputId}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <Button variant="outline" onClick={() => triggerFileInput(inputId)}>
          Upload Logo
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl border-2 border-[#38b000] shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-[#38b000]">{property.name}</DialogTitle>
          <div className="w-full max-w-md mx-auto my-4">
            {renderLogoSection()}
          </div>
          <DialogDescription>
            {property.address_line1}, {property.city}, {property.state}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Property Details */}
          <div className="space-y-4">
            <div className="bg-[#38b000]/10 p-4 rounded-lg border border-[#38b000]/30">
              <h3 className="font-semibold mb-2 flex items-center text-[#38b000]">
                <Home className="mr-2" /> Property Information
              </h3>
              <p>
                <strong>Full Address:</strong> {property.address_line1}{" "}
                {property.address_line2}
              </p>
              <p>
                <strong>City:</strong> {property.city}
              </p>
              <p>
                <strong>State:</strong> {property.state}
              </p>
              <p>
                <strong>Postal Code:</strong> {property.postal_code}
              </p>
              <p>
                <strong>Country:</strong> {property.country}
              </p>
            </div>
            <div className="bg-[#38b000]/10 p-4 rounded-lg border border-[#38b000]/30">
              <h3 className="font-semibold mb-2 text-[#38b000]">Description</h3>
              <p>{property.description}</p>
            </div>
          </div>
          {/* Right Column - Units and Actions */}
          <div className="space-y-4">
            <div className="bg-[#38b000]/10 p-4 rounded-lg border border-[#38b000]/30">
              <h3 className="font-semibold mb-2 flex items-center text-[#38b000]">
                <Building className="mr-2" /> Units
              </h3>
              {isLoading ? (
                <p className="text-muted-foreground">Loading units...</p>
              ) : units.length > 0 ? (
                <p className="text-muted-foreground">
                  {units.length} unit{units.length !== 1 ? "s" : ""} available
                </p>
              ) : (
                <p className="text-muted-foreground">No units available</p>
              )}
              <Button className="mt-2" variant="outline" onClick={onAddUnit}>
                Add Unit
              </Button>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => onEditProperty(property)}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" /> Edit Property
              </Button>
              <Button
                onClick={onDeleteProperty}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Property
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
