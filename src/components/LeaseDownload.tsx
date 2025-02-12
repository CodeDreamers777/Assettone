import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const LeaseDownloadPage = () => {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication status when component mounts
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description:
          "Please log in to download your lease document. Check your email for login credentials.",
        duration: 5000,
      });

      // Short delay before redirect to ensure toast is visible
      setTimeout(() => {
        navigate("/login", {
          state: {
            returnUrl: `/lease-download/${leaseId}`,
            message:
              "Please log in to download your lease document. The login details have been sent to your email",
          },
        });
      }, 2000);
    }
  }, [leaseId, navigate, toast]);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description:
            "Please log in to download your lease document. Check your email for login credentials.",
          duration: 5000,
        });

        setTimeout(() => {
          navigate("/login", {
            state: {
              returnUrl: `/lease-download/${leaseId}`,
              message:
                "Please log in to download your lease document. The login details have been sent to your email",
            },
          });
        }, 2000);
        return;
      }

      const response = await fetch(
        `https://assettoneestates.pythonanywhere.com/api/v1/leases/${leaseId}/download_pdf/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to download lease document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lease-agreement-${leaseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      toast({
        title: "Download Started",
        description: "Your lease agreement is being downloaded.",
        duration: 3000,
      });
    } catch (err) {
      setError(
        "Unable to download the lease document. Please try again or contact support.",
      );
      toast({
        variant: "destructive",
        title: "Download Failed",
        description:
          "Unable to download the lease document. Please try again or contact support.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Download Your Lease Agreement
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Click the button below to download your signed lease document
          </p>
        </div>

        <div className="mt-8">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download Lease Agreement
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseDownloadPage;
