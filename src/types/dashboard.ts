export interface DashboardData {
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
    net_income: number;
  };
  maintenance_metrics: {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
  };
  monthly_trends: Array<{
    month: string;
    rent_collected: number;
    maintenance_cost: number;
    net_income: number;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
}
