import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Star,
  Share2,
  QrCode,
  Edit,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import RelatedProducts from "@/components/RelatedProducts";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
  sku: string;
  saleUnit?: string;
  qrCode?: string;
  categoryId?: { name: string; nameAr: string };
}

interface Review {
  _id: string;
  customerId?: { _id: string; name: string };
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const saleUnitMap: Record<string, string> = {
  piece: "قطعة",
  box: "علبة",
  jar: "برطمان",
  stand: "استاند",
  carton: "كرتونة",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showQR, setShowQR] = useState(false);

  // Review states
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => apiRequest("GET", `/api/products/${id}`),
    enabled: !!id,
  });

  const { data: productReviewsData, refetch: refetchReviews } = useQuery<{
    reviews: Review[];
    average: number;
    count: number;
  }>({
    queryKey: ["/api/reviews/product", id],
    queryFn: () => apiRequest("GET", `/api/reviews/product/${id}`),
    enabled: !!id,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (payload: { rating: number; comment: string }) => {
      if (editingReviewId) {
        return apiRequest("PUT", `/api/reviews/${editingReviewId}`, payload);
      }
      return apiRequest("POST", `/api/reviews/product/${id}`, payload);
    },
    onSuccess: () => {
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ["/api/settings/stats"] });
      setUserComment("");
      setEditingReviewId(null);
      toast({
        title: editingReviewId ? "تم تعديل التقييم بنجاح ✓" : "تم إضافة التقييم بنجاح ✓",
      });
    },
    onError: (err: any) => {
      toast({
        title: "فشل إرسال التقييم",
        description: err?.message || "يرجى التأكد من تسجيل الدخول",
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return apiRequest("DELETE", `/api/reviews/${reviewId}`);
    },
    onSuccess: () => {
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ["/api/settings/stats"] });
      toast({ title: "تم حذف التقييم بنجاح ✓" });
    },
    onError: (err: any) => {
      toast({
        title: "فشل حذف التقييم",
        description: err?.message || "غير مصرح بالحذف",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <p className="text-xl font-medium">المنتج غير موجود</p>
          <Link href="/shop">
            <Button className="mt-4">العودة للمتجر</Button>
          </Link>
        </div>
      </div>
    );
  }

  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const inStock = product.stock > 0;

  const handleAddToCart = () => {
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
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product._id,
        name: product.name,
        nameAr: product.nameAr,
        price,
        image: product.images[0],
      });
    }
    toast({
      title: "تم الإضافة للسلة ✓",
      description: `${product.nameAr} (${qty} ${saleUnitMap[product.saleUnit || "piece"]})`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.nameAr,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "تم نسخ رابط المنتج ✓" });
    }
  };

  const handleStartEditReview = (review: Review) => {
    setEditingReviewId(review._id);
    setUserRating(review.rating);
    setUserComment(review.comment || "");
  };

  const reviewsList = productReviewsData?.reviews || [];
  const reviewsAvg = productReviewsData?.average || 0;
  const reviewsCount = productReviewsData?.count || 0;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back button */}
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors font-medium">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> العودة للمتجر
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl bg-muted overflow-hidden border-2 border-transparent shadow-sm">
            {product.images[selectedImg] ? (
              <img
                src={product.images[selectedImg]}
                alt={product.nameAr}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {hasDiscount && (
              <div className="absolute top-3 rtl:right-3 ltr:left-3 bg-foreground text-background text-xs font-black px-3 py-1 rounded-full">
                -{Math.round(((product.price - price) / product.price) * 100)}%
              </div>
            )}
          </div>

          {/* Thumbnail list */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`relative h-20 w-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImg === i
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          {product.categoryId && (
            <Badge variant="secondary" className="font-bold">{product.categoryId.nameAr}</Badge>
          )}

          <h1 className="text-2xl sm:text-3xl font-black">{product.nameAr}</h1>

          {/* Rating Summary */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(reviewsAvg) ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
            <span className="text-sm font-bold">{reviewsAvg > 0 ? reviewsAvg : "0.0"}</span>
            <span className="text-xs text-muted-foreground">({reviewsCount} تقييم)</span>
          </div>

          {product.brand && (
            <p className="text-sm text-muted-foreground">
              الماركة: <span className="font-bold text-foreground">{product.brand}</span>
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground">{formatPrice(price)}</span>
              <span className="text-sm text-muted-foreground font-medium">
                / {saleUnitMap[product.saleUnit || "piece"]}
              </span>
            </div>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${inStock ? "bg-foreground" : "bg-muted-foreground/40"}`} />
            <span className={`text-sm font-bold ${inStock ? "text-foreground" : "text-muted-foreground"}`}>
              {inStock ? `متوفر (${product.stock} قطعة)` : "نفدت الكمية"}
            </span>
          </div>

          <Separator />

          {/* Description */}
          {product.descriptionAr && (
            <div>
              <h3 className="font-bold text-base mb-2">الوصف والمواصفات</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.descriptionAr}
              </p>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          {inStock && (
            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center border-2 rounded-xl">
                <button
                  className="px-3 py-2 text-lg hover:bg-muted transition-colors font-bold"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="px-4 py-2 font-black w-12 text-center">{qty}</span>
                <button
                  className="px-3 py-2 text-lg hover:bg-muted transition-colors font-bold"
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                >
                  +
                </button>
              </div>

              <Button className="flex-1 gap-2 h-12 rounded-xl font-black shadow-md" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4" /> إضافة للسلة
              </Button>

              {product.qrCode && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl border-2"
                  onClick={() => setShowQR(true)}
                  title="عرض QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* SKU */}
          <p className="text-xs text-muted-foreground pt-2">
            رمز المنتج (SKU): {product.sku}
          </p>
        </div>
      </div>

      {/* ===== REVIEWS SECTION (CREATE, EDIT, DELETE) ===== */}
      <section className="mt-16 border-t pt-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <MessageSquare className="h-6 w-6" /> تقييمات وآراء العملاء
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              شارك تجربتك ورأيك حول هذا المنتج
            </p>
          </div>
        </div>

        {/* Submit or Edit Form */}
        <div className="bg-muted/20 border-2 rounded-2xl p-6 mb-10 max-w-2xl">
          <h3 className="font-bold text-base mb-4">
            {editingReviewId ? "تعديل تقييمك الحالي" : "إضافة تقييم جديد"}
          </h3>

          {!isAuthenticated ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-4">
                يجب تسجيل الدخول لإتاحة إضافة أو تعديل تقييمك للمنتج
              </p>
              <Link href="/login">
                <Button className="rounded-xl font-bold">تسجيل الدخول الآن</Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitReviewMutation.mutate({ rating: userRating, comment: userComment });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-bold block mb-2">تحديد التقييم بالنجوم:</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= userRating
                            ? "fill-foreground text-foreground"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-2">تعليقك ورأيك في المنتج:</label>
                <Textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="اكتب تعليقك هنا بكل صراحة..."
                  className="bg-white border-2 rounded-xl resize-none min-h-[100px]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submitReviewMutation.isPending}
                  className="rounded-xl font-bold px-6"
                >
                  {submitReviewMutation.isPending
                    ? "جاري الحفظ..."
                    : editingReviewId
                    ? "حفظ التعديلات"
                    : "نشر التقييم"}
                </Button>
                {editingReviewId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingReviewId(null);
                      setUserComment("");
                    }}
                    className="rounded-xl border-2"
                  >
                    إلغاء التعديل
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-4 max-w-3xl">
          {reviewsList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl">
              <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-bold text-foreground">لا توجد تقييمات لهذا المنتج بعد</p>
              <p className="text-xs text-muted-foreground mt-1">كن أول من يضيف تقييماً لهذا المنتج!</p>
            </div>
          ) : (
            reviewsList.map((rev) => {
              const isOwner = customer && rev.customerId && String(rev.customerId._id || rev.customerId) === String(customer.id);
              return (
                <div
                  key={rev._id}
                  className="bg-white border-2 rounded-2xl p-5 shadow-xs transition-all hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-foreground text-background font-black text-sm flex items-center justify-center shrink-0">
                        {rev.customerName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-none">{rev.customerName}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{formatDate(rev.createdAt)}</p>
                      </div>
                    </div>

                    {/* Customer Edit & Delete buttons */}
                    {isOwner && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEditReview(rev)}
                          className="h-8 px-2.5 text-xs gap-1 font-bold"
                        >
                          <Edit className="h-3.5 w-3.5" /> تعديل
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("هل أنت متأكد من حذف تقييمك؟")) {
                              deleteReviewMutation.mutate(rev._id);
                            }
                          }}
                          className="h-8 px-2.5 text-xs gap-1 text-destructive hover:bg-destructive/10 font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> حذف
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3.5 w-3.5 ${
                          idx < rev.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {rev.comment || "تقييم بدون تعليق"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Related products */}
      <div className="mt-16">
        <RelatedProducts productId={product._id} />
      </div>

      {product.qrCode && showQR && (
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="font-bold">امسح الكود ضوئيًا</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <img
                src={product.qrCode}
                alt={`QR Code for ${product.nameAr}`}
                className="w-full h-full rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
