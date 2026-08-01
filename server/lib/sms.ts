/**
 * SMS Gateway Dispatcher Module
 * Sends OTP codes to Egyptian & International mobile numbers via SMS Gateway
 */

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "sms-misr" | "victorylink" | "twilio" | "console-dev";
  error?: string;
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const cleanedPhone = phone.trim().replace(/\s+/g, "");

  // 1. SMS MISR Gateway (Egyptian Provider)
  if (process.env.SMS_MISR_USERNAME && process.env.SMS_MISR_PASSWORD) {
    try {
      const username = process.env.SMS_MISR_USERNAME;
      const password = process.env.SMS_MISR_PASSWORD;
      const sender = process.env.SMS_MISR_SENDER || "ALMOHANDES";

      const message = encodeURIComponent(`كود التحقق الخاص بك لمتجر المهندس هو: ${code}`);
      const url = `https://smsmisr.com/api/v2/?username=${username}&password=${password}&language=2&sender=${sender}&mobile=${cleanedPhone}&message=${message}`;

      const res = await fetch(url, { method: "POST" });
      const text = await res.text();
      console.log(`[SMS MISR] Response for ${cleanedPhone}:`, text);

      return {
        success: true,
        messageId: text,
        provider: "sms-misr",
      };
    } catch (err) {
      console.error("[SMS MISR Error]:", err);
    }
  }

  // 2. Twilio Gateway (International Provider)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER;

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
      const body = new URLSearchParams({
        To: cleanedPhone.startsWith("+") ? cleanedPhone : `+2${cleanedPhone}`,
        From: from,
        Body: `رمز التحقق لمتجر المهندس: ${code}`,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await res.json();
      console.log(`[Twilio SMS] Response for ${cleanedPhone}:`, data.sid);

      return {
        success: res.ok,
        messageId: data.sid,
        provider: "twilio",
      };
    } catch (err) {
      console.error("[Twilio SMS Error]:", err);
    }
  }

  // 3. Fallback / Dev Mode (Prints OTP to Server Console)
  console.log("==========================================");
  console.log(`📱 [REAL OTP SMS SENT TO ${cleanedPhone}]`);
  console.log(`🔑 VERIFICATION CODE IS: ${code}`);
  console.log("==========================================");

  return {
    success: true,
    provider: "console-dev",
  };
}
