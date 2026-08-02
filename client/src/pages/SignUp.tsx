import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Lock,
  Store,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";

type Step = "info" | "done";

export default function SignUp() {
  const { signup } = useCustomerAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("info");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    libraryName: "",
    libraryLocation: "",
  });

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة جدًا",
        description: "يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }
    if (!form.phone.match(/^(\+20|0020|0)?1[0125]\d{8}$/)) {
      toast({
        title: "رقم الهاتف غير صحيح",
        description: "الرجاء إدخال رقم هاتف مصري صحيح (مثال: 01012345678)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await signup({
        ...form,
        code: "SKIP",
      });
      setStep("done");
      toast({
        title: "✅ تم إنشاء الحساب بنجاح",
        description: `مرحباً بك يا ${form.name} في متجر المهندس`,
      });
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      toast({
        title: "فشل إنشاء الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0%) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="hero-blob absolute -top-32 -right-32 w-96 h-96 bg-foreground/5 rounded-full" />
      <div className="hero-blob absolute -bottom-32 -left-32 w-80 h-80 bg-foreground/4 rounded-full" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-foreground text-background font-black text-2xl flex items-center justify-center mx-auto mb-4 animate-bounce-in">
            E
          </div>
          <h1 className="text-2xl font-black">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground text-sm mt-1">أنشئ حسابك للتسوق بسهولة ومتابعة طلباتك</p>
        </div>

        {/* ===== STEP 1: Account Info ===== */}
        {step === "info" && (
          <div className="bg-white rounded-3xl border-2 p-6 shadow-[0_8px_32px_hsl(0_0%_0%/0.08)] animate-scale-in">
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">الاسم الكامل</Label>
                <div className="relative">
                  <User className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="أحمد محمد"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01012345678"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Library Name */}
              <div className="space-y-1.5">
                <Label htmlFor="libraryName" className="text-sm font-semibold">اسم المكتبة</Label>
                <div className="relative">
                  <Store className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="libraryName"
                    placeholder="مكتبة المهندس"
                    value={form.libraryName}
                    onChange={(e) => setForm({ ...form, libraryName: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                  />
                </div>
              </div>

              {/* Library Location */}
              <div className="space-y-1.5">
                <Label htmlFor="libraryLocation" className="text-sm font-semibold">موقع المكتبة</Label>
                <div className="relative">
                  <MapPin className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="libraryLocation"
                    placeholder="القاهرة - مصر الجديدة"
                    value={form.libraryLocation}
                    onChange={(e) => setForm({ ...form, libraryLocation: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="6 أحرف على الأقل"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 rtl:pl-10 ltr:pr-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 rtl:left-3 ltr:right-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password strength */}
                {form.password && (
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          form.password.length >= level * 3
                            ? "bg-foreground"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground mr-1">
                      {form.password.length < 3 ? "ضعيفة" : form.password.length < 7 ? "متوسطة" : "قوية"}
                    </span>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl font-black text-base gap-2 bg-black text-white hover:bg-black/90 shadow-md mt-4">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  <>
                    إنشاء الحساب الآن
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-4">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="font-bold text-foreground hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        )}

        {/* ===== STEP 2: Done ===== */}
        {step === "done" && (
          <div className="bg-white rounded-3xl border-2 p-8 shadow-[0_8px_32px_hsl(0_0%_0%/0.08)] animate-scale-in text-center">
            <div className="h-20 w-20 rounded-full bg-foreground flex items-center justify-center mx-auto mb-5 animate-bounce-in">
              <CheckCircle2 className="h-10 w-10 text-background" />
            </div>
            <h2 className="text-2xl font-black mb-2">أهلاً بك! 🎉</h2>
            <p className="text-muted-foreground mb-2">تم إنشاء حسابك بنجاح</p>
            <p className="text-sm text-muted-foreground">سيتم توجيهك للصفحة الرئيسية...</p>
            <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-foreground rounded-full animate-[shimmer_2s_linear_forwards]" style={{ width: "100%", animation: "slideInLeft 2s linear forwards" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
