import { Truck } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

export default function Shipping() {
  return (
    <InfoPageLayout icon={Truck} title="الشحن والتوصيل">
      <p>بنوفر توصيل لجميع محافظات مصر من خلال شركات شحن موثوقة.</p>
      <ul className="list-disc pr-5 space-y-2">
        <li>القاهرة والجيزة: من 2 إلى 3 أيام عمل.</li>
        <li>باقي المحافظات: من 3 إلى 5 أيام عمل.</li>
        <li>الدفع عند الاستلام متاح لكل الطلبات.</li>
        <li>هتوصلك رسالة برقم التتبع بمجرد شحن طلبك.</li>
      </ul>
      <p className="text-sm text-muted-foreground pt-4 border-t">
        مدد وأسعار الشحن الفعلية بتختلف حسب شركة الشحن المختارة عند إتمام الطلب.
      </p>
    </InfoPageLayout>
  );
}
