import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import {
  LayoutDashboard,
  Calendar,
  Gift,
  Vote,
  Store,
  BarChart3,
  Building2,
  LogOut,
  User,
} from "lucide-react";

const navigation = [{ name: "Dashboard", href: "/", icon: LayoutDashboard }];

const contentManagement = [
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Rewards", href: "/rewards", icon: Gift },
  { name: "Surveys", href: "/surveys", icon: Vote },
  { name: "Businesses", href: "/businesses", icon: Store },
];

const analytics = [
  { name: "Detailed Analytics", href: "/analytics", icon: BarChart3 },
  {
    name: "Geographic Analytics",
    href: "/analytics/geographic",
    icon: BarChart3,
  },
  { name: "Sales Analytics", href: "/analytics/sales", icon: BarChart3 },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center h-16 px-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">SMS Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    location === item.href
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </a>
              </Link>
            );
          })}

          {/* Content Management Section */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Content Management
            </h3>
            {contentManagement.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      location === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Analytics Section */}
          <div className="pt-4">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Analytics
            </h3>
            {analytics.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      location === item.href
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Menu */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
