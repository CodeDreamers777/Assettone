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
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";

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
  const formatCurrency = (value: number) => `KSh ${value.toLocaleString()}`;

  const paymentData = [
    { name: "Paid", value: metrics.rent_paid, color: "#4CAF50" },
    { name: "Remaining", value: metrics.remaining_rent, color: "#EF4444" },
  ];

  const maintenanceData = [
    {
      name: "Pending",
      value: metrics.maintenance_requests.pending,
      color: "#F59E0B",
    },
    {
      name: "In Progress",
      value: metrics.maintenance_requests.in_progress,
      color: "#3B82F6",
    },
    {
      name: "Completed",
      value:
        metrics.maintenance_requests.total -
        metrics.maintenance_requests.pending -
        metrics.maintenance_requests.in_progress,
      color: "#4CAF50",
    },
  ];

  return (
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-800">
            Tenant Dashboard
          </h2>
          <p className="text-sm text-green-600">
            {new Date().toLocaleDateString()}
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium"
        >
          Tenant View
        </Badge>
      </div>

      {/* Rent Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Rent
            </CardTitle>
            <span className="text-green-600 font-semibold">KSh</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(metrics.total_rent)}
            </div>
            <p className="text-xs text-green-600 mt-1">Monthly rent amount</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Paid Amount
            </CardTitle>
            <span className="text-green-600 font-semibold">KSh</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(metrics.rent_paid)}
            </div>
            <p className="text-xs text-green-600 mt-1">Current period</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Remaining Balance
            </CardTitle>
            <span className="text-red-500 font-semibold">KSh</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.remaining_rent)}
            </div>
            <p className="text-xs text-amber-600 mt-1">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">
              Active Leases
            </CardTitle>
            <Home className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">
              {metrics.active_leases}
            </div>
            <p className="text-xs text-teal-600 mt-1">Current active leases</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress and Maintenance Requests */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Payment Progress */}
        <Card className="shadow-sm">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <CardTitle className="text-lg text-green-800">
              Payment Progress
            </CardTitle>
            <CardDescription className="text-green-700">
              Your current payment status
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mt-2 space-y-2">
              <Progress
                value={rentProgress}
                className="h-2"
                style={{ background: "#FFCDD2" }}
              />
              <div className="text-sm text-green-700">
                {rentProgress.toFixed(1)}% paid of total rent
              </div>
            </div>
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                  <XAxis dataKey="name" stroke="#2E7D32" />
                  <YAxis stroke="#2E7D32" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F1F8E9",
                      borderColor: "#AED581",
                    }}
                    formatter={(value) => [
                      `KSh ${Number(value).toLocaleString()}`,
                      "Amount",
                    ]}
                  />
                  <Bar dataKey="value" name="Amount">
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Requests */}
        <Card className="shadow-sm">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <CardTitle className="text-lg text-green-800">
              Maintenance Requests
            </CardTitle>
            <CardDescription className="text-green-700">
              Overview of your maintenance tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mt-6 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                  <XAxis dataKey="name" stroke="#2E7D32" />
                  <YAxis stroke="#2E7D32" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F1F8E9",
                      borderColor: "#AED581",
                    }}
                  />
                  <Bar dataKey="value" name="Tickets">
                    {maintenanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-white rounded-lg border border-green-100">
                <div className="text-lg font-bold text-green-800">
                  {metrics.maintenance_requests.total}
                </div>
                <div className="text-xs text-green-600">Total Requests</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-green-100">
                <div className="text-lg font-bold text-amber-600">
                  {metrics.maintenance_requests.pending}
                </div>
                <div className="text-xs text-amber-600">Pending</div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-green-100">
                <div className="text-lg font-bold text-blue-600">
                  {metrics.maintenance_requests.in_progress}
                </div>
                <div className="text-xs text-blue-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Periods */}
      <Card className="shadow-sm">
        <CardHeader className="bg-green-100 rounded-t-lg">
          <CardTitle className="text-lg text-green-800">
            Payment Periods
          </CardTitle>
          <CardDescription className="text-green-700">
            History of your payment periods
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-800">
                {metrics.payment_status.total_periods}
              </div>
              <div className="text-sm text-green-600">Total Periods</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-600">
                {metrics.payment_status.paid_periods}
              </div>
              <div className="text-sm text-green-600">Paid</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-red-600">
                {metrics.payment_status.unpaid_periods}
              </div>
              <div className="text-sm text-amber-600">Unpaid</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
