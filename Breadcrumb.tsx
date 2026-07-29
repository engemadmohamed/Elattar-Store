import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center gap-1.5">
          <Link
            href={item.href}
            className={`hover:text-primary transition-colors ${
              index === items.length - 1 ? "font-medium text-foreground" : ""
            }`}
          >
            {item.label}
          </Link>
          {index < items.length - 1 && <ChevronLeft className="h-4 w-4" />}
        </div>
      ))}
    </nav>
  );
}
