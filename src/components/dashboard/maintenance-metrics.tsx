import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle } from "lucide-react";

interface MaintenanceMetricsProps {
  metrics: {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
  };
}

export function MaintenanceMetrics({ metrics }: MaintenanceMetricsProps) {
  const completedRequests =
    metrics.total_requests -
    metrics.pending_requests -
    metrics.in_progress_requests;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 p-4">
            <Clock className="mb-2 h-8 w-8 text-yellow-500" />
            <span className="text-2xl font-bold">
              {metrics.pending_requests}
            </span>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 p-4">
            <Wrench className="mb-2 h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold">
              {metrics.in_progress_requests}
            </span>
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-primary/10 p-4">
            <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
            <span className="text-2xl font-bold">{completedRequests}</span>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
        </div>
        <div className="mt-6 text-center text-2xl font-bold">
          {metrics.total_requests} Total Requests
        </div>
      </CardContent>
    </Card>
  );
}
