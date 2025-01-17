"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface OccupancyChartProps {
  metrics: {
    occupied_units: number;
    vacant_units: number;
    occupancy_rate: number;
  };
}

const COLORS = ["#0088FE", "#00C49F"];

export function OccupancyChart({ metrics }: OccupancyChartProps) {
  const data = [
    { name: "Occupied", value: metrics.occupied_units },
    { name: "Vacant", value: metrics.vacant_units },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-center text-2xl font-bold">
          Occupancy Rate: {metrics.occupancy_rate.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}
