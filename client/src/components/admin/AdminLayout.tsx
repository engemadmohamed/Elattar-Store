import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
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
  ChevronLeft,
  ExternalLink,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_BASE } from "@/lib/admin-path";

const navItems = [
  { title: "لوحة التحكم", url: ADMIN_BASE, icon: LayoutDashboard },
  { title: "الفئات", url: `${ADMIN_BASE}/categories`, icon: Tags },
  { title: "المنتجات", url: `${ADMIN_BASE}/products`, icon: Package },
  { title: "التخفيضات", url: `${ADMIN_BASE}/discounts`, icon: Percent },
  { title: "الطلبات", url: `${ADMIN_BASE}/orders`, icon: ShoppingBag },
  { title: "الفواتير", url: `${ADMIN_BASE}/invoices`, icon: Receipt },
  { title: "الإعدادات", url: `${ADMIN_BASE}/settings`, icon: Settings },
];

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [location] = useLocation();
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({ title: "تم تسجيل الخروج" });
    window.location.href = "/";
  };

  // Find active item
  const activeItem = navItems.find(
    (item) => location === item.url || (item.url !== ADMIN_BASE && location.startsWith(item.url))
  );

  const currentPageTitle = title || activeItem?.title || "إدارة المتجر";

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* ===== TOP ADMIN NAVIGATION BAR (زرار التنقل العلوي) ===== */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm h-16 px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Left / Right: Menu toggle & Page Title */}
        <div className="flex items-center gap-3">
          {/* Main Navigation Toggle Button (زرار التنقل الرئيسية) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground text-background font-bold text-sm hover:bg-foreground/85 transition-all duration-200 shadow-sm active:scale-95"
            aria-label="قائمة التنقل"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="hidden sm:inline">القائمة والتنقل</span>
          </button>

          <div className="h-6 w-[1px] bg-border hidden sm:block" />

          {/* Breadcrumb / Title */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href={ADMIN_BASE} className="hover:text-foreground transition-colors">
                الإدارة
              </Link>
              <ChevronLeft className="h-3 w-3 rtl:rotate-180 opacity-50" />
              <span className="font-semibold text-foreground">{currentPageTitle}</span>
            </div>
            {subtitle && <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Quick Horizontal Nav Badges for Desktop */}
        <div className="hidden xl:flex items-center gap-1 bg-muted/50 p-1 rounded-xl border">
          {navItems.map((item) => {
            const isActive = location === item.url || (item.url !== ADMIN_BASE && location.startsWith(item.url));
            return (
              <Link key={item.url} href={item.url}>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-foreground shadow-sm border"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.title}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Store button */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border hover:bg-accent transition-all duration-200"
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden md:inline">عرض المتجر</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <div className="h-6 w-[1px] bg-border hidden sm:block" />

          {/* Admin profile & logout */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-foreground text-background font-black text-xs flex items-center justify-center shrink-0">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold leading-tight truncate">{admin?.name || "الأدمن"}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">مسؤول المتجر</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
              onClick={handleLogout}
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== MAIN BODY WITH SLIDE-OUT / COLLAPSIBLE SIDEBAR ===== */}
      <div className="flex-1 flex relative">
        {/* Mobile / Toggleable Sidebar Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-16 rtl:right-0 ltr:left-0 bottom-0 z-50 w-64 bg-white border-r shadow-2xl flex flex-col
            transition-transform duration-300 ease-out
            ${sidebarOpen ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full lg:translate-x-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shadow-none"}
          `}
        >
          {/* Header in sidebar */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-foreground text-background font-bold text-xs flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm">قائمة التنقل</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.url || (item.url !== ADMIN_BASE && location.startsWith(item.url));
              return (
                <Link key={item.url} href={item.url}>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                      isActive
                        ? "bg-foreground text-background shadow-md"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`} />
                    <span className="flex-1 text-right">{item.title}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-background" />}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Store Quick Link at bottom of sidebar */}
          <div className="p-3 border-t bg-muted/20">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl border bg-white text-xs font-bold text-foreground hover:bg-accent transition-colors shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>زيارة المتجر الرئيسي</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </div>
        </aside>

        {/* Main Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
