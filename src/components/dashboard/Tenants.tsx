import React from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";

export function Tenants() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tenants"
        text="Manage your tenants and their information."
      />
      {/* Add tenant management content here */}
    </DashboardShell>
  );
}
