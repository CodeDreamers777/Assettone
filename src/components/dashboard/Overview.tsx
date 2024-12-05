import React from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";
import { RecentActivities } from "./recent-activities";
import { TopProperties } from "./top-properties";
import { TenantList } from "./tenant-list";
import { QuickActions } from "./quick-actions";

export function Overview() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        text="Welcome back! Here's an overview of your rental properties."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActions />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentActivities />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <TopProperties />
        <TenantList />
      </div>
    </DashboardShell>
  );
}
