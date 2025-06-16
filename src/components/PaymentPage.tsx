import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// Define the PaymentInfo interface
interface PaymentInfo {
  property_name: string;
  unit_number: string;
  tenant_name: string;
  monthly_rent: number;
  amount_paid: number;
  current_balance: number;
}

// Define payment type
type PaymentType = "full" | "partial";

const PaymentPage: React.FC = () => {
  // Get paymentId from URL params
  const { paymentId } = useParams<{ paymentId: string }>();

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Backend base URL
  const API_BASE_URL =
    "https://assettone-rental-management.onrender.com/api/v1";

  useEffect(() => {
    if (paymentId) {
      fetchPaymentInfo();
    }
  }, [paymentId]);

  const fetchPaymentInfo = async (): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/get_payment_info/`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch payment information");
      }
      const data: PaymentInfo = await response.json();
      setPaymentInfo(data);
      setPaymentAmount(data.current_balance.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // If it starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.slice(1);
    }

    // If it starts with +254, remove the +
    if (cleaned.startsWith("254")) {
      return cleaned;
    }

    // If it's just 9 digits, assume it's missing the country code
    if (cleaned.length === 9) {
      return "254" + cleaned;
    }

    return cleaned;
  };

  const handlePayment = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      setError("Please enter your M-Pesa number");
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (
      !paymentInfo ||
      parseFloat(paymentAmount) > paymentInfo.current_balance
    ) {
      setError("Payment amount cannot exceed the outstanding balance");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const response = await fetch(
        `${API_BASE_URL}/payments/${paymentId}/process_payment/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: formattedPhone,
            amount: parseFloat(paymentAmount),
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // In a real app, you'd redirect to success page
        // setTimeout(() => window.location.href = '/payment-success', 3000);
      } else {
        setError(data.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentTypeChange = (type: PaymentType): void => {
    setPaymentType(type);
    if (type === "full" && paymentInfo) {
      setPaymentAmount(paymentInfo.current_balance.toString());
    } else {
      setPaymentAmount("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">
            Loading payment information...
          </p>
        </div>
      </div>
    );
  }

  if (error && !paymentInfo) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Payment Link Error
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Payment Initiated!
            </h2>
            <p className="text-gray-600 mb-6">
              Please check your phone for the M-Pesa prompt and enter your PIN
              to complete the payment.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                <strong>Amount:</strong> KSh{" "}
                {parseFloat(paymentAmount).toLocaleString()}
              </p>
              <p className="text-sm text-green-700">
                <strong>Phone:</strong> {phoneNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return if paymentInfo is null (should not happen after loading)
  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-center text-gray-600">
            No payment information available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="bg-green-500 text-white p-6 rounded-t-lg">
          <h1 className="text-2xl font-bold text-center">Rent Payment</h1>
        </div>

        {/* Payment Information */}
        <div className="bg-white p-6 border-l border-r border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Property Details
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Property:</strong> {paymentInfo.property_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Unit:</strong> {paymentInfo.unit_number}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Tenant:</strong> {paymentInfo.tenant_name}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">
                Payment Details
              </h3>
              <p className="text-sm text-gray-700">
                <strong>Monthly Rent:</strong> KSh{" "}
                {parseFloat(
                  paymentInfo.monthly_rent.toString(),
                ).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Amount Paid:</strong> KSh{" "}
                {parseFloat(
                  paymentInfo.amount_paid.toString(),
                ).toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Outstanding:</strong>{" "}
                <span className="text-red-600 font-semibold">
                  KSh{" "}
                  {parseFloat(
                    paymentInfo.current_balance.toString(),
                  ).toLocaleString()}
                </span>
              </p>
            </div>
          </div>

          {paymentInfo.current_balance <= 0 ? (
            <div className="text-center py-8">
              <div className="text-green-500 text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Payment Complete!
              </h2>
              <p className="text-gray-600">
                Your rent is fully paid for this period.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePayment} className="space-y-6">
              {/* Phone Number Input */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07xxxxxxxx or +254xxxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your M-Pesa registered phone number
                </p>
              </div>

              {/* Payment Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange("full")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentType === "full"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Full Payment</div>
                      <div className="text-sm">
                        KSh{" "}
                        {parseFloat(
                          paymentInfo.current_balance.toString(),
                        ).toLocaleString()}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentTypeChange("partial")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      paymentType === "partial"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">Partial Payment</div>
                      <div className="text-sm">Custom Amount</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Payment Amount (KSh)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="1"
                  max={paymentInfo.current_balance}
                  step="0.01"
                  disabled={paymentType === "full"}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    paymentType === "full" ? "bg-gray-100" : ""
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum amount: KSh{" "}
                  {parseFloat(
                    paymentInfo.current_balance.toString(),
                  ).toLocaleString()}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  `Pay KSh ${paymentAmount ? parseFloat(paymentAmount).toLocaleString() : "0"}`
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-green-50 p-4 rounded-b-lg border border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">🔒 Secure payment powered by M-Pesa</p>
            <p>
              You will receive an M-Pesa prompt on your phone to complete the
              payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
