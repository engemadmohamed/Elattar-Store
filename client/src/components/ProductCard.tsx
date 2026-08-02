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
      <div className="product-card-hover group relative rounded-2xl border-2 border-transparent bg-white overflow-hidden cursor-pointer will-change-transform"
        style={{ boxShadow: "0 2px 16px hsl(0 0% 0% / 0.07)" }}
      >
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.nameAr}
              className="h-full w-full object-cover transition-transform duration-400 group-hover:scale-108"
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
            className="absolute top-2.5 rtl:left-2.5 ltr:right-2.5 z-10 h-8 w-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`h-4 w-4 ${isFav ? "text-rose-500 fill-rose-500" : "text-muted-foreground"}`} />
          </button>

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-2.5 rtl:right-2.5 ltr:left-2.5 bg-foreground text-background text-[11px] font-black px-2 py-0.5 rounded-full">
              -{Math.round(((product.price - price) / product.price) * 100)}%
            </div>
          )}

          {/* Out of stock overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center">
              <span className="text-xs font-bold text-muted-foreground border-2 px-3 py-1 rounded-full">نفدت الكمية</span>
            </div>
          )}

          {/* Quick view overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white rounded-full p-2.5 shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Eye className="h-4 w-4 text-foreground" />
            </div>
          </div>

          {/* Add to cart — shown on hover */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-2">
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="w-full py-2 bg-foreground text-background text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-foreground/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              أضف للسلة
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5">
          <div className="flex items-center justify-between gap-1 mb-1">
            {categoryName ? (
              <span className="inline-block text-[10px] font-extrabold text-foreground/80 bg-muted px-2 py-0.5 rounded-md truncate max-w-[120px]">
                {categoryName}
              </span>
            ) : product.brand ? (
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">
                {product.brand}
              </p>
            ) : null}
          </div>

          <h3 className="text-sm font-bold leading-snug line-clamp-2 mb-1">
            {product.nameAr}
          </h3>

          {/* Star rating - always visible */}
          <StarRating average={reviewSummary?.average || 0} count={reviewSummary?.count || 0} />

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-base text-foreground">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            {/* Desktop add button */}
            <Button
              size="sm"
              className="h-8 w-8 p-0 rounded-xl opacity-0 group-hover:opacity-0 md:opacity-100 transition-opacity"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
