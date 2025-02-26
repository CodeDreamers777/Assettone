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

// Updated to exactly match what AdminDashboard expects
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
  financial_metrics: {
    expected_rent: number;
    rent_collected: number;
    rent_collection_rate: number;
    maintenance_expenses: number;
    total_expenses: number;
    expenses_by_category: Array<{
      category: string;
      category_name: string;
      amount: number;
    }>;
    net_income: number;
  };
  maintenance_metrics: {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
  };
  // Make this required, not optional
  expense_metrics: {
    total_expenses: number;
    expense_categories: Array<{
      category: string;
      category_name: string;
      amount: number;
    }>;
    tax_deductible_expenses: number;
    non_tax_deductible_expenses: number;
  };
  monthly_trends: Array<{
    month: string;
    rent_collected: number;
    maintenance_cost: number;
    expense_amount: number;
    total_expenses: number;
    net_income: number;
  }>;
}

// This type represents what might come from the API
interface ApiResponse {
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
  expenses_data?: any;
  expense_metrics?: any;
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
        const apiData: ApiResponse = await fetchDashboardMetrics();

        // Create a proper expense_metrics object, regardless of API structure
        const expenseMetrics = {
          total_expenses:
            apiData.expense_metrics?.total_expenses ||
            apiData.expenses_data?.total_expenses ||
            0,
          expense_categories:
            apiData.expense_metrics?.expense_categories ||
            apiData.expenses_data?.expense_categories ||
            [],
          tax_deductible_expenses:
            apiData.expense_metrics?.tax_deductible_expenses ||
            apiData.expenses_data?.tax_deductible_expenses ||
            0,
          non_tax_deductible_expenses:
            apiData.expense_metrics?.non_tax_deductible_expenses ||
            apiData.expenses_data?.non_tax_deductible_expenses ||
            0,
        };

        // Construct a properly typed DashboardData object
        const transformedData: DashboardData = {
          date_range: apiData.date_range,
          tenant_metrics: apiData.tenant_metrics,
          property_metrics: apiData.property_metrics,
          occupancy_metrics: apiData.occupancy_metrics,
          financial_metrics: apiData.financial_metrics,
          maintenance_metrics: apiData.maintenance_metrics,
          monthly_trends: apiData.monthly_trends,
          expense_metrics: expenseMetrics,
        };

        setDashboardData(transformedData);
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
