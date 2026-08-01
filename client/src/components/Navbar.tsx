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
  Globe,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-provider";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useStoreSettings } from "@/lib/store-settings-context";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "./CartDrawer";
import Logo from "./Logo";
import ScrollToTopButton from "./ScrollToTopButton";

export default function Navbar() {
  const { count } = useCart();
  const { theme, setTheme } = useTheme();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { settings } = useStoreSettings();
  const { lang, setLang, t } = useLanguage();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "bg-background/95 shadow-md backdrop-blur-lg"
            : "bg-background/80 backdrop-blur-sm shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <Logo className="h-9 w-9 shadow-sm rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-base leading-none">
                  {settings.storeName}
                </span>
                <span className="text-xs text-muted-foreground leading-none">
                  {settings.storeTagline}
                </span>
              </div>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-all duration-300 group-focus-within:text-primary rtl:left-3 ltr:right-3" />
                <input
                  type="search"
                  placeholder={t("ابحث عن منتج...", "Search products...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 px-4 rounded-full border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all duration-300 rtl:pr-4 ltr:pl-4"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-2"
                  onClick={() => setLangOpen((o) => !o)}
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-bold">{lang === "ar" ? "ع" : "EN"}</span>
                </Button>
                {langOpen && (
                  <div className="absolute mt-2 w-32 rounded-xl border bg-popover shadow-xl z-50 overflow-hidden animate-scale-in origin-top">
                    <button
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors ${lang === "ar" ? "font-bold text-primary" : ""}`}
                      onClick={() => { setLang("ar"); setLangOpen(false); }}
                    >
                      العربية <span className="text-xs">RTL</span>
                    </button>
                    <button
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors ${lang === "en" ? "font-bold text-primary" : ""}`}
                      onClick={() => { setLang("en"); setLangOpen(false); }}
                    >
                      English <span className="text-xs">LTR</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="transition-transform duration-300 hover:scale-110"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 animate-scale-in" />
                ) : (
                  <Moon className="h-4 w-4 animate-scale-in" />
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-transform duration-300 hover:scale-110"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold animate-bounce-in">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Button>

              {/* Account */}
              <div className="relative" ref={accountRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="transition-transform duration-300 hover:scale-110"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  <User className="h-4 w-4" />
                </Button>

                {accountOpen && (
                  <div className="absolute mt-2 w-48 rounded-xl border bg-popover shadow-xl z-50 overflow-hidden animate-scale-in origin-top">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2 border-b">
                          <p className="text-sm font-medium truncate">
                            {customer?.name}
                          </p>
                        </div>
                        <Link href="/profile" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <UserCircle className="h-4 w-4" /> {t("حسابي", "My Account")}
                          </button>
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive transition-colors"
                          onClick={() => {
                            logout();
                            toast({ title: t("تم تسجيل الخروج", "Logged out") });
                            setAccountOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4" /> {t("تسجيل الخروج", "Logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <User className="h-4 w-4" /> {t("تسجيل الدخول", "Login")}
                          </button>
                        </Link>
                        <Link href="/signup" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors">
                            <Package className="h-4 w-4" /> {t("إنشاء حساب", "Sign Up")}
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
