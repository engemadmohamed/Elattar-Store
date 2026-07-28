import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Tags, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice, formatDate } from "@/lib/utils";
import { Link } from "wouter";
import { ADMIN_BASE } from "@/lib/admin-path";

export default function AdminDashboard() {
  const { data: productsData } = useQuery({
    queryKey: ["/api/products/admin/all"],
    queryFn: () => apiRequest<{ products: unknown[]; total: number }>("GET", "/api/products/admin/all"),
  });

  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => apiRequest<{ orders: Array<{ _id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }>; total: number }>("GET", "/api/orders?limit=5"),
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest<unknown[]>("GET", "/api/categories"),
  });

  const pendingOrders = ordersData?.orders?.filter((o) => o.status === "pending").length || 0;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const statusLabels: Record<string, string> = {
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">مرحباً بك في إدارة El Attar</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: "المنتجات", value: productsData?.total, icon: Package, color: "text-blue-500", sub: "منتج نشط" },
            { title: "الطلبات", value: ordersData?.total, icon: ShoppingBag, color: "text-green-500", sub: "إجمالي الطلبات" },
            { title: "قيد الانتظار", value: pendingOrders, icon: TrendingUp, color: "text-yellow-500", sub: "طلب جديد" },
            { title: "الفئات", value: categories?.length, icon: Tags, color: "text-purple-500", sub: "فئة منتج" },
          ].map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                {stat.value !== undefined ? (
                  <p className="text-2xl font-bold">{stat.value}</p>
                ) : (
                  <Skeleton className="h-8 w-16" />
                )}
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">آخر الطلبات</CardTitle>
            <Link href={`${ADMIN_BASE}/orders`}>
              <button className="text-xs text-primary hover:underline">عرض الكل</button>
            </Link>
          </CardHeader>
          <CardContent>
            {ordersData?.orders?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد طلبات بعد</p>
            ) : (
              <div className="space-y-3">
                {ordersData?.orders?.map((order) => (
                  <div key={order._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName} · {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      <p className="text-sm font-bold text-primary">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href={`${ADMIN_BASE}/products/add`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">إضافة منتج</p>
                  <p className="text-xs text-muted-foreground">أضف منتجاً جديداً</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href={`${ADMIN_BASE}/orders`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">إدارة الطلبات</p>
                  <p className="text-xs text-muted-foreground">متابعة وتحديث الطلبات</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
