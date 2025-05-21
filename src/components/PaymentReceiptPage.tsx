import { useState, useEffect } from "react";

// Type definitions
interface PaymentData {
  tenant_id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  transaction_id: string;
  amount_paid: number;
  payment_date: string;
  period_start: string;
  period_end: string;
  total_due: number;
  total_paid: number;
  balance: number;
  is_paid: boolean;
}

export default function PaymentReceiptPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchPaymentData = async () => {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setError("Invalid payment link. No token provided.");
        setLoading(false);
        return;
      }

      try {
        // Fetch from API endpoint
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mpesa/payment-receipt?token=${token}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payment data");
        }

        const data = await response.json();
        setPaymentData(data);
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(
          "Unable to load payment details. The link may be expired or invalid.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, []);

  // Format date string to more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Generate PDF
  const handleDownloadPDF = () => {
    setIsPrinting(true);

    // Use browser's print functionality
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"></div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              Loading payment details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold text-gray-800">Error</h2>
            <p className="mt-3 text-center text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div
      className={`min-h-screen bg-gray-100 p-4 ${isPrinting ? "print:bg-white" : ""}`}
    >
      <style jsx global>{`
        @media print {
          body {
            background-color: white;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-2xl">
        {/* Download Button */}
        <div className="mb-4 flex justify-end no-print">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                clipRule="evenodd"
              />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Receipt Card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10"></div>

            <div className="relative z-10">
              <h1 className="mb-1 text-3xl font-bold">Payment Receipt</h1>
              <p className="text-green-100">Transaction Complete</p>
            </div>
          </div>

          {/* Property and Tenant Info */}
          <div className="border-b border-gray-100 bg-gray-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {paymentData.property_name}
                </h2>
                <p className="text-gray-600">Unit {paymentData.unit_number}</p>
              </div>
              <div
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${paymentData.is_paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
              >
                {paymentData.is_paid ? "Fully Paid" : "Partially Paid"}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-500">Tenant:</p>
              <p className="text-lg font-medium text-gray-800">
                {paymentData.tenant_name}
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6">
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Payment Details
              </h3>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="text-sm font-medium text-gray-800">
                    {paymentData.transaction_id}
                  </p>
                </div>

                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Payment Date</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(paymentData.payment_date)}
                  </p>
                </div>

                <div className="col-span-2 rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-xs text-gray-500">Amount Paid</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(paymentData.amount_paid)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="mb-2 text-sm text-gray-500">Rental Period:</p>
                <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">From</p>
                    <p className="text-sm font-medium">
                      {formatDate(paymentData.period_start)}
                    </p>
                  </div>

                  <div className="h-px w-12 bg-gray-200"></div>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">To</p>
                    <p className="text-sm font-medium">
                      {formatDate(paymentData.period_end)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Total Due:</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(paymentData.total_due)}
                  </p>
                </div>

                <div className="flex justify-between">
                  <p className="text-sm text-gray-600">Total Paid:</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(paymentData.total_paid)}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-800">Balance:</p>
                    <p className="font-bold text-gray-800">
                      {formatCurrency(paymentData.balance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thank You Message */}
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-sm font-medium text-green-800">
                Thank you for your payment!
              </p>
              <p className="mt-1 text-xs text-green-600">
                If you have any questions, please contact your property manager.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-xs text-gray-500">
              This is an official payment receipt.
            </p>
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
