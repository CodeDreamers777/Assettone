import React from "react";
import { DashboardHeader } from "./header";
import { DashboardShell } from "./shell";

export function Settings() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Settings"
        text="Manage your account and application settings."
      />
      {/* Add settings content here */}
    </DashboardShell>
  );
}
