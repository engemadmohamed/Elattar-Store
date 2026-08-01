import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  LogOut,
  Settings,
  Receipt,
  Menu,
  X,
  ChevronRight,
  Store,
  Palette,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_BASE } from "@/lib/admin-path";

const menuItems = [
  { title: "لوحة التحكم", url: ADMIN_BASE, icon: LayoutDashboard },
  { title: "المنتجات", url: `${ADMIN_BASE}/products`, icon: Package },
  { title: "الفئات", url: `${ADMIN_BASE}/categories`, icon: Tags },
  { title: "الطلبات", url: `${ADMIN_BASE}/orders`, icon: ShoppingBag },
  { title: "فواتير العملاء", url: `${ADMIN_BASE}/invoices`, icon: Receipt },
  { title: "إعدادات المتجر", url: `${ADMIN_BASE}/settings`, icon: Settings },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({ title: "تم تسجيل الخروج" });
    window.location.href = "/";
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-5 border-b">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background font-black text-base flex shrink-0">
            E
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Elattar Store</p>
            <p className="text-xs text-muted-foreground leading-tight">لوحة الإدارة</p>
          </div>
        </Link>
      </div>

      {/* Design Badge */}
      <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center gap-2">
        <Palette className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div>
          <p className="text-[11px] font-semibold text-foreground">تصميم أبيض / أسود</p>
          <p className="text-[10px] text-muted-foreground leading-tight">الوضع الداكن معطّل للزوار</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {menuItems.map((item, i) => {
          const isActive = location === item.url || (item.url !== ADMIN_BASE && location.startsWith(item.url));
          return (
            <Link key={item.url} href={item.url}>
              <button
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-foreground/70 hover:bg-foreground/6 hover:text-foreground"
                }`}
                style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both` }}
              >
                <item.icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                <span className="flex-1 text-right rtl:text-right ltr:text-left">{item.title}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-60 rtl:rotate-180" />}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* View Store Link */}
      <div className="px-3 py-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 border border-dashed border-foreground/15"
        >
          <Store className="h-4 w-4" />
          <span className="flex-1 text-right">عرض المتجر</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" />
        </a>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-black shrink-0">
            {admin?.name?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{admin?.name || "الأدمن"}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:bg-destructive/8 hover:text-destructive rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" /> تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 rtl:right-4 ltr:left-4 z-50 h-10 w-10 rounded-xl bg-background border-2 shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{ animation: "fadeIn 0.3s ease both" }}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          style={{ animation: "overlayFade 0.25s ease both" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 shrink-0 border-r bg-white min-h-screen flex flex-col
          fixed lg:sticky top-0 rtl:right-0 ltr:left-0 z-40
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full lg:translate-x-0"}
        `}
        style={{ boxShadow: mobileOpen ? "4px 0 32px hsl(0 0% 0% / 0.15)" : "none" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
