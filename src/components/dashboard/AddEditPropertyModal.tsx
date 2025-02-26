import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

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
  manager?: string | null;
  owner?: string;
  total_units?: number;
}

// Define a type for field names to avoid string indexing issues
type PropertyField = keyof Property;

interface AddEditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (changedProperty: Partial<Property>, isPartial: boolean) => void;
  property: Property | null;
  newProperty: Partial<Property>;
  setNewProperty: (property: Partial<Property>) => void;
}

export const AddEditPropertyModal = ({
  isOpen,
  onClose,
  onConfirm,
  property,
  newProperty,
  setNewProperty,
}: AddEditPropertyModalProps) => {
  // Store the original property values to compare against
  const [originalProperty, setOriginalProperty] = useState<Property | null>(
    null,
  );

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      if (property) {
        // Store a deep copy of the original property for comparison
        setOriginalProperty(JSON.parse(JSON.stringify(property)));

        // Initialize form with current property values
        setNewProperty(JSON.parse(JSON.stringify(property)));
      } else {
        // For new properties, start with empty object
        setOriginalProperty(null);
        setNewProperty({});
      }
    }
  }, [isOpen, property, setNewProperty]);

  const handleFieldChange = (fieldName: PropertyField, value: string) => {
    setNewProperty((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleConfirm = () => {
    // For new properties, just send the new data
    if (!originalProperty) {
      onConfirm(newProperty, false); // Not partial for new properties
      return;
    }

    // For existing properties, create a PATCH payload with ONLY changed fields
    const patchPayload: Partial<Property> = {
      id: originalProperty.id, // Always include ID
    };

    // Editable fields - only these will be included in PATCH
    const editableFields: PropertyField[] = [
      "name",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "postal_code",
      "country",
      "description",
    ];

    // Only add fields that have actually changed
    let hasChanges = false;
    editableFields.forEach((field) => {
      // Only add the field if it exists in newProperty and is different from the original
      if (
        newProperty[field] !== undefined &&
        originalProperty[field] !== newProperty[field]
      ) {
        patchPayload[field] = newProperty[field];
        hasChanges = true;
      }
    });

    // Call onConfirm with just the changed fields and specify this is a partial update
    onConfirm(patchPayload, true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {property ? "Edit Property" : "Add New Property"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label>Property Name</Label>
              <Input
                value={newProperty.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                placeholder="Enter property name"
              />
            </div>

            <div>
              <Label>Address Line 1</Label>
              <Input
                value={newProperty.address_line1 || ""}
                onChange={(e) =>
                  handleFieldChange("address_line1", e.target.value)
                }
                placeholder="Street address"
              />
            </div>

            <div>
              <Label>Address Line 2</Label>
              <Input
                value={newProperty.address_line2 || ""}
                onChange={(e) =>
                  handleFieldChange("address_line2", e.target.value)
                }
                placeholder="Apartment, suite, etc."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={newProperty.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={newProperty.state || ""}
                  onChange={(e) => handleFieldChange("state", e.target.value)}
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
                    handleFieldChange("postal_code", e.target.value)
                  }
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={newProperty.country || ""}
                  onChange={(e) => handleFieldChange("country", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newProperty.description || ""}
                onChange={(e) =>
                  handleFieldChange("description", e.target.value)
                }
                placeholder="Tell us about this property"
                className="min-h-[200px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm}>
            {property ? "Update Property" : "Add Property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
