import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  User,
  Building,
  Users,
  FileText,
  Settings,
  LogOut,
  Box,
  PenToolIcon as Tool,
  MessageSquare,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Building, label: "Properties", href: "/dashboard/properties" },
  { icon: Box, label: "Units", href: "/dashboard/units" },
  { icon: Users, label: "Tenants", href: "/dashboard/tenants" },
  { icon: FileText, label: "Leases", href: "/dashboard/leases" },
  { icon: Tool, label: "Maintenance", href: "/dashboard/maintenance" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" }, // New item
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="hidden lg:block border-r bg-gray-100/40 lg:w-60">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center border-b px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Home className="h-6 w-6" style={{ color: "#38b000" }} />
            <span className="text-[#38b000]">RentEase</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item, index) => (
              <Button
                key={index}
                asChild
                variant={
                  location.pathname === item.href ? "secondary" : "ghost"
                }
                className="w-full justify-start"
              >
                <Link
                  to={item.href}
                  className="text-[#38b000] hover:text-[#38b000]/80"
                >
                  <item.icon
                    className="mr-2 h-4 w-4"
                    style={{ color: "#38b000" }}
                  />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </ScrollArea>
        <div className="mt-auto p-4">
          <Button
            variant="outline"
            className="w-full text-[#38b000] hover:text-[#38b000]/80"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" style={{ color: "#38b000" }} />
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
