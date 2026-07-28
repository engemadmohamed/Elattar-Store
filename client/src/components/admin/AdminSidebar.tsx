import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  LogOut,
  Store,
  Settings,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ADMIN_BASE } from "@/lib/admin-path";

const menuItems = [
  { title: "لوحة التحكم", url: ADMIN_BASE, icon: LayoutDashboard },
  { title: "المنتجات", url: `${ADMIN_BASE}/products`, icon: Package },
  { title: "الفئات", url: `${ADMIN_BASE}/categories`, icon: Tags },
  { title: "الطلبات", url: `${ADMIN_BASE}/orders`, icon: ShoppingBag },
  { title: "فواتير العملاء", url: `${ADMIN_BASE}/invoices`, icon: Receipt },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <aside className="w-64 shrink-0 border-r bg-sidebar min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <div>
            <p className="font-bold text-sm">Al Attar</p>
            <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location === item.url;
          return (
            <Link key={item.url} href={item.url}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {admin?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {admin?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
