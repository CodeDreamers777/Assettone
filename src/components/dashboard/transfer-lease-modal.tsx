import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}

interface TransferLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (transferData: TransferLeaseData) => void;
  leaseId: string;
}

interface TransferLeaseData {
  tenant: string;
  notes?: string;
}

export function TransferLeaseModal({
  isOpen,
  onClose,
  onTransfer,
  leaseId,
}: TransferLeaseModalProps) {
  const [tenants, setTenants] = useState<{ [key: string]: Tenant[] }>({});
  const [transferData, setTransferData] = useState<TransferLeaseData>({
    tenant: "",
    notes: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accessToken = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${leaseId}/transfer_lease/`,
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
      onTransfer(transferData);
      onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Lease</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tenant">Select Tenant</Label>
            <Select
              onValueChange={(value) =>
                setTransferData({ ...transferData, tenant: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tenants).map(([property, propertyTenants]) => (
                  <React.Fragment key={property}>
                    <SelectItem value={property} disabled>
                      {property}
                    </SelectItem>
                    {propertyTenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={transferData.notes}
              onChange={(e) =>
                setTransferData({ ...transferData, notes: e.target.value })
              }
              placeholder="Enter any additional notes"
            />
          </div>
          <Button type="submit" className="w-full">
            Transfer Lease
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
