import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminReviews() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">تقييمات المنتجات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              تم تعطيل هذه الميزة.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
