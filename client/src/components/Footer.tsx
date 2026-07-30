import { Link } from "wouter";
import { Facebook, Instagram, MessageCircle, Mail, Phone } from "lucide-react";
import Logo from "./Logo";

const columns = [
  {
    title: "الشركة",
    links: [
      { label: "من نحن", href: "/about" },
      { label: "تواصل معنا", href: "/contact" },
    ],
  },
  {
    title: "خدمة العملاء",
    links: [
      { label: "الأسئلة الشائعة", href: "/faq" },
      { label: "الشحن والتوصيل", href: "/shipping" },
      { label: "الإرجاع والاستبدال", href: "/returns" },
    ],
  },
  {
    title: "قانوني",
    links: [
      { label: "الشروط والأحكام", href: "/terms" },
      { label: "سياسة الخصوصية", href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t bg-muted/20 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group w-fit">
              <Logo className="h-9 w-9 rounded-lg transition-transform duration-200 group-hover:scale-105" />
              <span className="font-bold">Al Mohandes</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              متجرك الموثوق للأدوات المكتبية والقلمية بجودة عالية وأسعار مناسبة.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="فيسبوك"
                className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="انستجرام"
                className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/201098154983"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-sm mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact info */}
          <div>
            <p className="font-semibold text-sm mb-3">تواصل معنا</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a
                  href="tel:+201098154983"
                  dir="ltr"
                  className="hover:text-primary transition-colors"
                >
                  +20 10 98154983
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>support@almohandes.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 text-center text-sm text-muted-foreground">
          <p>
            Al Mohandes | المهندس — متجر الأدوات المكتبية والقلمية &copy;{" "}
            {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
