import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-4">
      <div>
        <p className="text-8xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">الصفحة التي تبحث عنها غير موجودة</p>
        <Link href="/">
          <Button>العودة للرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
