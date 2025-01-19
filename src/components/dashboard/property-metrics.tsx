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
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    Total Properties
                  </p>
                  <h3 className="text-4xl font-bold text-white">
                    {metrics.total_properties}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">
                    Total Units
                  </p>
                  <h3 className="text-4xl font-bold text-white">
                    {metrics.total_units}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

export default PropertyMetrics;
