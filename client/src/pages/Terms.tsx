import { FileText } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

export default function Terms() {
  return (
    <InfoPageLayout icon={FileText} title="الشروط والأحكام">
      <p>
        باستخدامك موقع المهندس، فإنك توافق على الشروط والأحكام التالية. الرجاء
        قراءتها بعناية.
      </p>
      <p>1. جميع الأسعار المعروضة بالجنيه المصري وشاملة الضريبة المطبقة.</p>
      <p>
        2. المتجر غير مسؤول عن التأخير الناتج عن ظروف خارجة عن إرادته (كظروف
        الشحن).
      </p>
      <p>3. يحتفظ المتجر بحقه في تعديل الأسعار والعروض دون إشعار مسبق.</p>
      <p className="text-sm text-muted-foreground pt-4 border-t">
        هذا نص مبدئي للشروط والأحكام — يُنصح باستبداله بنص قانوني معتمد قبل
        الإطلاق الرسمي.
      </p>
    </InfoPageLayout>
  );
}
