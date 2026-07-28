import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      variant="default"
      size="icon"
      className={`fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg transition-all duration-300 z-50 ${
        isVisible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-0 pointer-events-none"
      }`}
      onClick={scrollToTop}
      aria-label="العودة للأعلى"
    >
      <ArrowUp className="h-6 w-6" />
    </Button>
  );
}
