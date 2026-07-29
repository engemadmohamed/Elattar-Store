import { Truck, Shield, RefreshCw, Star } from "lucide-react";

export default function Features() {
  return (
    <section className="border-t py-12 px-4 bg-background">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: "توصيل سريع", desc: "خلال 2-3 أيام عمل" },
            { icon: Shield, title: "ضمان الجودة", desc: "منتجات أصلية 100%" },
            { icon: RefreshCw, title: "إرجاع مجاني", desc: "خلال 7 أيام" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60 group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
