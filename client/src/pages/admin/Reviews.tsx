import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminReviews() {
  return (
    <AdminLayout title="تقييمات المنتجات" subtitle="إدارة مراجعات وتقييمات الزوار">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">تقييمات المنتجات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              جميع التقييمات مفعلة ومرئية في الصفحة الرئيسية للمتجر.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
