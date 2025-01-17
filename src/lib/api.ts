import { DashboardData } from "../types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardData> {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("Access token not found");
  }

  const response = await fetch(
    "http://127.0.0.1:8000/api/v1/dashboard-metrics/",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  return response.json();
}
