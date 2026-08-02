import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Tags, TrendingUp, Plus, ArrowUpRight, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { ADMIN_BASE } from "@/lib/admin-path";

export default function AdminDashboard() {
  const { data: productsData } = useQuery({
    queryKey: ["/api/products/admin/all"],
    queryFn: () =>
      apiRequest<{ products: unknown[]; total: number }>(
        "GET",
        "/api/products/admin/all"
      ),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () =>
      apiRequest<{
        orders: Array<{
          _id: string;
          orderNumber: string;
          customerName: string;
          total: number;
          status: string;
          createdAt: string;
        }>;
        total: number;
      }>("GET", "/api/orders?limit=6"),
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest<unknown[]>("GET", "/api/categories"),
  });

  const pendingOrders =
    ordersData?.orders?.filter((o) => o.status === "pending").length || 0;

  const statusConfig: Record<string, { label: string; bgClass: string }> = {
    pending: { label: "قيد الانتظار", bgClass: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
    confirmed: { label: "مؤكد", bgClass: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
    processing: { label: "قيد التجهيز", bgClass: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
    shipped: { label: "تم الشحن", bgClass: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20" },
    delivered: { label: "تم التوصيل", bgClass: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
    cancelled: { label: "ملغي", bgClass: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  };

  return (
    <AdminLayout title="لوحة التحكم الإدارية" subtitle="نظرة عامة على المبيعات، الطلبات، والمنتجات">
      <div className="space-y-8">
        
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-black text-white p-6 sm:p-8 shadow-xl border border-white/10">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">مرحباً بك في متجر المهندس 👋</h2>
              <p className="text-white/70 text-sm">تابع أداء المتجر والطلبات الأخيرة بكل سهولة من مكان واحد.</p>
            </div>
            <Link href={`${ADMIN_BASE}/products/add`}>
              <Button className="bg-white hover:bg-white/90 text-black font-bold rounded-2xl gap-2 shadow-lg">
                <Plus className="h-4 w-4" /> إضافة منتج جديد
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              title: "إجمالي المنتجات",
              value: productsData?.total,
              icon: Package,
              sub: "منتج متوفر حالياً",
              iconBg: "bg-black text-white",
            },
            {
              title: "إجمالي الطلبات",
              value: ordersData?.total,
              icon: ShoppingBag,
              sub: "طلب من العملاء",
              iconBg: "bg-black text-white",
            },
            {
              title: "طلبات قيد الانتظار",
              value: pendingOrders,
              icon: TrendingUp,
              sub: "تتطلب مراجعة",
              iconBg: "bg-amber-500 text-white",
            },
            {
              title: "الفئات المسجلة",
              value: categories?.length,
              icon: Tags,
              sub: "قسم منتجات",
              iconBg: "bg-black text-white",
            },
          ].map((stat, i) => (
            <Card key={i} className="rounded-3xl border shadow-sm hover:shadow-md transition-all bg-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-muted-foreground">{stat.title}</p>
                  <div className={`h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                {stat.value !== undefined ? (
                  <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                ) : (
                  <Skeleton className="h-9 w-20 rounded-xl" />
                )}
                <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders Section */}
        <Card className="rounded-3xl border shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" /> أحدث طلبات العملاء
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">أحدث 6 طلبات تم إنشاؤها عبر المتجر</p>
            </div>
            <Link href={`${ADMIN_BASE}/orders`}>
              <Button variant="outline" size="sm" className="rounded-xl font-bold gap-1">
                عرض كل الطلبات <ArrowUpRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {ordersData?.orders?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">لا توجد طلبات مسجلة حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ordersData?.orders?.map((order) => {
                  const status = statusConfig[order.status] || {
                    label: order.status,
                    bgClass: "bg-gray-100 text-gray-700",
                  };
                  return (
                    <div
                      key={order._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-muted/20 hover:bg-muted/40 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-black text-white font-black flex items-center justify-center text-xs shrink-0">
                          #{order.orderNumber.slice(-4)}
                        </div>
                        <div>
                          <p className="font-black text-sm">طلب رقم: {order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerName} · {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <Badge className={`px-3 py-1 rounded-full border text-xs font-bold ${status.bgClass}`}>
                          {status.label}
                        </Badge>
                        <p className="text-base font-black text-foreground">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Shortcut Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`${ADMIN_BASE}/products/add`}>
            <Card className="rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group p-6">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-base group-hover:underline">إضافة منتج جديد للمتجر</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">رفع صور المنتج، التفاصيل، السعر والكمية المتاحة في المخزون.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`${ADMIN_BASE}/orders`}>
            <Card className="rounded-3xl border shadow-sm hover:shadow-md transition-all cursor-pointer bg-white group p-6">
              <CardContent className="p-0 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-base group-hover:underline">إدارة وشحن الطلبات</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">متابعة الفواتير، تحديث حالة الطلبات، وطباعة فواتير الشحن.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

      </div>
    </AdminLayout>
  );
}
