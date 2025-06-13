import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  Mail,
  Home,
  Calendar,
  Phone,
} from "lucide-react";

const LeaseSignedSuccess = () => {
  const [leaseData, setLeaseData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Get lease data from sessionStorage or URL params if available
    const savedLeaseData = sessionStorage.getItem("signedLeaseData");
    if (savedLeaseData) {
      setLeaseData(JSON.parse(savedLeaseData));
    }

    // Hide confetti after animation
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadPDF = async () => {
    if (!leaseData) return;

    try {
      const response = await fetch(
        `https://assettone-rental-management.onrender.com/api/v1/leases/${leaseData.lease_id}/download_pdf/?signing_token=${leaseData.signing_token}`,
        { method: "GET" },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `lease_${leaseData.lease_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-100 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  [
                    "bg-green-400",
                    "bg-emerald-400",
                    "bg-teal-400",
                    "bg-blue-400",
                  ][Math.floor(Math.random() * 4)]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-8 px-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-20 h-20 text-white animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Congratulations! 🎉
              </h1>
              <p className="text-green-100 text-lg">
                Your lease has been successfully signed
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Success Message */}
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Welcome to Your New Home!
                </h2>
                <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  Your lease agreement has been digitally signed and processed.
                  A copy of the signed lease has been sent to your email
                  address. You can download your copy using the button below.
                </p>
              </div>

              {/* Property Summary Card */}
              {leaseData && (
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Property Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Property
                      </p>
                      <p className="text-green-800">
                        {leaseData.property?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Unit</p>
                      <p className="text-green-800">
                        {leaseData.unit?.unit_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Monthly Rent
                      </p>
                      <p className="text-green-800">
                        KES{" "}
                        {Number(
                          leaseData.lease_terms?.monthly_rent,
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">
                        Move-in Date
                      </p>
                      <p className="text-green-800">
                        {new Date(
                          leaseData.lease_terms?.start_date,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Signed Lease
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🖨️ Print This Page
                </button>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  What Happens Next?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">
                        1
                      </span>
                    </div>
                    <p className="text-blue-700">
                      <strong>Email Confirmation:</strong> Check your email for
                      the signed lease copy and move-in instructions.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">
                        2
                      </span>
                    </div>
                    <p className="text-blue-700">
                      <strong>Payment Setup:</strong> You'll receive payment
                      instructions for your first month's rent and security
                      deposit.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">
                        3
                      </span>
                    </div>
                    <p className="text-blue-700">
                      <strong>Key Handover:</strong> Your property manager will
                      contact you to schedule key pickup and move-in
                      walkthrough.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-semibold">
                        4
                      </span>
                    </div>
                    <p className="text-blue-700">
                      <strong>Move-in Day:</strong> Complete your move-in
                      inspection and get settled into your new home!
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Need Help?
                </h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about your lease or move-in process,
                  don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="mailto:support@assettone.com"
                    className="flex items-center justify-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    support@assettone.com
                  </a>
                  <a
                    href="tel:+254716288400"
                    className="flex items-center justify-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    +254 700 000 000
                  </a>
                </div>
              </div>

              {/* Footer Message */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  Thank you for choosing us for your housing needs. We're
                  excited to have you as a tenant!
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  This page was generated on {new Date().toLocaleDateString()}{" "}
                  at {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseSignedSuccess;
