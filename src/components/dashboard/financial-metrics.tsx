import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
} from "lucide-react";

interface FinancialMetricsProps {
  metrics: {
    expected_rent: number;
    rent_collected: number;
    rent_collection_rate: number;
    maintenance_expenses: number;
    net_income: number;
  };
}

export function FinancialMetrics({ metrics }: FinancialMetricsProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Financial Overview</CardTitle>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 rounded-full hover:bg-gray-100"
          aria-label="Toggle visibility"
        >
          {isVisible ? (
            <Eye className="h-5 w-5 text-gray-600" />
          ) : (
            <EyeOff className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 border-0">
            <CardContent className="p-6">
              <div
                className={`flex flex-col space-y-2 transition-all duration-200 ${!isVisible ? "blur-md select-none" : ""}`}
              >
                <p className="text-sm font-medium text-white/90">
                  Rent Collection
                </p>
                <h3 className="text-4xl font-bold text-white">
                  ${metrics.rent_collected.toLocaleString()}
                </h3>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-white/90" />
                  <p className="text-sm text-white/90">
                    {metrics.rent_collection_rate.toFixed(1)}% of expected $
                    {metrics.expected_rent.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-r from-purple-500 via-purple-400 to-purple-300 border-0">
            <CardContent className="p-6">
              <div
                className={`flex flex-col space-y-2 transition-all duration-200 ${!isVisible ? "blur-md select-none" : ""}`}
              >
                <p className="text-sm font-medium text-white/90">Net Income</p>
                <h3 className="text-4xl font-bold text-white">
                  ${metrics.net_income.toLocaleString()}
                </h3>
                <div className="flex items-center space-x-2">
                  {metrics.net_income >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-white/90" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-white/90" />
                  )}
                  <p className="text-sm text-white/90">
                    After ${metrics.maintenance_expenses.toLocaleString()} in
                    expenses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialMetrics;
