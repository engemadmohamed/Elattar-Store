/**
 * SMS Gateway — Auth Token (Bearer) only
 * Uses SMS_AUTH_TOKEN from .env
 */

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "sms-token" | "console-dev";
  error?: string;
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const cleanedPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");

  // Format Egyptian mobile → 201xxxxxxxxx
  let mobile = cleanedPhone;
  if (mobile.startsWith("01") && mobile.length === 11) mobile = `2${mobile}`;
  else if (mobile.startsWith("+2")) mobile = mobile.replace("+", "");

  const message = `كود التحقق الخاص بك لمتجر المهندس هو: ${code}`;

  if (process.env.SMS_AUTH_TOKEN) {
    const token = process.env.SMS_AUTH_TOKEN;

    // Try both endpoints
    const endpoints = [
      {
        url: "https://smsmisr.com/api/OTP/",
        body: { Mobile: mobile, Sender: "ALMOHANDES", Message: message, Language: "2" },
      },
      {
        url: "https://smsmisr.com/api/SMS/",
        body: { mobile, sender: "ALMOHANDES", message, language: "2" },
      },
    ];

    for (const ep of endpoints) {
      try {
        console.log(`[SMS] Trying ${ep.url} → ${mobile}`);
        const res = await fetch(ep.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(ep.body),
        });

        const text = await res.text();
        console.log(`[SMS] Response from ${ep.url}:`, text);

        let success = false;
        try {
          const json = JSON.parse(text);
          success = json.Code === "1901" || String(json.Code) === "1901" || json.success === true;
        } catch {
          success = text.includes("1901");
        }

        if (success) {
          console.log(`[SMS] ✅ OTP sent to ${mobile}`);
          return { success: true, provider: "sms-token", messageId: text };
        }

        // Permanent errors — don't try next endpoint
        if (text.includes("1904") || text.includes("1905")) break;
      } catch (err) {
        console.error(`[SMS] Network error on ${ep.url}:`, err);
      }
    }

    console.warn("[SMS] All endpoints failed — falling back to console");
  }

  // Dev fallback — show code in server console
  console.log("============================================");
  console.log(`📱 OTP for ${cleanedPhone} → CODE: ${code}`);
  console.log("============================================");
  return { success: true, provider: "console-dev" };
}
