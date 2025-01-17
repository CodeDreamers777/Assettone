import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Home } from "lucide-react";

interface PropertyMetricsProps {
  metrics: {
    total_properties: number;
    total_units: number;
  };
}

export function PropertyMetrics({ metrics }: PropertyMetricsProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Property Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/20 p-3">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Properties
              </p>
              <h3 className="text-3xl font-bold">{metrics.total_properties}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-primary/20 p-3">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Units
              </p>
              <h3 className="text-3xl font-bold">{metrics.total_units}</h3>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
