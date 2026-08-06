import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./lib/theme-provider";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { CustomerAuthProvider } from "./lib/customer-auth-context";
import { CartProvider } from "./lib/cart-context";
import { WishlistProvider } from "./lib/wishlist-context";
import { StoreSettingsProvider } from "./lib/store-settings-context";
import { LanguageProvider } from "./lib/language-context";
import { Toaster } from "./components/ui/toaster";
import { ADMIN_BASE } from "./lib/admin-path";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import CustomerLogin from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AddProduct from "./pages/admin/AddProduct";
import AdminOrders from "./pages/admin/Orders";
import AdminInvoices from "./pages/admin/Invoices";
import AdminCategories from "./pages/admin/Categories";
import AdminSettings from "./pages/admin/Settings";
import AdminDiscounts from "./pages/admin/Discounts";

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (!isAuthenticated) return <Redirect to={`${ADMIN_BASE}/login`} />;
  return <Component />;
}

function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public shop routes */}
      <Route path="/">
        <ShopLayout><Home /></ShopLayout>
      </Route>
      <Route path="/shop">
        <ShopLayout><Shop /></ShopLayout>
      </Route>
      <Route path="/product/:id">
        <ShopLayout><ProductDetail /></ShopLayout>
      </Route>
      <Route path="/checkout">
        <ShopLayout><Checkout /></ShopLayout>
      </Route>
      <Route path="/wishlist">
        <ShopLayout><Wishlist /></ShopLayout>
      </Route>
      <Route path="/login">
        <ShopLayout><CustomerLogin /></ShopLayout>
      </Route>
      <Route path="/signup">
        <ShopLayout><SignUp /></ShopLayout>
      </Route>
      <Route path="/profile">
        <ShopLayout><Profile /></ShopLayout>
      </Route>
      <Route path="/about">
        <ShopLayout><About /></ShopLayout>
      </Route>
      <Route path="/contact">
        <ShopLayout><Contact /></ShopLayout>
      </Route>
      <Route path="/faq">
        <ShopLayout><FAQ /></ShopLayout>
      </Route>
      <Route path="/shipping">
        <ShopLayout><Shipping /></ShopLayout>
      </Route>
      <Route path="/returns">
        <ShopLayout><Returns /></ShopLayout>
      </Route>
      <Route path="/terms">
        <ShopLayout><Terms /></ShopLayout>
      </Route>
      <Route path="/privacy">
        <ShopLayout><Privacy /></ShopLayout>
      </Route>

      {/* Admin routes */}
      <Route path={`${ADMIN_BASE}/login`} component={AdminLogin} />
      <Route path={ADMIN_BASE}>
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path={`${ADMIN_BASE}/dashboard`}>
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path={`${ADMIN_BASE}/products`}>
        <AdminRoute component={AdminProducts} />
      </Route>
      <Route path={`${ADMIN_BASE}/products/add`}>
        <AdminRoute component={AddProduct} />
      </Route>
      <Route path={`${ADMIN_BASE}/products/edit/:id`}>
        <AdminRoute component={AddProduct} />
      </Route>
      <Route path={`${ADMIN_BASE}/orders`}>
        <AdminRoute component={AdminOrders} />
      </Route>
      <Route path={`${ADMIN_BASE}/invoices`}>
        <AdminRoute component={AdminInvoices} />
      </Route>
      <Route path={`${ADMIN_BASE}/categories`}>
        <AdminRoute component={AdminCategories} />
      </Route>
      <Route path={`${ADMIN_BASE}/discounts`}>
        <AdminRoute component={AdminDiscounts} />
      </Route>
      <Route path={`${ADMIN_BASE}/settings`}>
        <AdminRoute component={AdminSettings} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <StoreSettingsProvider>
            <AuthProvider>
              <CustomerAuthProvider>
                <WishlistProvider>
                  <CartProvider>
                    <Router />
                    <Toaster />
                  </CartProvider>
                </WishlistProvider>
              </CustomerAuthProvider>
            </AuthProvider>
          </StoreSettingsProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
