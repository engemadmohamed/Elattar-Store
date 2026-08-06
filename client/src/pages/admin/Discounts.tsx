import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Percent,
  Tags,
  RefreshCw,
  Trash2,
  Check,
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  FolderTree,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Product } from "@/components/ProductCard";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon?: string;
  image?: string;
  discountPercent?: number;
  parentId?: string | null;
}

export default function Discounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [discountInputs, setDiscountInputs] = useState<Record<string, string>>({});
  const [expandedProds, setExpandedProds] = useState<Record<string, boolean>>({});
  const [expandedSubcats, setExpandedSubcats] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Categories
  const { data: categories = [], isLoading: isLoadingCats } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  // Fetch Products
  const { data: productsData, isLoading: isLoadingProds } = useQuery<any>({
    queryKey: ["/api/products"],
    queryFn: () => apiRequest("GET", "/api/products"),
  });

  const products: Product[] = Array.isArray(productsData)
    ? productsData
    : productsData?.products || [];

  // Apply Category Discount Mutation
  const applyDiscountMutation = useMutation({
    mutationFn: async ({ categoryId, discountPercent }: { categoryId: string; discountPercent: number }) => {
      return apiRequest("POST", `/api/categories/${categoryId}/apply-discount`, {
        discountPercent,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "✨ تم التحديث بنجاح",
        description: data.message || "تم تطبيق الخصم على منتجات الفئة",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (err: any) => {
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء تطبيق الخصم",
        variant: "destructive",
      });
    },
  });

  const handleApplyDiscount = (categoryId: string, defaultVal: number = 0) => {
    const inputVal = discountInputs[categoryId] !== undefined ? discountInputs[categoryId] : String(defaultVal);
    const percent = Math.min(100, Math.max(0, Number(inputVal) || 0));
    applyDiscountMutation.mutate({ categoryId, discountPercent: percent });
  };

  const handleClearDiscount = (categoryId: string) => {
    setDiscountInputs((prev) => ({ ...prev, [categoryId]: "0" }));
    applyDiscountMutation.mutate({ categoryId, discountPercent: 0 });
  };

  // Helper to count products per category (including subcategories)
  const getProductsForCategory = (catId: string) => {
    const targetId = String(catId);
    const descendantIds = new Set<string>([targetId]);
    const queue = [targetId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = categories.filter((c) => {
        if (!c.parentId) return false;
        const pId = typeof c.parentId === "object"
          ? String((c.parentId as any)._id || c.parentId)
          : String(c.parentId);
        return pId === current;
      });
      for (const child of children) {
        const childId = String(child._id);
        if (!descendantIds.has(childId)) {
          descendantIds.add(childId);
          queue.push(childId);
        }
      }
    }

    return products.filter((p) => {
      if (!p.categoryId) return false;
      const catVal = p.categoryId;
      const rawId = typeof catVal === "object" && catVal !== null
        ? String((catVal as any)._id || catVal)
        : String(catVal);
      return descendantIds.has(rawId);
    });
  };

  const activeDiscountCats = categories.filter((c) => (c.discountPercent || 0) > 0).length;
  const totalDiscountedProducts = products.filter((p) => p.salePrice && p.salePrice < p.price).length;

  const rootCategories = categories.filter((c) => !c.parentId);

  const filteredRootCategories = rootCategories.filter((cat) => {
    const nameMatches = cat.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const subMatches = categories.some((sub) => sub.parentId === cat._id && (
      sub.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    return nameMatches || subMatches;
  });

  const toggleSubcats = (catId: string) => {
    setExpandedSubcats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleProds = (catId: string) => {
    setExpandedProds((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const renderCategoryCard = (cat: Category, isSubcat = false) => {
    const catProducts = getProductsForCategory(cat._id);
    const parentCat = cat.parentId ? categories.find((c) => c._id === cat.parentId) : null;
    const effectiveDiscount =
      cat.discountPercent && cat.discountPercent > 0
        ? cat.discountPercent
        : parentCat && parentCat.discountPercent && parentCat.discountPercent > 0
        ? parentCat.discountPercent
        : 0;

    const currentDiscount = effectiveDiscount;
    const inputVal = discountInputs[cat._id] !== undefined ? discountInputs[cat._id] : String(currentDiscount);
    const isProdsExpanded = !!expandedProds[cat._id];
    const isSubcatsExpanded = !!expandedSubcats[cat._id];
    const subcats = categories.filter((c) => c.parentId === cat._id);
    const discountedProdsCount = catProducts.filter((p) => p.salePrice && p.salePrice < p.price).length;

    return (
      <div
        key={cat._id}
        className={`bg-card border rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md ${
          isSubcat ? "ms-6 border-s-4 border-s-black/30 bg-muted/10" : ""
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Category Info with Image */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-muted border overflow-hidden shrink-0 flex items-center justify-center text-xl">
              {cat.image ? (
                <img src={cat.image} alt={cat.nameAr} className="h-full w-full object-cover" />
              ) : (
                <span>{cat.icon || "📦"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-extrabold ${isSubcat ? "text-base" : "text-lg"}`}>{cat.nameAr}</h3>
                <Badge variant={currentDiscount > 0 ? "default" : "outline"} className="text-xs font-bold">
                  {currentDiscount > 0 ? `خصم ${currentDiscount}%` : "بدون خصم"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {catProducts.length} منتج في الفئة
                {subcats.length > 0 && ` • ${subcats.length} فئة فرعية`}
              </p>
            </div>
          </div>

          {/* Discount Input & Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border">
              <span className="text-xs font-bold text-muted-foreground px-2">نسبة الخصم %:</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={inputVal}
                onChange={(e) =>
                  setDiscountInputs({ ...discountInputs, [cat._id]: e.target.value })
                }
                className="w-20 h-9 rounded-lg text-center font-bold text-sm bg-white dark:bg-zinc-900 border"
              />
            </div>

            <Button
              size="sm"
              onClick={() => handleApplyDiscount(cat._id, currentDiscount)}
              disabled={applyDiscountMutation.isPending}
              className="rounded-xl font-bold gap-1.5 bg-black text-white hover:bg-black/90"
            >
              <Check className="h-4 w-4" />
              تطبيق الخصم
            </Button>

            {currentDiscount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplyDiscount(cat._id, currentDiscount)}
                disabled={applyDiscountMutation.isPending}
                title="إعادة توحيد خصم هذه الفئة على كافة المنتجات حتى لو تم تغيير منتج فردياً"
                className="rounded-xl font-bold gap-1.5 border-foreground/20 hover:bg-accent"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة توحيد خصم الفئة
              </Button>
            )}

            {(currentDiscount > 0 || discountedProdsCount > 0) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleClearDiscount(cat._id)}
                disabled={applyDiscountMutation.isPending}
                className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
              >
                <Trash2 className="h-4 w-4" />
                إزالة الخصم
              </Button>
            )}

            {subcats.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleSubcats(cat._id)}
                className="rounded-xl text-xs gap-1 font-bold border-foreground/20"
              >
                <FolderTree className="h-3.5 w-3.5" />
                {isSubcatsExpanded ? "إخفاء الفئات الفرعية" : `عرض الفئات الفرعية (${subcats.length})`}
                {isSubcatsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleProds(cat._id)}
              className="rounded-xl text-xs gap-1 ms-auto lg:ms-0"
            >
              {isProdsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isProdsExpanded ? "إخفاء المنتجات" : "عرض المنتجات"}
            </Button>
          </div>
        </div>

        {/* Subcategories (if expanded) */}
        {isSubcatsExpanded && subcats.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-fade-in-up">
            <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-1">
              الفئات الفرعية لـ {cat.nameAr}:
            </h4>
            {subcats.map((subcat) => renderCategoryCard(subcat, true))}
          </div>
        )}

        {/* Products List (if expanded) */}
        {isProdsExpanded && (
          <div className="mt-4 pt-4 border-t space-y-2 animate-fade-in-up">
            <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider mb-2">
              منتجات فئة: {cat.nameAr} ({catProducts.length})
            </h4>
            {catProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">لا توجد منتجات مضافة لهذه الفئة بعد.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catProducts.map((prod) => {
                  const hasDisc = prod.salePrice && prod.salePrice < prod.price;
                  const prodDiscPercent = hasDisc
                    ? Math.round(((prod.price - prod.salePrice!) / prod.price) * 100)
                    : 0;

                  return (
                    <div
                      key={prod._id}
                      className="p-3 rounded-xl bg-muted/20 border flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="truncate">
                        <p className="font-bold truncate">{prod.nameAr || prod.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                          <span className={hasDisc ? "line-through opacity-70" : "font-semibold text-foreground"}>
                            {prod.price} ج.م
                          </span>
                          {hasDisc && (
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              {prod.salePrice} ج.م
                            </span>
                          )}
                        </div>
                      </div>
                      {hasDisc && (
                        <Badge variant="secondary" className="font-bold text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 shrink-0">
                          -{prodDiscPercent}%
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout title="صفحة التخفيضات والعروض" subtitle="إدارة خصومات الفئات وتطبيقها وتوحيدها على جميع المنتجات">
      <div className="space-y-6 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center shrink-0">
              <Tags className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي الفئات</p>
              <h3 className="text-2xl font-black">{categories.length}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">فئات نشطة الخصم</p>
              <h3 className="text-2xl font-black">{activeDiscountCats}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">إجمالي المنتجات المخفضة</p>
              <h3 className="text-2xl font-black">{totalDiscountedProducts}</h3>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border">
          <Search className="h-5 w-5 text-muted-foreground shrink-0 ms-2" />
          <Input
            placeholder="ابحث عن فئة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm"
          />
        </div>

        {/* Root Categories List */}
        {isLoadingCats || isLoadingProds ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted/40 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredRootCategories.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-3xl border border-dashed">
            <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-bold text-lg">لا توجد فئات مطابقة</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRootCategories.map((cat) => renderCategoryCard(cat))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
