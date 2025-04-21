import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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
import Reports from "./dashboard/Reports";
import ExpensesPage from "./dashboard/Expenses";

// Create a context for modal state management
import { createContext } from "react";
export const ModalContext = createContext({
  modalOpen: false,
  setModalOpen: (open) => {},
});

export function Dashboard() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Save the current path to localStorage whenever it changes
  useEffect(() => {
    // Only save actual dashboard paths, not the index path
    if (location.pathname !== "/dashboard") {
      localStorage.setItem("lastDashboardPath", location.pathname);
    }
  }, [location.pathname]);

  // Check for a saved path when the component mounts
  useEffect(() => {
    const savedPath = localStorage.getItem("lastDashboardPath");
    // Only redirect if we're at the dashboard root and there's a saved path
    if (location.pathname === "/dashboard" && savedPath) {
      navigate(savedPath, { replace: true });
    }
    console.log("Dashboard mounted, current path:", location.pathname);
    console.log("Saved path:", savedPath);
  }, []);

  return (
    <ModalContext.Provider value={{ modalOpen, setModalOpen }}>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden">
          <Sidebar
            isMobileOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="properties" element={<Properties />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="leases" element={<Leases />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="units" element={<Units />} />
            <Route path="messages" element={<Messages />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </ModalContext.Provider>
  );
}
