import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  UserCircle,
  Globe,
  ChevronDown,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useStoreSettings } from "@/lib/store-settings-context";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "./CartDrawer";
import Logo from "./Logo";
import ScrollToTopButton from "./ScrollToTopButton";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  image?: string;
  parentId: string | null;
  isActive: boolean;
}

export default function Navbar() {
  const { count } = useCart();
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { settings } = useStoreSettings();
  const { lang, setLang, t } = useLanguage();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const accountRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const rootCategories = categories?.filter((c) => !c.parentId && c.isActive) || [];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setCatOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const catName = (cat: Category) => (lang === "ar" ? cat.nameAr : cat.name);

  return (
    <>
      <ScrollToTopButton />

      {/* Categories Mega Menu Overlay */}
      {catOpen && (
        <div
          className="nav-overlay"
          onClick={() => setCatOpen(false)}
        />
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          style={{ animation: "overlayFade 0.25s ease-out both" }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-background border-l z-50 flex flex-col transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ boxShadow: "-8px 0 32px hsl(0 0% 0% / 0.15)" }}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 rounded-lg" />
            <span className="font-bold">{settings.storeName}</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Search */}
        <div className="p-4 border-b">
          <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }}>
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-3 ltr:right-3" />
              <input
                type="search"
                placeholder={t("ابحث عن منتج...", "Search products...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 px-4 rounded-xl border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </form>
        </div>

        {/* Mobile Categories */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
            {t("الفئات", "Categories")}
          </p>
          {rootCategories.map((cat, i) => (
            <Link key={cat._id} href={`/shop?category=${cat.slug}`} onClick={() => setMobileMenuOpen(false)}>
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-all duration-200 group cursor-pointer"
                style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
              >
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={catName(cat)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base">{cat.icon || "📦"}</span>
                  )}
                </div>
                <span className="text-sm font-medium">{catName(cat)}</span>
              </div>
            </Link>
          ))}
          <div className="border-t mt-3 pt-3 space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm cursor-pointer">
                {t("الرئيسية", "Home")}
              </div>
            </Link>
            <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm cursor-pointer">
                {t("المتجر", "Shop")}
              </div>
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm cursor-pointer">
                {t("من نحن", "About")}
              </div>
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-accent transition-colors text-sm cursor-pointer">
                {t("تواصل معنا", "Contact")}
              </div>
            </Link>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="p-4 border-t">
          {isAuthenticated ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                  {customer?.name?.charAt(0) || "U"}
                </div>
                <span className="text-sm font-medium truncate">{customer?.name}</span>
              </div>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-accent transition-colors">
                  <UserCircle className="h-4 w-4" /> {t("حسابي", "My Account")}
                </button>
              </Link>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-accent text-destructive transition-colors"
                onClick={() => { logout(); toast({ title: t("تم تسجيل الخروج", "Logged out") }); setMobileMenuOpen(false); }}
              >
                <LogOut className="h-4 w-4" /> {t("تسجيل الخروج", "Logout")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl bg-primary text-primary-foreground transition-colors font-semibold">
                  {t("تسجيل الدخول", "Login")}
                </button>
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition-colors">
                  {t("إنشاء حساب", "Sign Up")}
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`sticky top-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/98 shadow-[0_2px_20px_hsl(0_0%_0%/0.08)] backdrop-blur-xl"
            : "bg-white/95 backdrop-blur-md shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group">
              <Logo className="h-9 w-9 shadow-sm rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-md" />
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-base leading-none">{settings.storeName}</span>
                <span className="text-xs text-muted-foreground leading-none">{settings.storeTagline}</span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/">
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                  {t("الرئيسية", "Home")}
                </button>
              </Link>

              {/* Categories Dropdown */}
              <div className="relative" ref={catRef}>
                <button
                  onClick={() => setCatOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    catOpen ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {t("الفئات", "Categories")}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-300 ${catOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Mega Menu */}
                {catOpen && (
                  <div
                    className="absolute top-full mt-2 w-[520px] rounded-2xl border bg-white shadow-[0_20px_60px_hsl(0_0%_0%/0.15)] z-50 overflow-hidden animate-nav-slide-down origin-top"
                    style={{ right: lang === "ar" ? "auto" : undefined, left: lang === "ar" ? undefined : "auto" }}
                  >
                    {/* Menu Header */}
                    <div className="px-5 py-3 border-b bg-muted/40 flex items-center justify-between">
                      <p className="text-sm font-semibold">{t("تصفح الفئات", "Browse Categories")}</p>
                      <Link href="/shop" onClick={() => setCatOpen(false)}>
                        <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                          {t("عرض الكل →", "View All →")}
                        </span>
                      </Link>
                    </div>

                    <div className="p-3 grid grid-cols-3 gap-2">
                      {rootCategories.map((cat, i) => (
                        <Link
                          key={cat._id}
                          href={`/shop?category=${cat.slug}`}
                          onClick={() => setCatOpen(false)}
                        >
                          <div
                            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer group text-center"
                            style={{ animation: `fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 0.04}s both` }}
                          >
                            <div className="h-16 w-full rounded-lg overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                              {cat.image ? (
                                <img
                                  src={cat.image}
                                  alt={catName(cat)}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{cat.icon || "📦"}</span>
                              )}
                            </div>
                            <span className="text-xs font-semibold leading-tight">{catName(cat)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Menu Footer */}
                    <div className="px-5 py-3 border-t bg-muted/20">
                      <Link href="/shop" onClick={() => setCatOpen(false)}>
                        <button className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
                          {t("تسوق الآن", "Shop Now")}
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/shop">
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                  {t("المتجر", "Shop")}
                </button>
              </Link>
              <Link href="/about">
                <button className="px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
                  {t("من نحن", "About")}
                </button>
              </Link>
            </div>

            {/* Search — Desktop */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden md:block">
              <div className="relative group">
                <Search className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary rtl:left-3 ltr:right-3" />
                <input
                  type="search"
                  placeholder={t("ابحث عن منتج...", "Search products...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 px-4 rounded-full border border-input bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-200 rtl:pr-4 ltr:pl-4"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Language Switcher */}
              <div className="relative hidden sm:block" ref={langRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-2 h-9 rounded-lg"
                  onClick={() => setLangOpen((o) => !o)}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{lang === "ar" ? "ع" : "EN"}</span>
                </Button>
                {langOpen && (
                  <div className="absolute mt-2 w-32 rounded-xl border bg-white shadow-[0_8px_24px_hsl(0_0%_0%/0.12)] z-50 overflow-hidden animate-nav-slide-down origin-top">
                    {[
                      { code: "ar", label: "العربية", sub: "RTL" },
                      { code: "en", label: "English", sub: "LTR" },
                    ].map((l) => (
                      <button
                        key={l.code}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent transition-colors ${lang === l.code ? "font-bold text-primary" : ""}`}
                        onClick={() => { setLang(l.code as "ar" | "en"); setLangOpen(false); }}
                      >
                        {l.label} <span className="text-xs text-muted-foreground">{l.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-lg transition-all duration-200 hover:scale-110"
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
              <div className="relative hidden sm:block" ref={accountRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg transition-all duration-200 hover:scale-110"
                  onClick={() => setAccountOpen((o) => !o)}
                >
                  {isAuthenticated ? (
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {customer?.name?.charAt(0) || "U"}
                    </div>
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </Button>

                {accountOpen && (
                  <div className="absolute top-full mt-2 rtl:left-0 ltr:right-0 w-56 rounded-2xl border-2 bg-white shadow-[0_16px_40px_hsl(0_0%_0%/0.15)] z-50 overflow-hidden animate-nav-slide-down origin-top">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-3 border-b bg-muted/40 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
                            {customer?.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{customer?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{customer?.phone}</p>
                          </div>
                        </div>
                        <Link href="/profile" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                            <UserCircle className="h-4 w-4" /> {t("حسابي", "My Account")}
                          </button>
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent text-destructive transition-colors border-t"
                          onClick={() => { logout(); toast({ title: t("تم تسجيل الخروج", "Logged out") }); setAccountOpen(false); }}
                        >
                          <LogOut className="h-4 w-4" /> {t("تسجيل الخروج", "Logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-3 py-3 border-b bg-muted/40">
                          <p className="text-sm font-semibold">{t("مرحباً بك!", "Welcome!")}</p>
                          <p className="text-xs text-muted-foreground">{t("سجّل دخولك للمتابعة", "Sign in to continue")}</p>
                        </div>
                        <Link href="/login" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
                            <User className="h-4 w-4" /> {t("تسجيل الدخول", "Login")}
                          </button>
                        </Link>
                        <Link href="/signup" onClick={() => setAccountOpen(false)}>
                          <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-accent transition-colors border-t">
                            <Package className="h-4 w-4" /> {t("إنشاء حساب", "Sign Up")}
                          </button>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Hamburger */}
              <button
                className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
