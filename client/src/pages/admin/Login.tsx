import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_BASE } from "@/lib/admin-path";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast({ title: "أهلاً بك!", description: "تم تسجيل الدخول للوحة التحكم." });
      navigate(`${ADMIN_BASE}/dashboard`);
    } catch {
      toast({
        title: "فشل تسجيل الدخول",
        description: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(hsl(0 0% 0% / 0.04) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(0 0% 0% / 0.04) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-foreground/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-foreground/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-foreground text-background font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_8px_24px_hsl(0_0%_0%/0.2)] animate-bounce-in">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">لوحة الإدارة</h1>
          <p className="text-muted-foreground text-sm mt-1">سجّل دخولك للمتابعة</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-2 p-7 shadow-[0_8px_40px_hsl(0_0%_0%/0.10)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">البريد الإلكتروني</Label>
              <div className="relative group">
                <Mail className="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@store.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rtl:pr-10 ltr:pl-10 h-12 rounded-xl border-2 border-input focus:border-foreground transition-all duration-200 bg-muted/30 focus:bg-white"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور</Label>
              <div className="relative group">
                <Lock className="absolute top-1/2 -translate-y-1/2 rtl:right-3.5 ltr:left-3.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="rtl:pr-10 ltr:pl-10 rtl:pl-10 ltr:pr-10 h-12 rounded-xl border-2 border-input focus:border-foreground transition-all duration-200 bg-muted/30 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 rtl:left-3.5 ltr:right-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg hover:shadow-foreground/15"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </div>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          نظام إدارة المتجر — محمي بالكامل
        </p>
      </div>
    </div>
  );
}
