"use client";

import type React from "react";

import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PayRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaseId: string;
  onPaymentComplete: () => void;
}

export function PayRentModal({
  isOpen,
  onClose,
  leaseId,
  onPaymentComplete,
}: PayRentModalProps) {
  const [amount, setAmount] = useState(20000);
  const [paymentDate, setPaymentDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Reset form when opening
      setAmount(20000);
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod("CASH");
      setNotes("");
      setIsLoading(false);
    }
  }, [isOpen]);

  // Force cleanup when component unmounts or modal closes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaseId || isLoading) return;

    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("accessToken");
      await axios.post(
        "https://assettone-rental-management.onrender.com/api/v1/payments/",
        {
          lease: leaseId,
          amount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      toast({
        title: "Success",
        description: "Rent payment processed successfully.",
      });

      // Call completion callback first
      onPaymentComplete();

      // Then close modal
      handleClose();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process rent payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;

    // Force immediate cleanup
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");
    document.documentElement.style.overflow = "";

    onClose();
  };

  const handleCancel = () => {
    handleClose();
  };

  // Prevent the dialog from managing open state itself
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  if (!leaseId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle>Pay Rent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="col-span-3"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-date" className="text-right">
                Payment Date
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="col-span-3"
                disabled={isLoading}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment-method" className="text-right">
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={isLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                disabled={isLoading}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Pay Rent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
