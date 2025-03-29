import { DashboardData } from "../types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardData> {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    throw new Error("Access token not found");
  }

  const response = await fetch(
    "https://assettoneestates.pythonanywhere.com/api/v1/dashboard-metrics/",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    // Check if the error is due to an invalid token
    if (response.status === 401) {
      try {
        const errorData = await response.json();

        // Check if this is the token expired error pattern
        if (errorData.code === "token_not_valid") {
          // Clear the invalid token
          localStorage.removeItem("accessToken");

          // Redirect to login page
          window.location.href = "/login";

          throw new Error("Token expired, redirecting to login");
        }
      } catch (e) {
        // If parsing the JSON fails, just handle as a general error
      }
    }

    throw new Error("Failed to fetch dashboard metrics");
  }

  return response.json();
}
