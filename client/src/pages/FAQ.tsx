import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "كام مدة توصيل الطلب؟",
    a: "التوصيل بياخد من 2 إلى 3 أيام عمل داخل القاهرة والجيزة، ومن 3 إلى 5 أيام لباقي المحافظات.",
  },
  {
    q: "إيه طرق الدفع المتاحة؟",
    a: "حاليًا متاح الدفع عند الاستلام (Cash on Delivery). طرق دفع إلكتروني هتضاف قريبًا.",
  },
  {
    q: "أقدر أرجع أو أستبدل المنتج؟",
    a: "أيوه، تقدر تطلب الإرجاع أو الاستبدال خلال 14 يوم من تاريخ الاستلام، طالما المنتج في حالته الأصلية.",
  },
  {
    q: "إزاي أتابع حالة طلبي؟",
    a: "تقدر تشوف كل طلباتك وحالتها من صفحة \"حسابي\" بعد تسجيل الدخول.",
  },
  {
    q: "فيه شحن لكل المحافظات؟",
    a: "أيوه، بنوصل لكل محافظات مصر من خلال شركات الشحن الشريكة لنا.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-[70vh] py-12 px-4">
      <div className="mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">الأسئلة الشائعة</h1>
        </div>

        <div className="space-y-2">
          {faqs.map((item, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-4 p-4 text-right hover:bg-accent/50 transition-colors duration-200"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-sm">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${open === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
