"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { DateRangePicker } from "./date-range-picker";
import { TenantMetrics } from "./TenantMetrics";
import { AdminDashboard } from "./AdminDashboard";
import { fetchDashboardMetrics } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface DateRange {
  start_date: string;
  end_date: string;
}

interface DashboardData {
  date_range: DateRange;
  tenant_metrics?: any;
  property_metrics: {
    total_properties: number;
    total_units: number;
  };
  occupancy_metrics: {
    total_units: number;
    occupied_units: number;
    vacant_units: number;
    occupancy_rate: number;
  };
  financial_metrics: any;
  maintenance_metrics: any;
  monthly_trends: any[];
}

export function Overview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const lastSession = localStorage.getItem("lastSession");
    if (lastSession) {
      try {
        const lastSessionDate = new Date(lastSession);
        toast({
          title: "Last Login",
          description: `You last logged in on: ${lastSessionDate.toLocaleString()}`,
        });
      } catch (error) {
        console.error("Error parsing last session date:", error);
      }
    }

    const fetchData = async () => {
      try {
        const data = await fetchDashboardMetrics();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
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

  const isTenant = !!dashboardData.tenant_metrics;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text={
          isTenant
            ? "Welcome back! Here's an overview of your rental status."
            : "Welcome back! Here's an overview of your rental properties."
        }
      />
      {dashboardData.date_range && (
        <div className="relative mb-6">
          <DateRangePicker
            startDate={dashboardData.date_range.start_date}
            endDate={dashboardData.date_range.end_date}
          />
        </div>
      )}
      {isTenant ? (
        <TenantMetrics metrics={dashboardData.tenant_metrics} />
      ) : (
        <AdminDashboard data={dashboardData} />
      )}
    </DashboardShell>
  );
}
