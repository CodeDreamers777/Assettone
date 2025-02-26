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
  Cell,
  Legend,
} from "recharts";
import {
  Building,
  Home,
  Eye,
  EyeOff,
  DollarSign,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminDashboardProps {
  data: {
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
    date_range: {
      start_date: string;
      end_date: string;
    };
  };
}

const COLORS = ["#8BC34A", "#4CAF50", "#009688", "#00796B", "#00695C"];

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [showFinancials, setShowFinancials] = useState(true);
  const formatCurrency = (value: number) => `KES ${value.toLocaleString()}`;

  const toggleFinancialsVisibility = () => {
    setShowFinancials(!showFinancials);
  };

  // Format expense data for charts
  const expenseData = data.expense_metrics.expense_categories.map(
    (category, index) => ({
      name: category.category_name,
      value: category.amount,
      fill: COLORS[index % COLORS.length],
    }),
  );

  return (
    <div className="space-y-6 bg-green-50 p-6 rounded-lg">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-green-800">
            Property Management Dashboard
          </h2>
          <p className="text-sm text-green-600">
            {new Date(data.date_range.start_date).toLocaleDateString()} -{" "}
            {new Date(data.date_range.end_date).toLocaleDateString()}
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 px-3 py-1 text-sm font-medium"
        >
          Admin View
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Properties
            </CardTitle>
            <Building className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {data.property_metrics.total_properties}
            </div>
            <p className="text-xs text-green-600 mt-1">
              Managing {data.occupancy_metrics.total_units} units
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Occupancy Rate
            </CardTitle>
            <Home className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {data.occupancy_metrics.occupancy_rate.toFixed(1)}%
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-green-600">
                {data.occupancy_metrics.occupied_units} occupied
              </span>
              <span className="text-red-500">
                {data.occupancy_metrics.vacant_units} vacant
              </span>
            </div>
            <Progress
              value={data.occupancy_metrics.occupancy_rate}
              className="h-2 mt-2"
              style={{ background: "#FFCDD2" }}
            />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              Rent Collection
            </CardTitle>
            <DollarSign className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {data.financial_metrics.rent_collection_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {formatCurrency(data.financial_metrics.rent_collected)} of{" "}
              {formatCurrency(data.financial_metrics.expected_rent)}
            </p>
            <Progress
              value={data.financial_metrics.rent_collection_rate}
              className="h-2 mt-2"
              style={{ background: "#FFE0B2" }}
            />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">
              Net Income
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-900">
              {formatCurrency(data.financial_metrics.net_income)}
            </div>
            <p className="text-xs text-teal-600 mt-1">
              After {formatCurrency(data.expense_metrics.total_expenses)} in
              expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-green-100 rounded-t-lg">
          <div>
            <CardTitle className="text-lg text-green-800">
              Financial Overview
            </CardTitle>
            <CardDescription className="text-green-700">
              Key financial metrics for the current period
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFinancialsVisibility}
            className="bg-white hover:bg-green-50 border-green-200"
            aria-label={
              showFinancials
                ? "Hide financial details"
                : "Show financial details"
            }
          >
            {showFinancials ? (
              <EyeOff className="h-4 w-4 text-green-700" />
            ) : (
              <Eye className="h-4 w-4 text-green-700" />
            )}
          </Button>
        </CardHeader>
        <CardContent
          className={`p-6 ${
            showFinancials ? "" : "blur-sm transition-all duration-300"
          }`}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 bg-green-50">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="data-[state=active]:bg-green-200 data-[state=active]:text-green-800"
              >
                Expenses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">
                      Expected Rent
                    </p>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(data.financial_metrics.expected_rent)}
                  </p>
                </div>

                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">
                      Rent Collected
                    </p>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(data.financial_metrics.rent_collected)}
                  </p>
                </div>

                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">
                      Total Expenses
                    </p>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(data.expense_metrics.total_expenses)}
                  </p>
                </div>

                <div className="space-y-2 bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-800">
                      Net Income
                    </p>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(data.financial_metrics.net_income)}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="expenses">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-800">
                    Expense Breakdown
                  </h3>
                  <div className="grid gap-2">
                    {data.expense_metrics.expense_categories.map(
                      (category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            <span className="text-sm font-medium">
                              {category.category_name}
                            </span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        Tax Deductible
                      </span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(
                          data.expense_metrics.tax_deductible_expenses,
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        Non-Deductible
                      </span>
                      <span className="font-semibold text-green-700">
                        {formatCurrency(
                          data.expense_metrics.non_tax_deductible_expenses,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="aspect-square bg-white p-4 rounded-lg border border-green-100">
                  <h3 className="font-semibold text-center text-green-800 mb-2">
                    Expense Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Occupancy and Maintenance Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <CardTitle className="text-lg text-green-800">
              Occupancy Status
            </CardTitle>
            <CardDescription className="text-green-700">
              Current occupancy distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="aspect-square relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <p className="text-4xl font-bold text-green-800">
                  {data.occupancy_metrics.occupancy_rate.toFixed(1)}%
                </p>
                <p className="text-sm text-green-600">Occupancy Rate</p>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Occupied",
                        value: data.occupancy_metrics.occupied_units,
                        fill: "#4CAF50",
                      },
                      {
                        name: "Vacant",
                        value: data.occupancy_metrics.vacant_units,
                        fill: "#EF5350",
                      },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="60%"
                    label={({ name, value }) => `${name}: ${value}`}
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 px-6">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">
                  Occupied: {data.occupancy_metrics.occupied_units} units
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                <span className="text-sm">
                  Vacant: {data.occupancy_metrics.vacant_units} units
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-green-100 rounded-t-lg">
            <CardTitle className="text-lg text-green-800">
              Maintenance Requests
            </CardTitle>
            <CardDescription className="text-green-700">
              Status of maintenance tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-green-800">
                    Total Requests
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700"
                  >
                    {data.maintenance_metrics.total_requests}
                  </Badge>
                </div>
                <Progress value={100} className="h-2 bg-green-100" />
              </div>

              <div className="p-4 bg-white rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-amber-800">Pending</p>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700"
                  >
                    {data.maintenance_metrics.pending_requests}
                  </Badge>
                </div>
                <Progress
                  value={
                    (data.maintenance_metrics.pending_requests /
                      data.maintenance_metrics.total_requests) *
                    100
                  }
                  className="h-2 bg-amber-100"
                  style={
                    {
                      "--tw-progress-bar-color": "#F59E0B",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="p-4 bg-white rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-blue-800">
                    In Progress
                  </p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {data.maintenance_metrics.in_progress_requests}
                  </Badge>
                </div>
                <Progress
                  value={
                    (data.maintenance_metrics.in_progress_requests /
                      data.maintenance_metrics.total_requests) *
                    100
                  }
                  className="h-2 bg-blue-100"
                  style={
                    {
                      "--tw-progress-bar-color": "#3B82F6",
                    } as React.CSSProperties
                  }
                />
              </div>

              <div className="mt-6 text-center">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Manage Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card className="shadow-sm">
        <CardHeader className="bg-green-100 rounded-t-lg">
          <CardTitle className="text-lg text-green-800">
            Monthly Trends
          </CardTitle>
          <CardDescription className="text-green-700">
            Financial performance over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.monthly_trends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8F5E9" />
                <XAxis dataKey="month" stroke="#2E7D32" />
                <YAxis stroke="#2E7D32" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F1F8E9",
                    borderColor: "#AED581",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  type="monotone"
                  dataKey="rent_collected"
                  name="Rent Collected"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_expenses"
                  name="Total Expenses"
                  stroke="#F44336"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="net_income"
                  name="Net Income"
                  stroke="#2196F3"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
