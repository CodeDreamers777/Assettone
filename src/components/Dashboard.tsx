import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./dashboard/Sidebar";
import { Overview } from "./dashboard/Overview";
import { Properties } from "./dashboard/Properties";
import { Tenants } from "./dashboard/Tenants";
import { Leases } from "./dashboard/Leases";
import { Settings } from "./dashboard/Settings";
import { Messages } from "./dashboard/Messages";
import ProfilePage from "./Profile";
import { Units } from "./dashboard/Units";
import Maintenance from "./dashboard/Maintenance";

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
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/units" element={<Units />} />

          <Route path="/messages" element={<Messages />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </main>
    </div>
  );
}
