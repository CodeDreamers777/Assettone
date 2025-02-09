import { useState, useEffect, useContext } from "react";
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
  Menu,
  FileBarChart,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { AuthContext } from "../../App";

// Admin menu items (same as before)
const adminItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Building, label: "Properties", href: "/dashboard/properties" },
  { icon: Box, label: "Units", href: "/dashboard/units" },
  { icon: Users, label: "Tenants", href: "/dashboard/tenants" },
  { icon: FileText, label: "Leases", href: "/dashboard/leases" },
  { icon: Tool, label: "Maintenance", href: "/dashboard/maintenance" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: FileBarChart, label: "Reports", href: "/dashboard/reports" },
];

// Tenant menu items (same as before)
const tenantItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Tool, label: "Maintenance", href: "/dashboard/maintenance" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onMenuToggle?: () => void;
}

export function Sidebar({
  isMobileOpen = false,
  onClose,
  onMenuToggle,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<string | null>(null);
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    setUserType(storedUserType);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    onClose && onClose();
  };

  const sidebarItems = userType === "TENANT" ? tenantItems : adminItems;

  const renderSidebarContent = () => (
    <>
      <div className="h-16 flex items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Home className="h-6 w-6" style={{ color: "#38b000" }} />
          <span className="text-[#38b000]">Assettone estates</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item, index) => (
            <Button
              key={index}
              asChild
              variant={location.pathname === item.href ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onClose && onClose()}
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      {onMenuToggle && (
        <Button
          variant="outline"
          size="icon"
          className="md:block lg:hidden fixed top-4 left-4 z-50"
          onClick={onMenuToggle}
        >
          {isMobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block border-r bg-gray-100/40 lg:w-60">
        <div className="flex flex-col h-full">{renderSidebarContent()}</div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:block lg:hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />

          {/* Mobile Sidebar */}
          <div className="absolute top-0 left-0 w-64 h-full bg-white shadow-lg">
            <div className="flex flex-col h-full">{renderSidebarContent()}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
