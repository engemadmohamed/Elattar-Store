import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star, Plus, Trash2, MessageSquare, CheckCircle, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  productName?: string;
  productId?: { nameAr: string; images?: string[] };
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    rating: 5,
    comment: "",
    productName: "",
  });

  const { data, isLoading } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: ["/api/reviews/admin/all"],
    queryFn: () => apiRequest("GET", "/api/reviews/admin/all"),
  });

  // Toggle Featured mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/reviews/admin/${id}/toggle-featured`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/admin/all"] });
      qc.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
      toast({ title: "تم تحديث حالة الظهور بالصفحة الرئيسية" });
    },
  });

  // Add review mutation
  const addMutation = useMutation({
    mutationFn: (formData: typeof form) => apiRequest("POST", "/api/reviews/admin/add", formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/admin/all"] });
      qc.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
      toast({ title: "تم إضافة التقييم بنجاح" });
      setAddOpen(false);
      setForm({ customerName: "", rating: 5, comment: "", productName: "" });
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/reviews/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/reviews/admin/all"] });
      qc.invalidateQueries({ queryKey: ["/api/reviews/featured"] });
      toast({ title: "تم حذف التقييم" });
    },
  });

  return (
    <AdminLayout title="آراء وتقييمات العملاء" subtitle="إدارة التقييمات واختيار الظاهر منها في الرئيسية">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold">تقييمات وآراء العملاء</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              إجمالي: {data?.total || 0} تقييم مسجّل في القاعدة
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-2 rounded-xl font-bold">
            <Plus className="h-4 w-4" /> إضافة تقييم جديد
          </Button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري تحميل التقييمات...</div>
        ) : data?.reviews.length === 0 ? (
          <Card className="text-center py-16 text-muted-foreground rounded-2xl border-dashed">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-bold text-base text-foreground mb-1">لا توجد تقييمات مضافة بعد</p>
              <p className="text-sm text-muted-foreground mb-4">اضغط على زر "إضافة تقييم جديد" لإضافة تقييم يظهر بالصفحة الرئيسية</p>
              <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-xl">
                إضافة أول تقييم
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.reviews.map((review) => (
              <Card
                key={review._id}
                className={`rounded-2xl border-2 transition-all duration-300 ${
                  review.isFeatured ? "border-foreground/20 bg-white shadow-sm" : "border-muted bg-muted/20 opacity-70"
                }`}
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">{review.customerName}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(review.createdAt)}</p>
                  </div>
                  {/* Toggle Featured */}
                  <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-xl">
                    <span className="text-[11px] font-bold">ظاهر</span>
                    <Switch
                      checked={review.isFeatured}
                      onCheckedChange={() => toggleMutation.mutate(review._id)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-3 rounded-xl">
                    "{review.comment || "بدون تعليق مكتوب"}"
                  </p>

                  {/* Product name if any */}
                  {(review.productName || review.productId?.nameAr) && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span className="truncate">{review.productName || review.productId?.nameAr}</span>
                    </div>
                  )}

                  {/* Footer Action */}
                  <div className="pt-2 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 h-8 text-xs gap-1"
                      onClick={() => deleteMutation.mutate(review._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف التقييم
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">إضافة تقييم جديد</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMutation.mutate(form);
            }}
            className="space-y-4 py-2"
          >
            <div>
              <Label className="text-sm font-semibold">اسم العميل *</Label>
              <Input
                placeholder="أحمد علي"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="mt-1 h-11 rounded-xl border-2"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">التقييم (النجوم) *</Label>
              <div className="flex items-center gap-2 mt-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= form.rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">اسم المنتج (اختياري)</Label>
              <Input
                placeholder="طقم أقلام فاخر"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                className="mt-1 h-11 rounded-xl border-2"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">نص التقييم / الرأي</Label>
              <Textarea
                placeholder="المنتجات رائعة وجودة ممتازة والتوصيل سريع جداً..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                className="mt-1 rounded-xl border-2 min-h-[90px]"
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
                إلغاء
              </Button>
              <Button type="submit" className="rounded-xl font-bold px-6" disabled={addMutation.isPending}>
                {addMutation.isPending ? "جاري الإضافة..." : "حفظ وإظهار بالرئيسية"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
