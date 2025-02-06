"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Home, Calendar } from "lucide-react";

interface TenantMetricsProps {
  metrics: {
    total_rent: number;
    rent_paid: number;
    remaining_rent: number;
    active_leases: number;
    maintenance_requests: {
      total: number;
      pending: number;
      in_progress: number;
    };
    payment_status: {
      total_periods: number;
      paid_periods: number;
      unpaid_periods: number;
    };
  };
}

export function TenantMetrics({ metrics }: TenantMetricsProps) {
  const rentProgress = (metrics.rent_paid / metrics.total_rent) * 100;

  const paymentData = [
    { name: "Paid", value: metrics.rent_paid, color: "#22C55E" },
    { name: "Remaining", value: metrics.remaining_rent, color: "#EF4444" },
  ];

  const maintenanceData = [
    {
      name: "Pending",
      value: metrics.maintenance_requests.pending,
      color: "#FCD34D",
    },
    {
      name: "In Progress",
      value: metrics.maintenance_requests.in_progress,
      color: "#60A5FA",
    },
    {
      name: "Completed",
      value:
        metrics.maintenance_requests.total -
        metrics.maintenance_requests.pending -
        metrics.maintenance_requests.in_progress,
      color: "#34D399",
    },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold tracking-tight">Tenant Dashboard</h2>

      {/* Rent Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.total_rent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Monthly rent amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.rent_paid.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Current period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remaining Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${metrics.remaining_rent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_leases}</div>
            <p className="text-xs text-muted-foreground">
              Current active leases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress and Maintenance Requests */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Progress */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Payment Progress</CardTitle>
            <CardDescription>Your current payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2 space-y-2">
              <Progress value={rentProgress} className="h-2" />
              <div className="text-sm text-muted-foreground">
                {rentProgress.toFixed(1)}% paid of total rent
              </div>
            </div>
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={paymentData[0].color} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Maintenance Requests</CardTitle>
            <CardDescription>
              Overview of your maintenance tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={maintenanceData[0].color} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-lg font-bold">
                  {metrics.maintenance_requests.total}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Requests
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-yellow-600">
                  {metrics.maintenance_requests.pending}
                </div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-blue-600">
                  {metrics.maintenance_requests.in_progress}
                </div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Periods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Payment Periods</CardTitle>
            <CardDescription>History of your payment periods</CardDescription>
          </div>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {metrics.payment_status.total_periods}
              </div>
              <div className="text-sm text-muted-foreground">Total Periods</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {metrics.payment_status.paid_periods}
              </div>
              <div className="text-sm text-muted-foreground">Paid</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {metrics.payment_status.unpaid_periods}
              </div>
              <div className="text-sm text-muted-foreground">Unpaid</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
