import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

// Steps
type Step = "info" | "phone-confirm" | "done";

export default function SignUp() {
  const { signup } = useCustomerAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("info");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(""); // mock OTP
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    libraryName: "",
    libraryLocation: "",
  });

  // Countdown timer
  useEffect(() => {
    if (step !== "phone-confirm") return;
    setCountdown(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const generateAndSendOtp = async () => {
    try {
      const res = await apiRequest<{ success: boolean; message: string; code?: string }>(
        "POST",
        "/api/customer-auth/send-otp",
        { phone: form.phone }
      );
      if (res.code) {
        setGeneratedOtp(res.code);
        toast({
          title: "📱 تم إرسال رمز التحقق",
          description: `رمز التحقق الخاص بك هو: ${res.code}`,
        });
      } else {
        toast({
          title: "📱 تم إرسال رمز التحقق",
          description: res.message || "يرجى فحص هاتفك",
        });
      }
      return true;
    } catch (error) {
      toast({
        title: "فشل إرسال كود التحقق",
        description: error instanceof Error ? error.message : "تعذر الاتصال بالخادم",
        variant: "destructive",
      });
      return false;
    }
  };

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
    const sent = await generateAndSendOtp();
    setLoading(false);

    if (sent) {
      setStep("phone-confirm");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError(false);
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (paste.length === 4) {
      setOtp(paste.split(""));
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 4) {
      setOtpError(true);
      toast({ title: "يرجى إدخال الرمز المكون من 4 أرقام", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await signup({
        ...form,
        code: enteredOtp,
      });
      setStep("done");
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setOtpError(true);
      toast({
        title: "فشل التحقق أو إنشاء الحساب",
        description: error instanceof Error ? error.message : "رمز التحقق غير صحيح",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", ""]);
    setOtpError(false);
    generateAndSendOtp();
    setCountdown(60);
    setCanResend(false);
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

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[
            { key: "info", label: "بيانات الحساب" },
            { key: "phone-confirm", label: "تأكيد الهاتف" },
            { key: "done", label: "تم!" },
          ].map((s, i) => {
            const isActive = s.key === step;
            const isDone =
              (step === "phone-confirm" && s.key === "info") ||
              (step === "done" && (s.key === "info" || s.key === "phone-confirm"));
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-black transition-all duration-400 ${
                    isDone
                      ? "bg-foreground text-background"
                      : isActive
                      ? "bg-foreground text-background ring-4 ring-foreground/15"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
                {i < 2 && <div className={`w-8 h-0.5 transition-all duration-400 ${isDone ? "bg-foreground" : "bg-muted"}`} />}
              </div>
            );
          })}
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
                    placeholder="01xxxxxxxxx"
                    dir="ltr"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="rtl:pr-10 ltr:pl-10 h-11 rounded-xl border-2 focus:border-foreground"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">سيتم إرسال رمز تحقق على هذا الرقم</p>
              </div>

              {/* Library Name */}
              <div className="space-y-1.5">
                <Label htmlFor="libraryName" className="text-sm font-semibold">اسم المكتبة</Label>
                <div className="relative">
                  <Store className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="libraryName"
                    placeholder="مكتبة النيل"
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
                    placeholder="القاهرة، مدينة نصر"
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

              <Button type="submit" className="w-full h-11 rounded-xl font-bold text-base gap-2 group">
                التالي — تأكيد الهاتف
                <ArrowRight className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:ltr:translate-x-1 group-hover:rtl:-translate-x-1" />
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-4">
              لديك حساب بالفعل؟{" "}
              <Link href="/login" className="text-foreground font-bold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        )}

        {/* ===== STEP 2: Phone OTP Confirmation ===== */}
        {step === "phone-confirm" && (
          <div className="bg-white rounded-3xl border-2 p-6 shadow-[0_8px_32px_hsl(0_0%_0%/0.08)] animate-scale-in">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-foreground/6 border-2 border-foreground/12 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-foreground" />
              </div>
              <h2 className="text-xl font-black mb-1">تأكيد رقم الهاتف</h2>
              <p className="text-sm text-muted-foreground">
                أدخل الرمز المُرسَل إلى
              </p>
              <p className="font-bold text-sm mt-0.5 dir-ltr" dir="ltr">{form.phone}</p>
            </div>

            <form onSubmit={handleOtpSubmit}>
              {/* OTP Input */}
              <div className="flex items-center justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`h-14 w-14 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-200 ${
                      otpError
                        ? "border-destructive bg-destructive/5 animate-bounce-in"
                        : digit
                        ? "border-foreground bg-foreground/4"
                        : "border-muted-foreground/25 focus:border-foreground bg-white"
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-destructive text-sm font-medium mb-4 animate-fade-in-up">
                  ❌ الرمز غير صحيح، حاول مرة أخرى
                </p>
              )}

              {/* Countdown */}
              <div className="text-center mb-4">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-sm font-bold text-foreground hover:underline"
                  >
                    إعادة إرسال الرمز
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    إعادة الإرسال بعد{" "}
                    <span className="font-bold text-foreground tabular-nums">{countdown}</span>{" "}
                    ثانية
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold text-base"
                disabled={otp.join("").length < 4 || loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    جاري إنشاء الحساب...
                  </div>
                ) : (
                  "تأكيد وإنشاء الحساب"
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setStep("info"); setOtp(["", "", "", ""]); setOtpError(false); }}
                className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                العودة وتعديل البيانات
              </button>
            </form>
          </div>
        )}

        {/* ===== STEP 3: Done ===== */}
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
