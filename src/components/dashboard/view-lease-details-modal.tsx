// Fixed ViewLeaseDetailsModal.tsx (exactly following PayRentModal pattern)
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Home,
  User,
  DollarSign,
  Shield,
  Clock,
  FileText,
} from "lucide-react";

interface ViewLeaseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: any;
}

export function ViewLeaseDetailsModal({
  isOpen,
  onClose,
  lease,
}: ViewLeaseDetailsModalProps) {
  // Force cleanup when component unmounts or modal closes (SAME AS PayRentModal)
  useEffect(() => {
    const cleanup = () => {
      // Force reset all possible body styles that might interfere
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.bottom = "";
      document.body.classList.remove("overflow-hidden");

      // Also reset on document and html
      document.documentElement.style.overflow = "";
      document.documentElement.style.pointerEvents = "";
    };

    if (!isOpen) {
      // Small delay to ensure dialog cleanup is complete
      const timeoutId = setTimeout(cleanup, 100);
      return () => clearTimeout(timeoutId);
    }

    // Cleanup on unmount
    return cleanup;
  }, [isOpen]);

  if (!lease) return null;

  const DetailItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <div className="flex items-center space-x-2 mb-4">
      <Icon className="h-5 w-5 text-green-600" />
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base font-semibold">{value}</p>
      </div>
    </div>
  );

  // SAME PATTERN AS PayRentModal
  const handleClose = () => {
    // Force immediate cleanup
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");
    document.documentElement.style.overflow = "";

    onClose();
  };

  // SAME PATTERN AS PayRentModal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[550px]"
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Lease Details
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={User}
                label="Tenant"
                value={lease.tenant_name}
              />
              <DetailItem
                icon={Home}
                label="Unit"
                value={`${lease.unit_details.unit_number} - ${lease.unit_details.property_name}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={Calendar}
                label="Start Date"
                value={new Date(lease.start_date).toLocaleDateString()}
              />
              <DetailItem
                icon={Calendar}
                label="End Date"
                value={new Date(lease.end_date).toLocaleDateString()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={DollarSign}
                label="Monthly Rent"
                value={`$${lease.monthly_rent}`}
              />
              <DetailItem
                icon={Shield}
                label="Security Deposit"
                value={`$${lease.security_deposit}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <DetailItem
                icon={Clock}
                label="Created At"
                value={new Date(lease.created_at).toLocaleString()}
              />
              <DetailItem
                icon={Clock}
                label="Updated At"
                value={new Date(lease.updated_at).toLocaleString()}
              />
            </div>
            <div>
              <DetailItem icon={FileText} label="Status" value={lease.status} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
