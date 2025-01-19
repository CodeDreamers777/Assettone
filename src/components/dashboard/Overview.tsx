"use client";
import { useEffect, useState } from "react";
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
      <div className="relative mb-6">
        <DateRangePicker
          startDate={dashboardData.date_range.start_date}
          endDate={dashboardData.date_range.end_date}
        />
      </div>

      <div className="grid gap-6">
        <div className="relative grid gap-6 md:grid-cols-2">
          <div className="relative z-10">
            <PropertyMetrics metrics={dashboardData.property_metrics} />
          </div>
          <div className="relative z-20 md:transform md:transition-transform md:hover:scale-102 md:hover:shadow-lg">
            <FinancialMetrics metrics={dashboardData.financial_metrics} />
          </div>
        </div>

        <div className="relative z-0 grid gap-6 md:grid-cols-2">
          <OccupancyChart metrics={dashboardData.occupancy_metrics} />
          <MaintenanceMetrics metrics={dashboardData.maintenance_metrics} />
        </div>

        <div className="relative z-0">
          <MonthlyTrends trends={dashboardData.monthly_trends} />
        </div>
      </div>
    </DashboardShell>
  );
}
