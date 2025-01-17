import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

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
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Rent Collection
            </p>
            <h3 className="text-4xl font-bold text-primary">
              ${metrics.rent_collected.toLocaleString()}
            </h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {metrics.rent_collection_rate.toFixed(1)}% of expected $
                {metrics.expected_rent.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Net Income
            </p>
            <h3 className="text-4xl font-bold text-primary">
              ${metrics.net_income.toLocaleString()}
            </h3>
            <div className="flex items-center space-x-2">
              {metrics.net_income >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <p className="text-sm text-muted-foreground">
                After ${metrics.maintenance_expenses.toLocaleString()} in
                expenses
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
