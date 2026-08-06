import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, ShoppingBag, ArrowRight, Lock } from "lucide-react";
import { useWishlist } from "@/lib/wishlist-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { apiRequest } from "@/lib/queryClient";
import ProductCard, { Product } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();

  const { data: productsData, isLoading } = useQuery<any>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products"),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 min-h-[70vh] flex items-center justify-center">
        <div className="text-center py-16 px-6 max-w-md bg-card rounded-3xl border shadow-sm">
          <div className="h-16 w-16 bg-black/5 text-black rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">تسجيل الدخول مطلوب</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            يرجى تسجيل الدخول أو إنشاء حساب جديد للتمكن من حفظ منتجاتك المفضلة والوصول إليها في أي وقت.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button className="w-full sm:w-auto rounded-xl px-6 font-bold bg-black text-white hover:bg-black/90">تسجيل الدخول</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl px-6 font-bold">إنشاء حساب جديد</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const productsList: Product[] = Array.isArray(productsData)
    ? productsData
    : productsData?.products || [];

  const favoriteProducts = productsList.filter((p) =>
    wishlist.includes(String(p._id))
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 min-h-[70vh]">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <Heart className="h-7 w-7 text-black fill-black" /> المفضلة
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            المنتجات التي قمت بحفظها للشراء لاحقاً ({favoriteProducts.length})
          </p>
        </div>
        <Link href="/shop">
          <Button variant="outline" className="gap-2 rounded-xl">
            تصفح المتجر <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-muted/40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed my-8">
          <div className="h-16 w-16 bg-black/10 text-black rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-black fill-black" />
          </div>
          <h3 className="text-lg font-bold mb-1">قائمة المفضلة فارغة</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            لم تقم بـإضافة أي منتجات إلى قائمة المفضلة بعد. يمكنك تصفح المنتجات والضغط على أيقونة القلب للإضافة.
          </p>
          <Link href="/shop">
            <Button className="rounded-xl gap-2 font-bold px-6 bg-black text-white hover:bg-black/90">
              <ShoppingBag className="h-4 w-4" /> تصفح المنتجات الآن
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
