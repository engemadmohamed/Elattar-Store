import { Store } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

export default function About() {
  return (
    <InfoPageLayout icon={Store} title="من نحن" subtitle="El Attar | العطار للأدوات المكتبية">
      <p>
        El Attar متجر متخصص في بيع الأدوات المكتبية والقلمية، بيوفر تشكيلة واسعة من
        الأقلام والدفاتر وأدوات الرسم ومستلزمات المكتب بجودة عالية وأسعار تناسب الجميع.
      </p>
      <p>
        بنحرص على توفير تجربة تسوق سهلة وسريعة، مع خدمة توصيل لكل محافظات مصر
        ودعم فني جاهز للرد على أي استفسار.
      </p>
      <p className="text-sm text-muted-foreground pt-4 border-t">
        هذا نص تعريفي مبدئي — يمكن تحديثه بمحتوى نهائي عن قصة المتجر لاحقًا.
      </p>
    </InfoPageLayout>
  );
}
