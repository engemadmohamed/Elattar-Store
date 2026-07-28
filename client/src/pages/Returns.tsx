import { RefreshCw } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

export default function Returns() {
  return (
    <InfoPageLayout icon={RefreshCw} title="الإرجاع والاستبدال">
      <p>عايزين تكون مطمّن وأنت بتتسوق، فبنوفر سياسة إرجاع واستبدال مرنة.</p>
      <ul className="list-disc pr-5 space-y-2">
        <li>تقدر تطلب الإرجاع أو الاستبدال خلال 14 يوم من تاريخ الاستلام.</li>
        <li>المنتج لازم يكون في حالته الأصلية وبدون استخدام.</li>
        <li>للطلب، تواصل معنا من صفحة "تواصل معنا" برقم الطلب.</li>
      </ul>
      <p className="text-sm text-muted-foreground pt-4 border-t">
        هذه سياسة مبدئية — يمكن تعديل الشروط والمدة حسب سياستك النهائية.
      </p>
    </InfoPageLayout>
  );
}
