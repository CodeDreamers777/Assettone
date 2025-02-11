"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface LeaseData {
  lease_id: string;
  signing_token: string;
  tenant: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  unit: {
    number: string;
    type: string;
    floor: string;
    size: string;
  };
  property: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  lease_terms: {
    start_date: string;
    end_date: string;
    monthly_rent: string;
    security_deposit: string;
    payment_period: string;
  };
}

const LEASE_CLAUSES = [
  {
    title: "1. Term of Lease",
    content:
      "The lease term begins on the start date and ends on the end date specified above. This lease cannot be terminated before the end date unless agreed upon in writing by both parties.",
  },
  {
    title: "2. Rent Payment",
    content:
      "Tenant agrees to pay the monthly rent on or before the first day of each month. Late payments may incur additional fees as specified in the payment terms.",
  },
  {
    title: "3. Security Deposit",
    content:
      "The security deposit will be held in accordance with state law and returned within 30 days of move-out, less any deductions for damages or unpaid rent.",
  },
  {
    title: "4. Utilities",
    content:
      "Tenant is responsible for all utility payments including electricity, water, gas, and internet unless otherwise specified in writing.",
  },
  {
    title: "5. Maintenance and Repairs",
    content:
      "Tenant must maintain the unit in good condition and report any necessary repairs promptly. Landlord will handle all major repairs not caused by tenant negligence.",
  },
  {
    title: "6. Property Use",
    content:
      "The property shall be used as a residential dwelling only. Any business use must be approved in writing by the landlord.",
  },
  {
    title: "7. Occupancy",
    content:
      "Only those listed on the lease may occupy the unit. Guests staying longer than 14 days require landlord approval.",
  },
  {
    title: "8. Pets",
    content:
      "No pets are allowed without explicit written permission from the landlord and additional pet deposits if required.",
  },
  {
    title: "9. Alterations",
    content:
      "No alterations, additions, or improvements shall be made to the property without prior written consent from the landlord.",
  },
  {
    title: "10. Insurance",
    content:
      "Tenant is required to maintain renter's insurance throughout the lease term and provide proof of coverage to landlord.",
  },
];

const LeaseSigning: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningComplete, setIsSigningComplete] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  // Get access token from localStorage
  const getAccessToken = () => {
    return localStorage.getItem("accessToken");
  };

  // Create axios instance with authorization header
  const createAuthorizedRequest = () => {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }
    return axios.create({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const encodedData = params.get("data");
      if (encodedData) {
        const decodedData = JSON.parse(atob(encodedData));
        setLeaseData(decodedData);
      }
    } catch (err) {
      setError("Invalid lease data");
      console.error(err);
    }
  }, [location]);

  const handleDownloadPDF = async () => {
    try {
      const authorizedAxios = createAuthorizedRequest();
      const response = await authorizedAxios.get(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${leaseData?.lease_id}/download_pdf/`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `lease_${leaseData?.lease_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.message === "No access token found") {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in to download the PDF",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to download PDF",
        });
      }
      console.error(err);
    }
  };

  const handleSignature = async () => {
    if (!hasAcknowledged) {
      setError("Please acknowledge all lease terms before signing");
      return;
    }

    if (!sigPadRef.current?.isEmpty()) {
      setIsSubmitting(true);
      try {
        const signatureDataUrl = sigPadRef.current
          .getTrimmedCanvas()
          .toDataURL("image/png");
        const signatureBlob = await (await fetch(signatureDataUrl)).blob();
        const signatureFile = new File([signatureBlob], "signature.png", {
          type: "image/png",
        });

        const formData = new FormData();
        formData.append("signature", signatureFile);
        formData.append("signing_token", leaseData?.signing_token || "");

        const authorizedAxios = createAuthorizedRequest();
        const response = await authorizedAxios.post(
          `https://assettoneestates.pythonanywhere.com/api/v1/leases/${leaseData?.lease_id}/complete_signing/`,
          formData,
          {
            headers: {
              ...authorizedAxios.defaults.headers,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        // Check if the response contains a success message
        if (response.data && response.data.message) {
          setIsSigningComplete(true);
          setError(null); // Clear any previous errors
          toast({
            title: "Success!",
            description:
              "Lease signed successfully! A copy has been sent to your email.",
            action: (
              <ToastAction altText="Download PDF" onClick={handleDownloadPDF}>
                Download PDF
              </ToastAction>
            ),
          });

          // Delay redirect to allow toast to be visible
          setTimeout(() => {
            window.location.href = "/login";
          }, 3000);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (err) {
        const errorMessage =
          err.message === "No access token found"
            ? "Please log in to sign the lease"
            : "Failed to submit signature";

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError("Please provide a signature");
    }
  };

  if (!leaseData) {
    return <div className="p-6">Loading lease details...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 py-6 px-8">
          <h1 className="text-3xl font-bold text-white">Lease Agreement</h1>
        </div>

        <div className="p-8 space-y-8">
          {/* Property Details */}
          <section className="bg-green-50 rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800 border-b border-green-200 pb-2">
              Property Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="font-semibold text-lg text-green-700">
                  {leaseData?.property.name}
                </p>
                <p className="text-green-600">{leaseData?.property.address}</p>
                <p className="text-green-600">
                  {leaseData?.property.city}, {leaseData?.property.state}
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold text-green-700">Unit:</span>{" "}
                  <span className="text-green-600">
                    {leaseData?.unit.number}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-green-700">Type:</span>{" "}
                  <span className="text-green-600">{leaseData?.unit.type}</span>
                </p>
                <p>
                  <span className="font-semibold text-green-700">Size:</span>{" "}
                  <span className="text-green-600">{leaseData?.unit.size}</span>
                </p>
              </div>
            </div>
          </section>

          {/* Lease Terms */}
          <section className="bg-green-50 rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800 border-b border-green-200 pb-2">
              Lease Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p>
                  <span className="font-semibold text-green-700">
                    Start Date:
                  </span>{" "}
                  <span className="text-green-600">
                    {leaseData &&
                      new Date(
                        leaseData.lease_terms.start_date,
                      ).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-green-700">
                    End Date:
                  </span>{" "}
                  <span className="text-green-600">
                    {leaseData &&
                      new Date(
                        leaseData.lease_terms.end_date,
                      ).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold text-green-700">
                    Monthly Rent:
                  </span>{" "}
                  <span className="text-green-600">
                    ${leaseData?.lease_terms.monthly_rent}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-green-700">
                    Security Deposit:
                  </span>{" "}
                  <span className="text-green-600">
                    ${leaseData?.lease_terms.security_deposit}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-green-700">
                    Payment Period:
                  </span>{" "}
                  <span className="text-green-600">
                    {leaseData?.lease_terms.payment_period}
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Lease Clauses */}
          <section className="bg-green-50 rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800 border-b border-green-200 pb-2">
              Lease Terms and Conditions
            </h2>
            <div className="space-y-6">
              {LEASE_CLAUSES.map((clause, index) => (
                <div
                  key={index}
                  className="border-b border-green-200 pb-4 last:border-b-0"
                >
                  <h3 className="font-semibold text-lg text-green-700 mb-2">
                    {clause.title}
                  </h3>
                  <p className="text-green-600 leading-relaxed">
                    {clause.content}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-green-50 rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-md">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-600 rounded border-green-300 focus:ring-green-500"
              />
              <span className="text-green-700">
                I have read and agree to all terms and conditions in this lease
                agreement
              </span>
            </label>
          </section>

          {/* Signature Section */}
          <section className="bg-green-50 rounded-lg p-6 transition-all duration-300 ease-in-out hover:shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">
              Sign Lease Agreement
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4 border border-red-200">
                {error}
              </div>
            )}

            <div className="border-2 border-green-300 rounded-md mb-4 bg-white">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  className: "w-full h-64",
                }}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => sigPadRef.current?.clear()}
                className="bg-green-100 hover:bg-green-200 text-green-800 px-6 py-2 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Clear Signature
              </button>
              <button
                onClick={handleSignature}
                disabled={isSubmitting || !hasAcknowledged}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-md disabled:bg-green-300 disabled:cursor-not-allowed transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {isSubmitting ? "Submitting..." : "Sign Lease"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LeaseSigning;
