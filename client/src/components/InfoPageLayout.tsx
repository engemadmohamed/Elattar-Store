import { LucideIcon } from "lucide-react";

export default function InfoPageLayout({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[70vh] py-12 px-4">
      <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        {subtitle && <p className="text-muted-foreground mb-8">{subtitle}</p>}
        <div className="max-w-none text-foreground space-y-4 leading-relaxed text-[15px]">
          {children}
        </div>
      </div>
    </div>
  );
}
