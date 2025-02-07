"use client";

import type React from "react";
import { TenantReport } from "./TenantReport";
import { PropertyReport } from "./PropertyReport";
import { UnitReport } from "./UnitReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export const Reports: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
        Property Management Reports
      </h1>
      <Card className="w-full max-w-6xl mx-auto shadow-lg">
        <CardContent className="p-6">
          <Tabs defaultValue="tenant" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="tenant">Tenant Reports</TabsTrigger>
              <TabsTrigger value="property">Property Reports</TabsTrigger>
              <TabsTrigger value="unit">Unit Reports</TabsTrigger>
            </TabsList>
            <div id="report-content">
              <TabsContent value="tenant">
                <TenantReport />
              </TabsContent>
              <TabsContent value="property">
                <PropertyReport />
              </TabsContent>
              <TabsContent value="unit">
                <UnitReport />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
