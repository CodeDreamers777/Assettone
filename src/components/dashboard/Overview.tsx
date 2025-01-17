"use client";

import React, { useEffect, useState } from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { PropertyMetrics } from "./property-metrics";
import { OccupancyChart } from "./occupancy-chart";
import { FinancialMetrics } from "./financial-metrics";
import { MaintenanceMetrics } from "./maintenance-metrics";
import { MonthlyTrends } from "./monthly-trends";
import { DateRangePicker } from "./date-range-picker";
import { fetchDashboardMetrics } from "@/lib/api";
import { DashboardData } from "@/types/dashboard";
import { Loader2 } from "lucide-react";

export function Overview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchDashboardMetrics();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Failed to load dashboard data</div>;
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your rental properties."
      />
      <DateRangePicker
        startDate={dashboardData.date_range.start_date}
        endDate={dashboardData.date_range.end_date}
      />
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <PropertyMetrics metrics={dashboardData.property_metrics} />
          <FinancialMetrics metrics={dashboardData.financial_metrics} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <OccupancyChart metrics={dashboardData.occupancy_metrics} />
          <MaintenanceMetrics metrics={dashboardData.maintenance_metrics} />
        </div>
        <MonthlyTrends trends={dashboardData.monthly_trends} />
      </div>
    </DashboardShell>
  );
}
