import { ShieldCheck } from "lucide-react";
import InfoPageLayout from "@/components/InfoPageLayout";

export default function Privacy() {
  return (
    <InfoPageLayout icon={ShieldCheck} title="سياسة الخصوصية">
      <p>نحن في Al Attar نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.</p>
      <p>
        بنجمع بس البيانات اللازمة لإتمام طلبك (الاسم، الهاتف، العنوان، البريد
        الإلكتروني).
      </p>
      <p>
        مش بنشارك بياناتك مع أي طرف ثالث إلا بالقدر اللازم لإتمام عملية الشحن.
      </p>
      <p>
        كلمات المرور مشفّرة ومحفوظة بأمان، ومفيش أي شخص يقدر يشوفها كنص صريح.
      </p>
      <p className="text-sm text-muted-foreground pt-4 border-t">
        هذا نص مبدئي لسياسة الخصوصية — يُنصح بمراجعته قانونيًا قبل الإطلاق
        الرسمي.
      </p>
    </InfoPageLayout>
  );
}
