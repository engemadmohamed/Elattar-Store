import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Category { _id: string; name: string; nameAr: string; slug: string; icon: string; parentId: string | null; }

const ICONS = ["📦","✒️","📓","🎨","📎","🎒","🧮","📐","✂️","📌","🖊️","📏","🖍️","📋","🗂️","💼","🖨️","📱"];

export default function AdminCategories() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", nameAr: "", slug: "", icon: "📦", parentId: "" });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("GET", "/api/categories"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/categories", { ...data, parentId: data.parentId || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/categories"] }); setOpen(false); setForm({ name: "", nameAr: "", slug: "", icon: "📦", parentId: "" }); toast({ title: "تم إضافة الفئة ✓" }); },
    onError: (err) => toast({ title: "فشل إضافة الفئة", description: String(err), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/categories"] }); toast({ title: "تم حذف الفئة" }); },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const autoSlug = (ar: string) => ar.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  const mainCategories = categories?.filter((c) => !c.parentId) || [];
  const subcategories = categories?.filter((c) => c.parentId) || [];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">الفئات</h1>
          <Button className="gap-2" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> إضافة فئة</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Categories */}
          <Card>
            <CardHeader><CardTitle className="text-base">الفئات الرئيسية ({mainCategories.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mainCategories.map((cat) => (
                <div key={cat._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{cat.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{cat.name} · {cat.slug}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("حذف الفئة؟")) deleteMutation.mutate(cat._id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {mainCategories.length === 0 && <p className="text-center text-muted-foreground py-4">لا توجد فئات</p>}
            </CardContent>
          </Card>

          {/* Subcategories */}
          <Card>
            <CardHeader><CardTitle className="text-base">الفئات الفرعية ({subcategories.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {subcategories.map((cat) => {
                const parent = categories?.find((c) => c._id === cat.parentId);
                return (
                  <div key={cat._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{cat.nameAr}</p>
                        <p className="text-xs text-muted-foreground">تحت: {parent?.nameAr}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("حذف الفئة؟")) deleteMutation.mutate(cat._id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              {subcategories.length === 0 && <p className="text-center text-muted-foreground py-4">لا توجد فئات فرعية</p>}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>إضافة فئة جديدة</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم بالعربية *</Label>
                <Input value={form.nameAr} onChange={(e) => { set("nameAr", e.target.value); if (!form.slug) set("slug", autoSlug(e.target.value)); }} required />
              </div>
              <div>
                <Label>الاسم بالإنجليزية *</Label>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
            </div>
            <div>
              <Label>Slug (الرابط) *</Label>
              <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="pens-writing" required />
            </div>
            <div>
              <Label>الأيقونة</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => set("icon", icon)} className={`text-xl p-1 rounded ${form.icon === icon ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-muted"}`}>{icon}</button>
                ))}
              </div>
            </div>
            <div>
              <Label>الفئة الأم (اختياري)</Label>
              <Select value={form.parentId} onValueChange={(v) => set("parentId", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="فئة رئيسية (بدون أب)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">فئة رئيسية</SelectItem>
                  {mainCategories.map((c) => <SelectItem key={c._id} value={c._id}>{c.nameAr}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "جاري الإضافة..." : "إضافة الفئة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
