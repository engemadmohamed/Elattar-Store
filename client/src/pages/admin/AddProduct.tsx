import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Plus, X, Upload, QrCode } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import QRModal from "@/components/QRModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ADMIN_BASE } from "@/lib/admin-path";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
}

interface ExistingProduct {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  categoryId: { _id: string; name: string; nameAr: string; slug: string };
  sku: string;
  brand?: string;
  tags: string[];
  images: string[];
  isActive: boolean;
}

function generateSku() {
  return (
    "EL-" +
    Date.now().toString().slice(-6) +
    "-" +
    Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
  );
}

export default function AddProduct() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    salePrice: "",
    stock: "0",
    categoryId: "", // This will be the ID of the most specific category
    sku: generateSku(),
    brand: "",
    tags: [] as string[],
    images: [] as string[],
    isActive: true,
  });
  const [tagInput, setTagInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [showQR, setShowQR] = useState(false);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const { data: existingProduct, isLoading: isLoadingProduct } =
    useQuery<ExistingProduct>({
      queryKey: ["/api/products", id],
      queryFn: () => apiRequest("GET", `/api/products/${id}`),
      enabled: isEdit,
    });

  // Helper to find all ancestors of a category
  const getCategoryAncestors = (
    catId: string,
    allCats: Category[],
  ): string[] => {
    const path: string[] = [];
    let current = allCats.find((c) => c._id === catId);
    while (current) {
      path.unshift(current._id);
      current = allCats.find((c) => c._id === current.parentId);
    }
    return path;
  };

  useEffect(() => {
    if (!existingProduct || !categories) return;

    const productCategoryId = existingProduct.categoryId._id;
    // Reconstruct the category path from the product's category ID
    const path = getCategoryAncestors(productCategoryId, categories);
    setCategoryPath(path);

    setForm({
      name: existingProduct.name,
      nameAr: existingProduct.nameAr,
      description: existingProduct.description,
      descriptionAr: existingProduct.descriptionAr,
      price: String(existingProduct.price),
      salePrice: existingProduct.salePrice
        ? String(existingProduct.salePrice)
        : "",
      stock: String(existingProduct.stock),
      categoryId: productCategoryId,
      sku: existingProduct.sku,
      brand: existingProduct.brand || "",
      tags: existingProduct.tags || [],
      images: existingProduct.images || [],
      isActive: existingProduct.isActive,
    });
  }, [existingProduct, categories]);

  // Update the final categoryId in the form whenever the path changes
  useEffect(() => {
    const finalCategoryId =
      categoryPath.length > 0 ? categoryPath[categoryPath.length - 1] : "";
    set("categoryId", finalCategoryId);
  }, [categoryPath]);

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val as any }));

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      set("tags", [...form.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      set("images", [...form.images, imageUrl.trim()]);
      setImageUrl("");
    }
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    const token = localStorage.getItem("el-attar-token");
    try {
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        toast({
          title: "فشل رفع الصورة",
          description: data.message || `خطأ من السيرفر (${res.status})`,
          variant: "destructive",
        });
        return;
      }
      set("images", [...form.images, data.url]);
      toast({ title: "تم رفع الصورة ✓" });
    } catch (err) {
      toast({
        title: "فشل رفع الصورة",
        description: "تعذر الاتصال بالسيرفر، تأكد من الاتصال بالإنترنت",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: (data: typeof form) => {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
        stock: parseInt(data.stock),
      };
      return apiRequest<{ _id: string }>(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/products/${id}` : "/api/products",
        payload,
      );
    },
    onSuccess: (data) => {
      setSavedProductId(data._id);
      toast({
        title: isEdit ? "تم تحديث المنتج ✓" : "تم إضافة المنتج ✓",
        description: "يمكنك الآن طباعة QR Code",
      });
    },
    onError: (err) =>
      toast({
        title: "فشل الحفظ",
        description: String(err),
        variant: "destructive",
      }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameAr || !form.price || !form.categoryId) {
      toast({ title: "الرجاء ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`${ADMIN_BASE}/products`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
              </h1>
            </div>
          </div>
          {savedProductId && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowQR(true)}
            >
              <QrCode className="h-4 w-4" /> طباعة QR Code
            </Button>
          )}
        </div>

        {isEdit && isLoadingProduct ? (
          <div className="max-w-4xl space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">معلومات المنتج</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>اسم المنتج *</Label>
                      <Input
                        value={form.nameAr}
                        onChange={(e) => set("nameAr", e.target.value)}
                        placeholder="مثال: قلم بيك أزرق"
                        required
                      />
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        rows={3}
                        value={form.descriptionAr}
                        onChange={(e) => set("descriptionAr", e.target.value)}
                        placeholder="وصف تفصيلي للمنتج..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing & Stock */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">السعر والمخزون</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>السعر (ج.م) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.price}
                          onChange={(e) => set("price", e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div>
                        <Label>سعر البيع (خصم)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.salePrice}
                          onChange={(e) => set("salePrice", e.target.value)}
                          placeholder="اتركه فارغاً"
                        />
                      </div>
                      <div>
                        <Label>الكمية المتاحة *</Label>
                        <Input
                          type="number"
                          min="0"
                          value={form.stock}
                          onChange={(e) => set("stock", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>SKU *</Label>
                        <div className="flex gap-2">
                          <Input
                            value={form.sku}
                            onChange={(e) => set("sku", e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => set("sku", generateSku())}
                          >
                            جديد
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>الماركة / العلامة التجارية</Label>
                        <Input
                          value={form.brand}
                          onChange={(e) => set("brand", e.target.value)}
                          placeholder="مثال: Bic, Faber-Castell"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Images */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">صور المنتج</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.images.map((img, i) => (
                          <div key={i} className="relative h-20 w-20">
                            <img
                              src={img}
                              alt=""
                              className="h-full w-full object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                set(
                                  "images",
                                  form.images.filter((_, j) => j !== i),
                                )
                              }
                              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="رابط الصورة (URL)..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addImageUrl}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label
                        htmlFor="img-upload"
                        className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors"
                      >
                        {uploading ? (
                          <span className="text-sm text-primary">
                            جاري رفع الصورة...
                          </span>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              رفع صورة من الجهاز (حتى 5 ميجابايت)
                            </span>
                          </>
                        )}
                      </Label>
                      <input
                        id="img-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">الفئة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <CategorySelector
                        categories={categories || []}
                        path={categoryPath}
                        onPathChange={setCategoryPath}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      الكلمات المفتاحية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="أضف كلمة..."
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addTag())
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {form.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {form.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() =>
                                set(
                                  "tags",
                                  form.tags.filter((t) => t !== tag),
                                )
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">نشر المنتج</p>
                      <p className="text-xs text-muted-foreground">
                        ظاهر للعملاء
                      </p>
                    </div>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => set("isActive", v)}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending
                    ? "جاري الحفظ..."
                    : isEdit
                      ? "حفظ التعديلات"
                      : "إضافة المنتج"}
                </Button>

                {savedProductId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowQR(true)}
                  >
                    <QrCode className="h-4 w-4" /> عرض وطباعة QR Code
                  </Button>
                )}
              </div>
            </div>
          </form>
        )}
      </main>

      {savedProductId && showQR && (
        <QRModal
          productId={savedProductId}
          productName={form.nameAr}
          productSku={form.sku}
          price={parseFloat(form.salePrice || form.price)}
          open={showQR}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}

interface CategorySelectorProps {
  categories: Category[];
  path: string[];
  onPathChange: (newPath: string[]) => void;
  level?: number;
}

function CategorySelector({
  categories,
  path,
  onPathChange,
  level = 0,
}: CategorySelectorProps) {
  const parentId = level === 0 ? null : path[level - 1];
  const currentLevelCategories = categories.filter(
    (c) => c.parentId === parentId,
  );

  if (currentLevelCategories.length === 0 && level > 0) {
    return null;
  }

  const selectedValue = path[level] || "";

  const handleValueChange = (value: string) => {
    const newPath = [...path.slice(0, level), value];
    onPathChange(newPath);
  };

  return (
    <div className="space-y-3">
      <Label>{level === 0 ? "الفئة الرئيسية *" : `فئة فرعية ${level}`}</Label>
      <Select value={selectedValue} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={level === 0 ? "اختر الفئة" : "اختياري"} />
        </SelectTrigger>
        <SelectContent>
          {currentLevelCategories.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.nameAr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedValue && (
        <CategorySelector
          categories={categories}
          path={path}
          onPathChange={onPathChange}
          level={level + 1}
        />
      )}
    </div>
  );
}
