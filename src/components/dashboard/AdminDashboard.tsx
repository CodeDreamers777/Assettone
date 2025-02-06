"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building, Home, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminDashboardProps {
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

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [showFinancials, setShowFinancials] = useState(true);
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const toggleFinancialsVisibility = () => {
    setShowFinancials(!showFinancials);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          {new Date(data.date_range.start_date).toLocaleDateString()} -{" "}
          {new Date(data.date_range.end_date).toLocaleDateString()}
        </p>
      </div>

      {/* Property and Occupancy Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Properties
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.property_metrics.total_properties}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.occupancy_metrics.total_units}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupied Units
            </CardTitle>
            <Home className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.occupancy_metrics.occupied_units}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
            <Home className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.occupancy_metrics.vacant_units}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>
              Key financial metrics for the current period
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFinancialsVisibility}
            aria-label={
              showFinancials
                ? "Hide financial details"
                : "Show financial details"
            }
          >
            {showFinancials ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={
            showFinancials ? "" : "blur-sm transition-all duration-300"
          }
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Expected Rent
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(data.financial_metrics.expected_rent)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Rent Collected
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.financial_metrics.rent_collected)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Maintenance Expenses
              </p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.financial_metrics.maintenance_expenses)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Net Income
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.financial_metrics.net_income)}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Rent Collection Rate</p>
              <p className="text-sm font-medium">
                {data.financial_metrics.rent_collection_rate.toFixed(2)}%
              </p>
            </div>
            <Progress
              value={data.financial_metrics.rent_collection_rate}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Occupancy and Maintenance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Rate</CardTitle>
            <CardDescription>Current occupancy status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-3xl font-bold">
                  {data.occupancy_metrics.occupancy_rate.toFixed(1)}%
                </p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Occupied",
                        value: data.occupancy_metrics.occupied_units,
                        fill: "#22C55E",
                      },
                      {
                        name: "Vacant",
                        value: data.occupancy_metrics.vacant_units,
                        fill: "#EF4444",
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="60%"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>Overview of maintenance tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Total Requests</p>
                    <p className="text-sm font-medium">
                      {data.maintenance_metrics.total_requests}
                    </p>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-sm font-medium">
                      {data.maintenance_metrics.pending_requests}
                    </p>
                  </div>
                  <Progress
                    value={
                      (data.maintenance_metrics.pending_requests /
                        data.maintenance_metrics.total_requests) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">In Progress</p>
                    <p className="text-sm font-medium">
                      {data.maintenance_metrics.in_progress_requests}
                    </p>
                  </div>
                  <Progress
                    value={
                      (data.maintenance_metrics.in_progress_requests /
                        data.maintenance_metrics.total_requests) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Financial performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rent_collected"
                  name="Rent Collected"
                  stroke="#22C55E"
                />
                <Line
                  type="monotone"
                  dataKey="maintenance_cost"
                  name="Maintenance Cost"
                  stroke="#EF4444"
                />
                <Line
                  type="monotone"
                  dataKey="net_income"
                  name="Net Income"
                  stroke="#3B82F6"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
