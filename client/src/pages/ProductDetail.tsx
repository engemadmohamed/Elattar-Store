import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Star,
  Share2,
  QrCode,
  Edit2,
  Trash2,
  Send,
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
import { formatPrice } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import RelatedProducts from "@/components/RelatedProducts";

interface Product {
  _id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  salePrice?: number;
  stock: number;
  images: string[];
  brand?: string;
  sku: string;
  saleUnit?: string;
  colors?: string[];
  qrCode?: string;
  categoryId?: { name: string; nameAr: string };
  ratingAverage?: number;
  ratingCount?: number;
}

interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  customerName: string;
  customerId?: string;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: ReviewItem[];
  average: number;
  count: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { isAuthenticated, customer } = useCustomerAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [selectedImg, setSelectedImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Review form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Fetch product
  const { data: product, isLoading: isProductLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => apiRequest("GET", `/api/products/${id}`),
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery<ReviewsResponse>({
    queryKey: ["/api/reviews/product", id],
    queryFn: () => apiRequest("GET", `/api/reviews/product/${id}`),
    enabled: !!id,
  });

  // Submit / Update review mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) => {
      if (editingReviewId) {
        return apiRequest("PUT", `/api/reviews/${editingReviewId}`, data);
      }
      return apiRequest("POST", `/api/reviews/product/${id}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/product", id] });
      qc.invalidateQueries({ queryKey: ["/api/products", id] });
      toast({ title: editingReviewId ? "تم تعديل تقييمك بنجاح ✓" : "شكراً لتقييمك! تم حفظ التقييم ✓" });
      setUserComment("");
      setEditingReviewId(null);
    },
    onError: (err: Error) => {
      toast({ title: "فشل حفظ التقييم", description: err.message, variant: "destructive" });
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => apiRequest("DELETE", `/api/reviews/${reviewId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/product", id] });
      qc.invalidateQueries({ queryKey: ["/api/products", id] });
      toast({ title: "تم حذف تقييمك بنجاح ✓" });
      setUserComment("");
      setEditingReviewId(null);
    },
    onError: (err: Error) => {
      toast({ title: "فشل حذف التقييم", description: err.message, variant: "destructive" });
    },
  });

  if (isProductLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="mx-auto max-w-5xl space-y-4">
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

  const averageRating = reviewsData?.average ?? product.ratingAverage ?? 0;
  const reviewsCount = reviewsData?.count ?? product.ratingCount ?? 0;
  const reviewsList = reviewsData?.reviews || [];

  // Check if current user has reviewed this product
  const myReview = customer
    ? reviewsList.find((r) => r.customerId === customer.id || r.customerName === customer.name)
    : null;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "سجّل دخولك أولاً",
        description: "يجب تسجيل الدخول قبل الإضافة للسلة",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    if (!inStock) {
      toast({
        title: "المنتج غير متوفر",
        description: "عذراً، هذا المنتج نفد من المخزون حالياً",
        variant: "destructive",
      });
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast({
        title: "الرجاء اختيار اللون",
        description: "يرجى تحديد اللون المطلوب قبل الإضافة إلى السلة",
        variant: "destructive",
      });
      return;
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        productId: product._id,
        name: product.name,
        nameAr: product.nameAr,
        price,
        image: product.images[0],
        color: selectedColor || undefined,
      });
    }
    toast({
      title: "تم إضافة المنتج للسلة ✓",
      description: `${qty}x ${product.nameAr}`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.nameAr, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "تم نسخ الرابط" });
    }
  };

  const handleStartEditMyReview = () => {
    if (!myReview) return;
    setEditingReviewId(myReview._id);
    setUserRating(myReview.rating);
    setUserComment(myReview.comment || "");
  };

  return (
    <div className="min-h-screen py-8 px-4 animate-in fade-in duration-500">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.nameAr}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl border bg-muted overflow-hidden">
              {product.images[selectedImg] ? (
                <a
                  href={product.images[selectedImg]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="عرض الصورة بحجمها الكامل"
                >
                  <img
                    src={product.images[selectedImg]}
                    alt={product.nameAr}
                    className="h-full w-full object-cover cursor-zoom-in"
                  />
                </a>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-8xl">
                  📦
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`h-16 w-16 rounded-lg border-2 overflow-hidden shrink-0 transition-colors ${
                      selectedImg === i ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {product.categoryId && (
              <Badge variant="secondary">{product.categoryId.nameAr}</Badge>
            )}

            <h1 className="text-2xl font-bold">{product.nameAr}</h1>

            {/* Dynamic Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(averageRating)
                        ? "text-foreground fill-foreground"
                        : "text-muted-foreground/30 fill-transparent"
                    }`}
                  />
                ))}
              </div>
              {averageRating > 0 && (
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {averageRating}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                ({reviewsCount} {reviewsCount === 1 ? "تقييم" : "تقييمات"})
              </span>
            </div>

            {product.brand && (
              <p className="text-sm text-muted-foreground">
                الماركة:{" "}
                <span className="font-medium text-foreground">
                  {product.brand}
                </span>
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 my-2">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(price)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${inStock ? "bg-foreground" : "bg-red-500"}`}
              />
              <span
                className={`text-sm font-semibold ${inStock ? "text-foreground" : "text-red-500"}`}
              >
                {inStock ? `متوفر (${product.stock} قطعة)` : "نفدت الكمية"}
              </span>
            </div>

            {/* Sale Unit Display (Item #8) */}
            {product.saleUnit && (
              <div className="flex items-center gap-2 text-sm bg-muted/40 px-3.5 py-2 rounded-xl border w-fit">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">وحدة البيع:</span>
                <span className="font-bold text-foreground">
                  {product.saleUnit === "piece" ? "قطعة" :
                   product.saleUnit === "box" ? "علبة" :
                   product.saleUnit === "jar" ? "برطمان" :
                   product.saleUnit === "stand" ? "استاند" :
                   product.saleUnit === "carton" ? "كرتونة" :
                   product.saleUnit === "dozen" ? "دستة" : product.saleUnit}
                </span>
              </div>
            )}

            {/* Colors Selector (Item #1) */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">اختر اللون:</span>
                  {selectedColor && <Badge variant="secondary" className="font-bold">{selectedColor}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-3.5 py-1.5 rounded-xl border text-sm font-semibold transition-all ${
                        selectedColor === c
                          ? "bg-black text-white border-black shadow-sm scale-105"
                          : "bg-background text-foreground hover:bg-accent border-input"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Description */}
            {product.descriptionAr && (
              <div>
                <h3 className="font-medium mb-2">الوصف</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.descriptionAr}
                </p>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            {inStock && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 rounded-xl overflow-hidden">
                  <button
                    className="px-3 py-2 text-lg hover:bg-muted transition-colors font-bold"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold w-12 text-center">
                    {qty}
                  </span>
                  <button
                    className="px-3 py-2 text-lg hover:bg-muted transition-colors font-bold"
                    onClick={() =>
                      setQty((q) => Math.min(product.stock, q + 1))
                    }
                  >
                    +
                  </button>
                </div>
                <Button className="flex-1 gap-2 h-11 rounded-xl font-bold" onClick={handleAddToCart}>
                  <ShoppingCart className="h-4 w-4" /> إضافة للسلة
                </Button>
                {product.qrCode && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl border-2"
                    onClick={() => setShowQR(true)}
                    title="عرض QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* SKU */}
            <p className="text-xs text-muted-foreground">
              رمز المنتج (SKU): {product.sku}
            </p>
          </div>
        </div>

        {/* ===== REVIEWS SECTION ===== */}
        <div className="mt-16 border-t pt-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">
                <MessageSquare className="h-6 w-6" /> تقييمات العملاء
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                استعرض تجارب وتقييمات المشترين لهذا المنتج
              </p>
            </div>
            <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-2xl border">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(averageRating)
                        ? "text-foreground fill-foreground"
                        : "text-muted-foreground/30 fill-transparent"
                    }`}
                  />
                ))}
              </div>
              <span className="font-black text-base">{averageRating > 0 ? averageRating : "0"} / 5</span>
            </div>
          </div>

          {/* Add / Edit Review Form */}
          {isAuthenticated ? (
            <div className="mb-10 p-6 rounded-3xl border-2 bg-muted/10 space-y-4">
              <h3 className="font-bold text-base">
                {editingReviewId ? "تعديل تقييمك الحالي" : myReview ? "أنت أضفت تقييماً لهذا المنتج" : "إضافة تقييمك للمنتج"}
              </h3>

              {myReview && !editingReviewId ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= myReview.rating
                              ? "text-foreground fill-foreground"
                              : "text-muted-foreground/30 fill-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm font-medium">{myReview.comment || "بدون تعليق مكتوب"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 rounded-xl"
                      onClick={handleStartEditMyReview}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive hover:bg-destructive/10 rounded-xl"
                      onClick={() => deleteReviewMutation.mutate(myReview._id)}
                      disabled={deleteReviewMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Star Picker */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">حدد التقييم بالنجوم</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setUserRating(s)}
                          className="p-1 hover:scale-125 transition-transform"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              s <= userRating
                                ? "text-foreground fill-foreground"
                                : "text-muted-foreground/30 fill-transparent"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">تعليقك (اختياري)</label>
                    <Textarea
                      placeholder="اكتب تجربتك مع المنتج هنا..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      className="rounded-2xl border-2 focus:border-foreground"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitReviewMutation.mutate({ rating: userRating, comment: userComment })}
                      disabled={submitReviewMutation.isPending}
                      className="gap-2 rounded-xl font-bold"
                    >
                      <Send className="h-4 w-4" />
                      {submitReviewMutation.isPending ? "جاري الحفظ..." : editingReviewId ? "حفظ التعديل" : "إرسال التقييم"}
                    </Button>
                    {editingReviewId && (
                      <Button
                        variant="outline"
                        onClick={() => { setEditingReviewId(null); setUserComment(""); }}
                        className="rounded-xl"
                      >
                        إلغاء
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-10 p-6 rounded-3xl border-2 bg-muted/10 text-center">
              <p className="text-sm font-medium mb-3">سجّل دخولك لإضافة تقييمك لهذا المنتج</p>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl border-2 font-bold">تسجيل الدخول</Button>
              </Link>
            </div>
          )}

          {/* Reviews List */}
          {reviewsList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-medium">لا توجد تقييمات مكتوبة لهذا المنتج بعد</p>
              <p className="text-xs mt-1">كن أول من يقيّم هذا المنتج!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsList.map((rev) => (
                <div key={rev._id} className="p-5 rounded-2xl border-2 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{rev.customerName || "عميل متجر المهندس"}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= rev.rating
                            ? "text-foreground fill-foreground"
                            : "text-muted-foreground/30 fill-transparent"
                        }`}
                      />
                    ))}
                  </div>
                  {rev.comment && <p className="text-sm text-muted-foreground leading-relaxed">{rev.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related products */}
        <div className="mt-16">
          <RelatedProducts productId={product._id} />
        </div>
      </div>

      {product.qrCode && showQR && (
        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>امسح الكود ضوئيًا</DialogTitle>
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
