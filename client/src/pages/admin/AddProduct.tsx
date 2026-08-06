import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft,
  Plus,
  X,
  Upload,
  QrCode,
  Copy,
  Check,
  Percent,
  Clipboard,
  Link as LinkIcon,
  Image as ImageIcon,
  FolderTree,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import QRModal from "@/components/QRModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ADMIN_BASE } from "@/lib/admin-path";
import { compressImage, getSaleUnitName } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  nameAr: string;
  slug: string;
  parentId: string | null;
  discountPercent?: number;
}

const PRESET_COLORS = [
  { label: "أحمر", bg: "bg-red-500 text-white border-red-600" },
  { label: "أزرق", bg: "bg-blue-500 text-white border-blue-600" },
  { label: "أسود", bg: "bg-black text-white border-black" },
  { label: "أخضر", bg: "bg-green-500 text-white border-green-600" },
  { label: "أصفر", bg: "bg-yellow-400 text-black border-yellow-500" },
  { label: "أبيض", bg: "bg-white text-black border-gray-300" },
  { label: "رمادي", bg: "bg-gray-500 text-white border-gray-600" },
  { label: "بني", bg: "bg-amber-800 text-white border-amber-900" },
  { label: "وردي", bg: "bg-pink-500 text-white border-pink-600" },
  { label: "بنفسجي", bg: "bg-purple-500 text-white border-purple-600" },
  { label: "برتقالي", bg: "bg-orange-500 text-white border-orange-600" },
  { label: "شفاف", bg: "bg-slate-100 text-slate-700 border-slate-300" },
];

const findCategoryPath = (
  allCategories: Category[],
  categoryId: string,
): string[] => {
  const path: string[] = [];
  let currentId: string | null = categoryId ? String(categoryId) : null;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const category = allCategories.find((c) => String(c._id) === currentId);
    if (category) {
      path.unshift(String(category._id));
      const parent = category.parentId;
      if (!parent) {
        currentId = null;
      } else if (typeof parent === "object" && parent !== null) {
        currentId = String((parent as any)._id || "");
      } else {
        currentId = String(parent);
      }
    } else {
      currentId = null;
    }
  }
  return path;
};

interface ExistingProduct {
  _id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  salePrice?: number;
  stock: number;
  categoryId: { _id: string; name: string; nameAr: string; slug: string } | string;
  sku: string;
  brand?: string;
  saleUnit?: string;
  colors?: string[];
  images: string[];
  isActive: boolean;
}

export default function AddProduct() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: "",
    salePrice: "",
    stock: "0",
    categoryId: "",
    brand: "",
    saleUnit: "piece",
    colors: [] as string[],
    images: [] as string[],
    isActive: true,
  });
  const [discountPercent, setDiscountPercent] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [categoryChain, setCategoryChain] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [savedProductSku, setSavedProductSku] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const set = (key: string, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val as any }));

  const handleCategoryChange = (level: number, value: string) => {
    const newChain = categoryChain.slice(0, level);
    if (value) {
      newChain.push(value);
    }
    setCategoryChain(newChain);

    const finalCategoryId =
      newChain.length > 0 ? newChain[newChain.length - 1] : "";
    set("categoryId", finalCategoryId);

    // Auto-fill category discount if selected category has discountPercent
    if (finalCategoryId && categories) {
      const selectedCat = categories.find((c) => String(c._id) === finalCategoryId);
      const parentCat = selectedCat?.parentId
        ? categories.find((c) => String(c._id) === String(selectedCat.parentId))
        : null;

      const catDisc =
        selectedCat?.discountPercent && selectedCat.discountPercent > 0
          ? selectedCat.discountPercent
          : parentCat?.discountPercent && parentCat.discountPercent > 0
          ? parentCat.discountPercent
          : 0;

      if (catDisc > 0) {
        setDiscountPercent(String(catDisc));
        const priceNum = Number(form.price);
        if (priceNum > 0) {
          const calculated = Math.round(priceNum * (1 - catDisc / 100));
          set("salePrice", String(calculated));
        }
        toast({
          title: `✨ تم تطبيق نسبة خصم الفئة تلقائياً (${catDisc}%)`,
        });
      }
    }
  };

  useEffect(() => {
    if (isEdit && existingProduct && categories) {
      const rawCat = existingProduct.categoryId;
      const productCategoryId = typeof rawCat === "object" && rawCat !== null ? String(rawCat._id) : String(rawCat || "");
      setSavedProductSku(existingProduct.sku || "");

      if (productCategoryId) {
        const path = findCategoryPath(categories, productCategoryId);
        setCategoryChain(path);
      }

      const pPrice = existingProduct.price !== undefined ? existingProduct.price : 0;
      const sPrice = existingProduct.salePrice || 0;
      let calculatedDisc = "";
      if (pPrice > 0 && sPrice > 0 && sPrice < pPrice) {
        calculatedDisc = String(Math.round(((pPrice - sPrice) / pPrice) * 100));
      }

      setDiscountPercent(calculatedDisc);

      setForm({
        name: existingProduct.name || "",
        nameAr: existingProduct.nameAr || "",
        description: existingProduct.description || "",
        descriptionAr: existingProduct.descriptionAr || "",
        price: pPrice ? String(pPrice) : "",
        salePrice: sPrice ? String(sPrice) : "",
        stock: existingProduct.stock !== undefined ? String(existingProduct.stock) : "0",
        categoryId: productCategoryId,
        brand: existingProduct.brand || "",
        saleUnit: existingProduct.saleUnit || "piece",
        colors: existingProduct.colors || [],
        images: existingProduct.images || [],
        isActive: existingProduct.isActive ?? true,
      });
    }
  }, [existingProduct, categories]);

  const addColor = () => {
    if (colorInput.trim()) {
      set("colors", [...form.colors, colorInput.trim()]);
      setColorInput("");
    }
  };

  // Method 3: Add Image by Direct URL Input
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      set("images", [...form.images, imageUrlInput.trim()]);
      setImageUrlInput("");
      toast({ title: "تم إضافة رابط الصورة ✓" });
    }
  };

  // Method 1: Upload File directly from Device
  const uploadFileObj = async (file: File) => {
    setUploading(true);
    const token = localStorage.getItem("al-mohandes-token");
    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, file.name || "uploaded-image.jpg");
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
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      toast({ title: "تم رفع وضم الصورة بنجاح ✓" });
    } catch {
      toast({
        title: "فشل رفع الصورة",
        description: "تعذر الاتصال بالسيرفر",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFileObj(file);
      e.target.value = "";
    }
  };

  // Method 2: Clipboard Paste Image
  const handleClipboardPasteButton = async () => {
    try {
      const items = await navigator.clipboard.read().catch(() => []);
      let found = false;
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith("image/"));
        if (imageType) {
          found = true;
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          await uploadFileObj(file);
          break;
        }
      }
      if (!found) {
        toast({
          title: "انسخ صورة أولاً ثم اضغط هنا أو اضغط Ctrl + V",
          description: "تأكد من نسخ صورة إلى الحافظة أولاً",
        });
      }
    } catch {
      toast({
        title: "اضغط Ctrl + V في هذه الصفحة للصق الصورة",
        description: "انسخ أي صورة ثم استخدم اختصار الحافظة",
      });
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
      return apiRequest<ExistingProduct>(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/products/${id}` : "/api/products",
        payload,
      );
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/products"] });
      qc.invalidateQueries({ queryKey: ["/api/products/admin/all"] });

      if (data && data._id) {
        setSavedProductId(data._id);
        setSavedProductSku(data.sku || "");
        setShowQR(true);
      } else {
        toast({ title: isEdit ? "تم تحديث المنتج بنجاح ✓" : "تم إضافة المنتج بنجاح ✓" });
        navigate(`${ADMIN_BASE}/products`);
      }
    },
    onError: (err: any) => {
      toast({
        title: isEdit ? "فشل تحديث المنتج" : "فشل إضافة المنتج",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const renderCategoryDropdowns = () => {
    if (!categories) return null;
    const elements = [];
    const rootCats = categories.filter((c) => !c.parentId);

    elements.push(
      <div key="level-0" className="space-y-1">
        <Label className="text-xs font-bold text-muted-foreground">الفئة الرئيسية</Label>
        <Select
          value={categoryChain[0] || ""}
          onValueChange={(val) => handleCategoryChange(0, val)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="اختر فئة رئيسية" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            {rootCats.map((c) => (
              <SelectItem key={c._id} value={String(c._id)}>
                {c.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>,
    );

    let currentParentId = categoryChain[0];
    let level = 1;

    while (currentParentId) {
      const subCats = categories.filter((c) => {
        if (!c.parentId) return false;
        const pId = typeof c.parentId === "object"
          ? String((c.parentId as any)._id || c.parentId)
          : String(c.parentId);
        return pId === currentParentId;
      });

      if (subCats.length === 0) break;

      const selectedSubId = categoryChain[level] || "";

      elements.push(
        <div key={`level-${level}`} className="space-y-1">
          <Label className="text-xs font-bold text-muted-foreground">فئة فرعية (مستوى {level})</Label>
          <Select
            value={selectedSubId}
            onValueChange={(val) => handleCategoryChange(level, val)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="اختر فئة فرعية" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {subCats.map((c) => (
                <SelectItem key={c._id} value={String(c._id)}>
                  {c.nameAr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>,
      );

      currentParentId = selectedSubId;
      level++;
    }

    return elements;
  };

  return (
    <AdminLayout
      title={isEdit ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}
      subtitle={isEdit ? "تحديث أسعار ومخزون المنتج" : "أدخل تفاصيل وصور المنتج لإضافته للكتالوج"}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <Link href={`${ADMIN_BASE}/products`}>
            <Button variant="ghost" size="sm" className="gap-2 font-bold rounded-xl">
              <ArrowLeft className="h-4 w-4" /> العودة لقائمة المنتجات
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Main Form Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Main Basic Info */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black">معلومات المنتج الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-bold">اسم المنتج بالعربية *</Label>
                    <Input
                      className="rounded-xl mt-1 h-11"
                      value={form.nameAr}
                      onChange={(e) => {
                        const val = e.target.value;
                        set("nameAr", val);
                        if (!form.name) set("name", val);
                      }}
                      placeholder="مثال: قلم جل أزرق 0.7 مم"
                      required
                    />
                  </div>

                  <div>
                    <Label className="font-bold">الاسم بالإنجليزي (اختياري)</Label>
                    <Input
                      className="rounded-xl mt-1 h-11"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Gel Pen Blue 0.7mm"
                    />
                  </div>

                  <div>
                    <Label className="font-bold">الوصف التفصيلي بالعربية</Label>
                    <Textarea
                      className="rounded-xl mt-1"
                      value={form.descriptionAr}
                      onChange={(e) => set("descriptionAr", e.target.value)}
                      placeholder="مواصفات ونوع واستخدامات المنتج..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Pricing & Stock + Percentage Discount */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black">السعر، نسب الخصم والمخزون</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-bold">السعر الأساسي (ج.م) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        className="rounded-xl mt-1 h-11"
                        value={form.price}
                        onChange={(e) => {
                          const newPrice = e.target.value;
                          set("price", newPrice);
                          if (discountPercent && Number(discountPercent) > 0 && newPrice) {
                            const calculated = Math.round(Number(newPrice) * (1 - Number(discountPercent) / 100));
                            set("salePrice", String(calculated));
                          }
                        }}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-bold flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" /> نسبة الخصم %
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="rounded-xl mt-1 h-11"
                        value={discountPercent}
                        onChange={(e) => {
                          const disc = e.target.value;
                          setDiscountPercent(disc);
                          const priceNum = Number(form.price);
                          if (disc && Number(disc) > 0 && priceNum > 0) {
                            const calculated = Math.round(priceNum * (1 - Number(disc) / 100));
                            set("salePrice", String(calculated));
                          } else if (!disc || Number(disc) === 0) {
                            set("salePrice", "");
                          }
                        }}
                        placeholder="أدخل % مثلا 10"
                      />
                    </div>

                    <div>
                      <Label className="font-bold">سعر البيع بعد الخصم (ج.م)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        className="rounded-xl mt-1 h-11"
                        value={form.salePrice}
                        onChange={(e) => {
                          const sPrice = e.target.value;
                          set("salePrice", sPrice);
                          const priceNum = Number(form.price);
                          if (sPrice && priceNum > 0) {
                            const disc = Math.round(((priceNum - Number(sPrice)) / priceNum) * 100);
                            setDiscountPercent(String(disc));
                          } else {
                            setDiscountPercent("");
                          }
                        }}
                        placeholder="تحسب تلقائياً أو أدخلها"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-bold">الكمية المتاحة (بالـ {getSaleUnitName(form.saleUnit)}) *</Label>
                      <Input
                        type="number"
                        min="0"
                        className="rounded-xl mt-1 h-11"
                        value={form.stock}
                        onChange={(e) => set("stock", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-bold">وحدة البيع</Label>
                      <Select
                        key={`saleUnit-${form.saleUnit || "piece"}`}
                        value={form.saleUnit || "piece"}
                        onValueChange={(v) => set("saleUnit", v)}
                      >
                        <SelectTrigger className="rounded-xl mt-1 h-11">
                          <SelectValue placeholder="اختر وحدة البيع" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="piece">قطعة</SelectItem>
                          <SelectItem value="box">علبة</SelectItem>
                          <SelectItem value="jar">برطمان</SelectItem>
                          <SelectItem value="stand">استاند</SelectItem>
                          <SelectItem value="carton">كرتونة</SelectItem>
                          <SelectItem value="dozen">دستة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="font-bold">الماركة / العلامة التجارية</Label>
                    <Input
                      className="rounded-xl mt-1 h-11"
                      value={form.brand}
                      onChange={(e) => set("brand", e.target.value)}
                      placeholder="مثال: Bic, Faber-Castell"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Colors */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black">ألوان المنتج</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-2.5 block text-xs font-bold text-muted-foreground">
                      اختر من الألوان المتاحة بنقرة واحدة:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((preset) => {
                        const isSelected = form.colors.includes(preset.label);
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                set("colors", form.colors.filter((c) => c !== preset.label));
                              } else {
                                set("colors", [...form.colors, preset.label]);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? `${preset.bg} ring-2 ring-offset-1 ring-black scale-105 shadow-sm`
                                : "bg-muted/40 text-foreground border-input hover:bg-accent"
                            }`}
                          >
                            <span>{preset.label}</span>
                            {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 opacity-50" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <Label className="mb-1.5 block text-xs text-muted-foreground">أو اكتب اسم لون إضافي:</Label>
                    <div className="flex gap-2">
                      <Input
                        className="rounded-xl h-10"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        placeholder="مثلاً: فيروزي، كحلي..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addColor();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="rounded-xl h-10" onClick={addColor}>
                        <Plus className="h-4 w-4" /> إضافة
                      </Button>
                    </div>
                  </div>

                  {form.colors.length > 0 && (
                    <div className="pt-2 border-t">
                      <Label className="mb-1.5 block text-xs font-bold">الألوان المختارة للمنتج ({form.colors.length}):</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {form.colors.map((c, i) => (
                          <Badge key={i} variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border bg-black text-white">
                            {c}
                            <button
                              type="button"
                              onClick={() => set("colors", form.colors.filter((_, j) => j !== i))}
                              className="text-white/80 hover:text-white transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card 4: Product Images (3 Upload Methods Restored!) */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" /> صور المنتج (3 طرق مختلفة للرفع)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Uploaded Images Preview Grid */}
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 p-3 bg-muted/20 rounded-2xl border">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border group shadow-sm bg-white">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            title="حذف الصورة"
                            onClick={() => set("images", form.images.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 bg-black/75 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3 Upload Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Method 1: File Upload */}
                    <label className="cursor-pointer bg-black text-white p-3 rounded-2xl text-xs font-bold hover:bg-black/90 flex flex-col items-center justify-center gap-2 text-center border shadow-xs transition-all">
                      <Upload className="h-5 w-5" />
                      <span>1. رفع صورة من الجهاز</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                    </label>

                    {/* Method 2: Clipboard Paste */}
                    <button
                      type="button"
                      onClick={handleClipboardPasteButton}
                      className="bg-card hover:bg-muted p-3 rounded-2xl text-xs font-bold border flex flex-col items-center justify-center gap-2 text-center shadow-xs transition-all"
                    >
                      <Clipboard className="h-5 w-5 text-muted-foreground" />
                      <span>2. لصق صورة (Ctrl + V)</span>
                    </button>

                    {/* Method 3: Direct URL Input */}
                    <div className="bg-card p-2 rounded-2xl border shadow-xs flex flex-col justify-between gap-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground text-center">3. إدخال رابط صورة URL</span>
                      <div className="flex gap-1">
                        <Input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://..."
                          className="h-8 text-xs rounded-xl"
                        />
                        <Button type="button" size="sm" onClick={handleAddImageUrl} className="h-8 text-xs font-bold rounded-xl px-2">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">
              
              {/* Category Selector Card (Positioned in Top Sidebar) */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <FolderTree className="h-5 w-5" /> فئة المنتج والأقسام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {renderCategoryDropdowns()}
                  </div>
                </CardContent>
              </Card>

              {/* Publish & Status Card */}
              <Card className="rounded-3xl border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-black">حالة المنتج بالنشر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-xs">عرض المنتج بالمتجر</Label>
                    <Switch
                      checked={form.isActive}
                      onCheckedChange={(v) => set("isActive", v)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-black hover:bg-black/90 text-white font-bold rounded-xl h-11 shadow-md"
                    disabled={mutation.isPending || uploading}
                  >
                    {mutation.isPending ? "جاري الحفظ..." : isEdit ? "تحديث المنتج" : "حفظ وإضافة المنتج"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>

        {savedProductId && (
          <QRModal
            open={showQR}
            onOpenChange={(isOpen) => {
              setShowQR(isOpen);
              if (!isOpen) navigate(`${ADMIN_BASE}/products`);
            }}
            productName={form.nameAr || form.name}
            sku={savedProductSku}
            price={Number(form.salePrice) || Number(form.price)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
