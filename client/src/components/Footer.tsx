import { Link } from "wouter";
import { Instagram, Facebook, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import Logo from "./Logo";
import { useStoreSettings } from "@/lib/store-settings-context";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { settings } = useStoreSettings();
  const { t, lang } = useLanguage();

  const columns = [
    {
      title: t("الشركة", "Company"),
      links: [
        { label: t("من نحن", "About Us"), href: "/about" },
        { label: t("تواصل معنا", "Contact"), href: "/contact" },
      ],
    },
    {
      title: t("خدمة العملاء", "Customer Service"),
      links: [
        { label: t("الأسئلة الشائعة", "FAQ"), href: "/faq" },
        { label: t("الشحن والتوصيل", "Shipping"), href: "/shipping" },
        { label: t("الإرجاع والاستبدال", "Returns"), href: "/returns" },
      ],
    },
    {
      title: t("قانوني", "Legal"),
      links: [
        { label: t("الشروط والأحكام", "Terms"), href: "/terms" },
        { label: t("سياسة الخصوصية", "Privacy"), href: "/privacy" },
      ],
    },
  ];

  return (
    <footer className="border-t bg-muted/20 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 group w-fit">
              <Logo className="h-9 w-9 rounded-lg transition-transform duration-300 group-hover:scale-110" />
              <div className="flex flex-col">
                <span className="font-bold text-base leading-none">{settings.storeName}</span>
                <span className="text-xs text-muted-foreground leading-none">{settings.storeTagline}</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {settings.storeDescription}
            </p>
            <div className="flex items-center gap-2">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="h-8 w-8 rounded-full bg-background border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200">
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-semibold text-sm mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact info */}
          <div>
            <p className="font-semibold text-sm mb-3">{t("تواصل معنا", "Contact Us")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a href={`tel:${settings.phone}`} dir="ltr" className="hover:text-primary transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span>{settings.email}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 text-center text-sm text-muted-foreground">
          <p>{settings.storeName} — {settings.storeTagline} &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
