import React from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Building, label: "Properties", href: "/dashboard/properties" },
  { icon: Box, label: "Units", href: "/dashboard/Units" },
  { icon: Users, label: "Tenants", href: "/dashboard/tenants" },
  { icon: FileText, label: "Leases", href: "/dashboard/leases" },
  { icon: User, label: "Profile", href: "/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
  const location = useLocation();
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
          <Button variant="outline" className="w-full" asChild>
            <Link to="/" className="text-[#38b000] hover:text-[#38b000]/80">
              <LogOut className="mr-2 h-4 w-4" style={{ color: "#38b000" }} />
              Log out
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
