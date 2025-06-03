import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

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
  water_units_used?: number;
  water_price_per_unit?: number;
  water_bill_amount?: number;
  water_bill_last_updated?: string;
  unit_rent?: number;
  payment_period?: string;
  timestamp?: number;
}

interface ReceiptMeta {
  accessed_count: number;
  created_at: string;
  expires_at: string;
}

interface ApiResponse {
  success: boolean;
  data: PaymentData;
  meta: ReceiptMeta;
}

interface ApiError {
  error: string;
  message: string;
  expired_at?: string;
}

export default function PaymentReceiptPage() {
  const { paymentId } = useParams(); // Get paymentId from URL params
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [receiptMeta, setReceiptMeta] = useState<ReceiptMeta | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchPaymentData = async () => {
      // Use paymentId from useParams instead of parsing URL manually
      const code = paymentId;

      if (!code || code.length !== 6) {
        setError(
          "Invalid receipt link. The receipt code is missing or invalid.",
        );
        setLoading(false);
        return;
      }

      try {
        // Fetch from new API endpoint structure
        const response = await fetch(
          `https://assettone-rental-management.onrender.com/api/v1/payment/payment-receipt/${code}/`,
        );

        const data = await response.json();

        if (!response.ok) {
          // Handle different error types from backend
          const errorData = data as ApiError;

          if (response.status === 404) {
            setError(
              "Receipt not found. The receipt link you are looking for does not exist or may have been removed.",
            );
          } else if (response.status === 410) {
            setError(
              `This receipt link has expired${errorData.expired_at ? ` on ${new Date(errorData.expired_at).toLocaleDateString()}` : ""}. Please contact support for assistance.`,
            );
          } else if (response.status === 400) {
            setError(
              "Invalid receipt code format. Receipt code must be 6 characters long.",
            );
          } else {
            setError(
              errorData.message ||
                "Unable to load payment details. Please try again later.",
            );
          }
          setLoading(false);
          return;
        }

        // Handle successful response
        const successData = data as ApiResponse;
        setPaymentData(successData.data);
        setReceiptMeta(successData.meta);
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError(
          "Unable to connect to server. Please check your internet connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [paymentId]); // Add paymentId as dependency

  // Format date string to more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Generate PDF
  const handleDownloadPDF = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  const handleShare = async () => {
    if (navigator.share && paymentData) {
      try {
        await navigator.share({
          title: "Payment Receipt",
          text: `Payment receipt for ${formatCurrency(paymentData.amount_paid)} - ${paymentData.property_name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Receipt link copied to clipboard!");
      } catch (err) {
        console.log("Error copying to clipboard:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full animate-pulse mb-4"></div>
            <div className="w-32 h-4 bg-gray-100 rounded animate-pulse mb-2"></div>
            <div className="w-24 h-3 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <>
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: none !important;
          }
        }
      `}</style>

      <div
        className={`min-h-screen bg-gray-50 ${isPrinting ? "print:bg-white" : ""}`}
      >
        {/* Header Actions - Hidden on Print */}
        <div className="no-print sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 z-10">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Receipt Card */}
        <div className="max-w-md mx-auto p-4 print-container">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Success Header */}
            <div className="text-center pt-8 pb-6 px-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Payment Successful
              </h1>
              <p className="text-gray-500">Your payment has been processed</p>
            </div>

            {/* Amount Section */}
            <div className="text-center pb-6 px-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(paymentData.amount_paid)}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(paymentData.payment_date)} •{" "}
                {formatTime(paymentData.payment_date)}
              </div>
            </div>

            {/* Receipt Meta Info */}
            {receiptMeta && (
              <div className="px-6 pb-4 no-print">
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Receipt accessed:</span>
                    <span className="font-medium text-blue-900">
                      {receiptMeta.accessed_count} times
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-blue-700">Expires:</span>
                    <span className="font-medium text-blue-900">
                      {formatDate(receiptMeta.expires_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {/* Property Info */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {paymentData.property_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Unit {paymentData.unit_number}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        paymentData.is_paid
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {paymentData.is_paid ? "Fully Paid" : "Partial Payment"}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Tenant: {paymentData.tenant_name}
                  </p>
                </div>

                {/* Transaction Details */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">
                    Transaction Details
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-sm text-gray-900">
                        {paymentData.transaction_id}
                      </span>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Payment Method</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            M
                          </span>
                        </div>
                        <span className="text-gray-900">M-Pesa</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-100"></div>

                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Rental Period</span>
                      <span className="text-gray-900 text-right text-sm">
                        {formatDate(paymentData.period_start)} -{" "}
                        {formatDate(paymentData.period_end)}
                      </span>
                    </div>

                    {paymentData.payment_period && (
                      <>
                        <div className="border-t border-gray-100"></div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">
                            Payment Schedule
                          </span>
                          <span className="text-gray-900 capitalize">
                            {paymentData.payment_period}
                          </span>
                        </div>
                      </>
                    )}

                    {paymentData.water_bill_last_updated && (
                      <>
                        <div className="border-t border-gray-100"></div>
                        <div className="flex justify-between py-2">
                          <span className="text-gray-500">
                            Water Bill Period
                          </span>
                          <span className="text-gray-900 text-right text-sm">
                            {formatDate(paymentData.water_bill_last_updated)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Payment Breakdown
                  </h3>
                  <div className="space-y-2">
                    {paymentData.unit_rent && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Monthly Rent</span>
                        <span className="text-gray-900">
                          {formatCurrency(paymentData.unit_rent)}
                        </span>
                      </div>
                    )}
                    {paymentData.water_bill_amount &&
                      paymentData.water_bill_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <div>
                            <span className="text-gray-500">Water Bill</span>
                            {paymentData.water_units_used &&
                              paymentData.water_price_per_unit && (
                                <div className="text-xs text-gray-400">
                                  {paymentData.water_units_used} units @{" "}
                                  {formatCurrency(
                                    paymentData.water_price_per_unit,
                                  )}
                                  /unit
                                </div>
                              )}
                          </div>
                          <span className="text-gray-900">
                            {formatCurrency(paymentData.water_bill_amount)}
                          </span>
                        </div>
                      )}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Due</span>
                        <span className="text-gray-900">
                          {formatCurrency(paymentData.total_due)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Paid</span>
                      <span className="text-gray-900">
                        {formatCurrency(paymentData.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">This Payment</span>
                      <span className="text-green-600 font-medium">
                        -{formatCurrency(paymentData.amount_paid)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">
                          Remaining Balance
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(paymentData.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                {paymentData.balance > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-yellow-500 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-yellow-800 text-sm">
                          Outstanding Balance
                        </p>
                        <p className="text-yellow-700 text-sm">
                          You have a remaining balance of{" "}
                          {formatCurrency(paymentData.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {paymentData.balance === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 text-green-500 mt-0.5">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-green-800 text-sm">
                          Account Fully Paid
                        </p>
                        <p className="text-green-700 text-sm">
                          Your rental account is now up to date. Thank you for
                          your payment!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">
                Need help? Contact your property manager
              </p>
              <p className="text-xs text-gray-400">
                Receipt generated on{" "}
                {receiptMeta
                  ? formatDate(receiptMeta.created_at)
                  : new Date().toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-8 no-print"></div>
      </div>
    </>
  );
}
