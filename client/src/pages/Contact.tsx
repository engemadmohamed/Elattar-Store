import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Placeholder: no backend endpoint wired up yet — swap this for a real
    // contact-form submission once you have one.
    setTimeout(() => {
      toast({
        title: "تم استلام رسالتك ✓",
        description: "هنتواصل معاك في أقرب وقت",
      });
      setForm({ name: "", email: "", message: "" });
      setSending(false);
    }, 600);
  };

  return (
    <div className="min-h-[70vh] py-12 px-4">
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-2xl font-bold mb-2">تواصل معنا</h1>
        <p className="text-muted-foreground mb-8">
          عندك سؤال أو استفسار؟ ابعتلنا وهنرد عليك بأسرع وقت.
        </p>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">الاسم</Label>
                    <Input
                      id="name"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">الرسالة</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      required
                      value={form.message}
                      onChange={(e) =>
                        setForm({ ...form, message: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" className="gap-2" disabled={sending}>
                    <Send className="h-4 w-4" />{" "}
                    {sending ? "جاري الإرسال..." : "إرسال"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">اتصل بنا</p>
                  <a
                    href="tel:+201098154983"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    dir="ltr"
                  >
                    +20 10 98154983
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">البريد الإلكتروني</p>
                  <p className="text-sm text-muted-foreground">
                    support@almohandes.com
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">واتساب</p>
                  <a
                    href="https://wa.me/201098154983"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    dir="ltr"
                  >
                    +20 10 98154983
                  </a>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">العنوان</p>
                  <p className="text-sm text-muted-foreground">القاهرة، مصر</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center">
          بيانات التواصل دي مبدئية — استبدلها ببياناتك الحقيقية.
        </p>
      </div>
    </div>
  );
}
