import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
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

interface MaintenanceRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
}

export const MaintenanceRequestDetailsModal: React.FC<
  MaintenanceRequestDetailsModalProps
> = ({ isOpen, onClose, request }) => {
  if (!request) return null;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return colors[priority.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-green-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-green-800 pb-2">
            Maintenance Request Details
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] overflow-auto px-1">
          <div className="grid gap-6 py-4">
            {/* Header Section */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-xl font-medium text-green-700 mb-3">
                {request.title}
              </h3>
              <div className="flex gap-3 mb-3">
                <Badge className={`${getPriorityColor(request.priority)}`}>
                  {request.priority} Priority
                </Badge>
                <Badge className={`${getStatusColor(request.status)}`}>
                  {request.status}
                </Badge>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="text-lg font-medium text-green-700 mb-4">
                Request Information
              </h4>
              <div className="grid gap-4">
                {/* Dates Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">
                      Requested Date
                    </span>
                    <p className="font-medium">
                      {new Date(request.requested_date).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Status Date</span>
                    <p className="font-medium">
                      {request.approved_rejected_date
                        ? new Date(
                            request.approved_rejected_date,
                          ).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Location Information */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Property</span>
                    <p className="font-medium">{request.property}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Unit</span>
                    <p className="font-medium">{request.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-gray-500">Tenant</span>
                    <p className="font-medium">{request.tenant}</p>
                  </div>
                </div>

                {/* Cost and Notes */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="space-y-1 mb-4">
                    <span className="text-sm text-gray-500">Repair Cost</span>
                    <p className="font-medium text-lg text-green-700">
                      {request.repair_cost !== null
                        ? `$${Number(request.repair_cost).toFixed(2)}`
                        : "N/A"}
                    </p>
                  </div>
                  {request.notes && (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-500">Notes</span>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {request.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Meta Information */}
                <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>
                      Created: {new Date(request.created_at).toLocaleString()}
                    </span>
                    <span>
                      Updated: {new Date(request.updated_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span>ID: {request.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceRequestDetailsModal;
