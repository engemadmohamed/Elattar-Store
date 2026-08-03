import { useEffect, useState, useRef, useCallback } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useStoreSettings } from "@/lib/store-settings-context";

// ============================================================
// Scroll-to-top button with progress ring
// ============================================================
function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setProgress(pct);
      setVisible(scrollY > 300);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const r = 18;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <button
      onClick={scrollTop}
      aria-label="Scroll to top"
      className={`fixed bottom-20 rtl:left-5 ltr:right-5 z-50 h-12 w-12 flex items-center justify-center transition-all duration-400 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-75 pointer-events-none"
      }`}
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(0 0% 0% / 0.08)" strokeWidth="2.5" />
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke="hsl(0 0% 7%)"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-md">
        <ArrowUp className="h-4 w-4" />
      </div>
    </button>
  );
}

// ============================================================
// WhatsApp floating button
// ============================================================
function WhatsAppButton() {
  const { settings } = useStoreSettings();
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!settings.whatsapp) return null;

  return (
    <a
      href={`https://wa.me/${settings.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-5 rtl:left-5 ltr:right-5 z-50 flex items-center gap-2 group"
    >
      {/* Pulse rings */}
      {pulse && (
        <>
          <span className="absolute inset-0 rounded-full bg-foreground/20 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-foreground/10 animate-ping" style={{ animationDelay: "0.5s" }} />
        </>
      )}
      <div className="relative h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_4px_20px_hsl(0_0%_0%/0.25)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_28px_hsl(0_0%_0%/0.35)]">
        <MessageCircle className="h-5 w-5 fill-background" />
      </div>
      {/* Tooltip */}
      <div className="absolute rtl:right-14 ltr:left-14 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none shadow-md">
        تواصل معنا
      </div>
    </a>
  );
}

// ============================================================
// Scroll-reveal: observe elements with data-reveal attribute
// Uses MutationObserver to catch dynamically-loaded elements (e.g. from API)
// ============================================================
function useScrollReveal() {
  useEffect(() => {
    const observeElements = (observer: IntersectionObserver) => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        observer.observe(el);
      });
    };

    const intersectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          } else {
            entry.target.classList.remove("revealed");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -10px 0px" }
    );

    // Initial observe
    observeElements(intersectionObs);

    // Watch for new elements added to DOM (API data loads)
    const mutationObs = new MutationObserver(() => {
      observeElements(intersectionObs);
    });
    mutationObs.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersectionObs.disconnect();
      mutationObs.disconnect();
    };
  }, []);
}


// ============================================================
// Navigation progress bar (top of page)
// ============================================================
function NavProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      setWidth(pct);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-foreground transition-all duration-100"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

// ============================================================
// Main component: combines everything
// ============================================================
export default function ScrollToTopButton() {
  useScrollReveal();

  return (
    <>
      <NavProgress />
      <ScrollToTop />
      <WhatsAppButton />
    </>
  );
}
