import React from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";

export function Leases() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Leases" text="Manage your property leases." />
      {/* Add lease management content here */}
    </DashboardShell>
  );
}
