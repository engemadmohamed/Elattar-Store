import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Package,
  UserCircle,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-provider";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "./CartDrawer";
import Logo from "./Logo";
import ScrollToTopButton from "./ScrollToTopButton";

export default function Navbar() {
  const { count } = useCart();
  const { theme, setTheme } = useTheme();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Scroll to top on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  // Add shadow on scroll for a nice transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <>
      <ScrollToTopButton />
      <nav
        className={`sticky top-0 z-40 border-b transition-all duration-200 ${
          scrolled
            ? "bg-background shadow-md"
            : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <Logo className="h-9 w-9 shadow-sm rounded-lg transition-transform duration-200 group-hover:scale-105" />
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-base leading-none">
                  المهندس
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  أدوات مكتبية
                </span>
              </div>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Button>

              <div className="relative" ref={accountRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <User className="h-4 w-4" />
                </Button>

                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-lg z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2 border-b">
                          <p className="text-sm font-medium truncate">
                            {customer?.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {customer?.email}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setAccountOpen(false)}
                        >
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                            <UserCircle className="h-4 w-4" /> حسابي
                          </button>
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
                          onClick={() => {
                            logout();
                            toast({ title: "تم تسجيل الخروج" });
                            setAccountOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" /> تسجيل الخروج
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setAccountOpen(false)}
                        >
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                            <User className="h-4 w-4" /> تسجيل الدخول
                          </button>
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setAccountOpen(false)}
                        >
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
                            <Package className="h-4 w-4" /> إنشاء حساب
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
