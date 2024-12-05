import React from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./dashboard/Sidebar";
import { Overview } from "./dashboard/Overview";
import { Properties } from "./dashboard/Properties";
import { Tenants } from "./dashboard/Tenants";
import { Leases } from "./dashboard/Leases";
import { Settings } from "./dashboard/Settings";
import ProfilePage from "./Profile";
import { Units } from "./dashboard/Units";

export function Dashboard() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/leases" element={<Leases />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/units" element={<Units />} />
          <Route path="/units" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
