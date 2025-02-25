import { format } from "date-fns";
import { Download, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  category: string;
  category_display: string;
  custom_category: string | null;
  property_name: string;
  unit_number: string | null;
  tenant_name: string | null;
  vendor_name: string | null;
  vendor_contact: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  is_tax_deductible: boolean;
  created_by_name: string;
  created_at: string;
}

interface ExpenseDetailsModalProps {
  expense: Expense;
  trigger: React.ReactNode;
}

export function ExpenseDetailsModal({
  expense,
  trigger,
}: ExpenseDetailsModalProps) {
  const [open, setOpen] = useState(false);

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
  }).format(expense.amount);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const handleDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (expense.receipt_url) {
      window.open(expense.receipt_url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 bg-green-50">
          <DialogTitle className="text-2xl font-bold text-green-800">
            Expense Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <div className="p-6">
            {/* Expense Summary Card */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="bg-green-50 transition-all hover:shadow-md rounded-md">
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-600">Amount</p>
                  <p className="text-2xl font-bold mt-1 text-green-700">
                    {formattedAmount}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 transition-all hover:shadow-md rounded-md">
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-600">Category</p>
                  <p className="text-2xl font-bold mt-1">
                    {expense.category === "OTHER" && expense.custom_category
                      ? expense.custom_category
                      : expense.category_display}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 transition-all hover:shadow-md rounded-md">
                <div className="p-4">
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatDate(expense.expense_date)}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Details Card */}
            <div className="mb-6">
              <div className="hover:shadow-md transition-all border-l-4 border-l-green-500 rounded-md">
                <div className="px-6 py-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg text-green-800 font-bold">
                        {expense.title}
                      </h3>
                      <div className="mt-1">
                        {expense.is_tax_deductible ? (
                          <Badge className="bg-green-100 text-green-800 font-medium">
                            Tax Deductible
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 font-medium">
                            Not Tax Deductible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Property:</span>
                        <span className="font-medium">
                          {expense.property_name}
                        </span>
                      </p>
                      {expense.unit_number && (
                        <p className="flex justify-between">
                          <span className="text-gray-600">Unit:</span>
                          <span className="font-medium">
                            {expense.unit_number}
                          </span>
                        </p>
                      )}
                      {expense.tenant_name && (
                        <p className="flex justify-between">
                          <span className="text-gray-600">Tenant:</span>
                          <span className="font-medium">
                            {expense.tenant_name}
                          </span>
                        </p>
                      )}
                      <p className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {formatDate(expense.expense_date)}
                        </span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-green-700">
                          {formattedAmount}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">
                          {expense.category === "OTHER" &&
                          expense.custom_category
                            ? expense.custom_category
                            : expense.category_display}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Created By:</span>
                        <span className="font-medium">
                          {expense.created_by_name}
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-600">Created On:</span>
                        <span className="font-medium">
                          {format(new Date(expense.created_at), "MMM d, yyyy")}
                        </span>
                      </p>
                    </div>

                    {/* Description Section */}
                    {expense.description && (
                      <div className="col-span-2 mt-2 bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-600 font-medium mb-1">
                          Description:
                        </p>
                        <p className="text-gray-800">{expense.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor Information Card */}
            {(expense.vendor_name || expense.vendor_contact) && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-green-800 mb-3">
                  Vendor Information
                </h3>
                <div className="hover:shadow-md transition-all border-l-4 border-l-green-500 rounded-md">
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {expense.vendor_name && (
                        <p className="flex justify-between">
                          <span className="text-gray-600">Vendor Name:</span>
                          <span className="font-medium">
                            {expense.vendor_name}
                          </span>
                        </p>
                      )}
                      {expense.vendor_contact && (
                        <p className="flex justify-between">
                          <span className="text-gray-600">Vendor Contact:</span>
                          <span className="font-medium">
                            {expense.vendor_contact}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Information Card */}
            {(expense.receipt_number || expense.receipt_url) && (
              <div className="mb-6">
                <h3 className="text-md font-semibold text-green-800 mb-3">
                  Receipt Information
                </h3>
                <div className="hover:shadow-md transition-all border-l-4 border-l-green-500 rounded-md">
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {expense.receipt_number && (
                        <p className="flex justify-between text-sm">
                          <span className="text-gray-600">Receipt Number:</span>
                          <span className="font-medium">
                            {expense.receipt_number}
                          </span>
                        </p>
                      )}
                      {expense.receipt_url && (
                        <Button
                          variant="outline"
                          onClick={handleDownload}
                          className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white border-0"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Created By Information */}
            <div className="text-sm text-gray-500 mt-4 bg-gray-50 p-4 rounded-md">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  Created by {expense.created_by_name} on{" "}
                  {format(new Date(expense.created_at), "MMM d, yyyy h:mm a")}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
