import { ShoppingCart, Eye, Star, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Product {
  _id: string;
  name: string;
  nameAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
  colors?: string[];
  categoryId?: { name: string; nameAr: string } | string;
}

interface ReviewSummary {
  average: number;
  count: number;
}

function StarRating({ average, count }: { average: number; count: number }) {
  const fullStars = Math.floor(average);
  const hasHalf = average - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3 w-3 ${
              s <= fullStars
                ? "fill-foreground text-foreground"
                : s === fullStars + 1 && hasHalf
                ? "fill-foreground/40 text-foreground"
                : "fill-transparent text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">
        ({count})
      </span>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useCustomerAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const isFav = isInWishlist(product._id);
  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const inStock = product.stock > 0;

  const categoryName = typeof product.categoryId === "object" && product.categoryId !== null
    ? product.categoryId.nameAr
    : null;

  // Fetch review summary for this product
  const { data: reviewSummary } = useQuery<ReviewSummary>({
    queryKey: [`/api/reviews/product/${product._id}/summary`],
    queryFn: () => apiRequest("GET", `/api/reviews/product/${product._id}/summary`),
    staleTime: 5 * 60 * 1000,
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: "🔒 تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول أولاً لإضافة المنتجات إلى المفضلة",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    toggleWishlist(product._id);
    toast({
      title: isFav ? "تم الإزالة من المفضلة" : "تم الإضافة للمفضلة ❤️",
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    if (!isAuthenticated) {
      toast({
        title: "سجّل دخولك أولاً",
        description: "يجب تسجيل الدخول قبل الإضافة للسلة",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    // If product has color options, require customer to select color on details page
    if (product.colors && product.colors.length > 0) {
      toast({
        title: "اختر اللون المطلوب 🎨",
        description: "يرجى تحديد اللون قبل الإضافة إلى السلة",
      });
      navigate(`/product/${product._id}`);
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      nameAr: product.nameAr,
      price,
      image: product.images[0],
    });
    toast({ title: "تم الإضافة للسلة ✓", description: product.nameAr });
  };

  return (
    <Link href={`/product/${product._id}`}>
      <div
        className="product-card-ultra card-shine group relative rounded-3xl border border-border/60 bg-white overflow-hidden cursor-pointer will-change-transform flex flex-col h-full hover:border-black/20"
        style={{ boxShadow: "0 4px 20px hsl(0 0% 0% / 0.05)" }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted/40 overflow-hidden flex items-center justify-center">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.nameAr}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleWishlist}
            className="absolute top-3 rtl:left-3 ltr:right-3 z-30 h-9 w-9 rounded-full bg-white/90 backdrop-blur-md border border-black/10 flex items-center justify-center shadow-md hover:scale-110 transition-all duration-200 active:scale-95 cursor-pointer"
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`h-4.5 w-4.5 transition-colors ${isFav ? "text-rose-600 fill-rose-600" : "text-foreground/80 hover:text-rose-600"}`} />
          </button>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 rtl:right-3 ltr:left-3 z-10 bg-black text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md border border-white/20">
              -{Math.round(((product.price - price) / product.price) * 100)}%
            </div>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
              <span className="text-xs font-black text-foreground bg-white border border-border px-3.5 py-1.5 rounded-full shadow-md">
                نفدت الكمية 🔒
              </span>
            </div>
          )}

          {/* Quick view overlay icon */}
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-10">
            <div className="bg-white text-black rounded-full p-3 shadow-xl transform scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-black hover:text-white">
              <Eye className="h-4 w-4" />
            </div>
          </div>

          {/* Add to cart — shown on hover */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-2.5 z-20">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full py-2.5 bg-black text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black/90 shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              أضف للسلة
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="p-4 flex flex-col justify-between flex-1 bg-white">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              {categoryName ? (
                <span className="inline-block text-[10px] font-extrabold text-foreground/90 bg-muted/80 px-2.5 py-0.5 rounded-full border border-black/5 truncate max-w-[130px]">
                  {categoryName}
                </span>
              ) : product.brand ? (
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wide truncate">
                  {product.brand}
                </p>
              ) : null}
            </div>

            <h3 className="text-sm font-black text-foreground leading-snug line-clamp-2 mb-1.5 transition-colors group-hover:text-black">
              {product.nameAr}
            </h3>

            {/* Star rating */}
            <StarRating average={reviewSummary?.average || 0} count={reviewSummary?.count || 0} />
          </div>

          <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/40">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-base text-foreground">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground/70 line-through font-semibold">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {/* Quick add button */}
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-xl bg-black text-white hover:bg-black/80 shadow-xs"
              onClick={handleAddToCart}
              disabled={!inStock}
              title="إضافة للسلة"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
