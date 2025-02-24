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

interface AddEditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
          <Button onClick={onConfirm}>
            {property ? "Update Property" : "Add Property"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
