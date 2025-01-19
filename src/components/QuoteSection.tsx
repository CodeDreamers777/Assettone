import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

const QuoteSection = () => {
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [averageRent, setAverageRent] = useState("");
  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetQuote = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setQuote(null);

    try {
      const response = await fetch(
        "https://assettoneestates.pythonanywhere.com/api/v1/get-quote/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number_of_units: parseInt(numberOfUnits),
            average_rent: parseInt(averageRent),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch quote");
      }

      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError("An error occurred while fetching the quote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Explanation */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#38b000] leading-tight">
              Transparent Pricing for Your Property Portfolio
            </h2>

            <p className="text-lg text-gray-600">
              Our pricing is based on your property portfolio size and average
              rental income. We believe in transparent, value-based pricing that
              scales with your business.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-green-100 rounded-lg">
                  <Calculator className="w-5 h-5 text-[#38b000]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Simple Calculation
                  </h3>
                  <p className="text-gray-600">
                    Our fee is calculated as a percentage of your total rental
                    income, with rates decreasing as your portfolio grows.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-[#38b000] mb-2">
                  How it works:
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Enter your total number of rental units</li>
                  <li>• Input the average monthly rent per unit</li>
                  <li>• Get instant pricing based on your portfolio size</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Side - Quote Calculator */}
          <div>
            <Card className="shadow-lg border-green-100">
              <CardHeader className="bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-2xl text-[#38b000]">
                  Calculate Your Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleGetQuote} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="numberOfUnits"
                      className="text-sm font-medium text-gray-700"
                    >
                      Number of Units
                    </label>
                    <Input
                      id="numberOfUnits"
                      type="number"
                      value={numberOfUnits}
                      onChange={(e) => setNumberOfUnits(e.target.value)}
                      placeholder="Enter number of units"
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="averageRent"
                      className="text-sm font-medium text-gray-700"
                    >
                      Average Rent per Unit (KES)
                    </label>
                    <Input
                      id="averageRent"
                      type="number"
                      value={averageRent}
                      onChange={(e) => setAverageRent(e.target.value)}
                      placeholder="Enter average rent"
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#38b000] hover:bg-[#38b000]/90 h-12 text-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Calculating..." : "Get Your Quote"}
                  </Button>
                </form>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {quote && (
                  <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-100">
                    <h3 className="text-xl font-semibold text-[#38b000] mb-4">
                      Your Personalized Quote
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-semibold text-gray-900">
                          {quote["Total Revenue"]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-600">Percentage Rate</span>
                        <span className="font-semibold text-gray-900">
                          {quote["Percentage Rate Used"]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Monthly Fee</span>
                        <span className="font-bold text-xl text-[#38b000]">
                          {quote["Subscription Fee"]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;
