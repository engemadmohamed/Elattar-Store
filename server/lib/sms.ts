/**
 * SMS Gateway Dispatcher Module
 * Sends OTP codes via SMS Misr with Auth Token (Bearer)
 * SMS Misr OTP API docs: https://smsmisr.com/api/OTP/
 */

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "sms-misr" | "twilio" | "console-dev";
  error?: string;
  responseCode?: string;
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const cleanedPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");

  // Format Egyptian mobile number (SMS Misr requires 201xxxxxxxxx format)
  let formattedMobile = cleanedPhone;
  if (formattedMobile.startsWith("01") && formattedMobile.length === 11) {
    formattedMobile = `2${formattedMobile}`; // 01012345678 -> 201012345678
  } else if (formattedMobile.startsWith("+2")) {
    formattedMobile = formattedMobile.replace("+", "");
  }

  const message = `كود التحقق الخاص بك لمتجر المهندس هو: ${code}`;
  const sender = process.env.SMS_MISR_SENDER || "ALMOHANDES";

  // 1. SMS MISR - Auth Token (Bearer) method — OTP API endpoint
  if (process.env.SMS_AUTH_TOKEN) {
    try {
      const authToken = process.env.SMS_AUTH_TOKEN;
      console.log(`[SMS MISR OTP] Sending to ${formattedMobile} via Bearer token...`);

      // Try OTP-specific endpoint first
      const otpEndpoints = [
        {
          url: "https://smsmisr.com/api/OTP/",
          body: {
            Mobile: formattedMobile,
            Sender: sender,
            Message: message,
            Language: "2",
          },
        },
        {
          url: "https://smsmisr.com/api/SMS/",
          body: {
            mobile: formattedMobile,
            sender,
            message,
            language: "2",
          },
        },
      ];

      for (const endpoint of otpEndpoints) {
        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(endpoint.body),
        });

        const responseText = await res.text();
        console.log(`[SMS MISR] Endpoint ${endpoint.url} response for ${formattedMobile}:`, responseText);

        let isSuccess = false;
        let errorMsg = "";

        try {
          const json = JSON.parse(responseText);
          isSuccess =
            json.Code === "1901" ||
            json.code === "1901" ||
            String(json.Code) === "1901" ||
            json.success === true ||
            res.status === 200;
          if (!isSuccess) {
            errorMsg = json.Message || json.message || responseText;
          }
        } catch {
          isSuccess = responseText.includes("1901") || responseText.toLowerCase().includes("success");
          if (!isSuccess) errorMsg = responseText;
        }

        if (isSuccess) {
          console.log(`[SMS MISR] ✅ OTP delivered to ${formattedMobile} via ${endpoint.url}`);
          return { success: true, messageId: responseText, provider: "sms-misr" };
        }

        // If error indicates wrong endpoint, try next
        if (responseText.includes("1902") || responseText.includes("not found") || res.status === 404) {
          console.log(`[SMS MISR] Endpoint ${endpoint.url} failed, trying next...`);
          continue;
        }

        // Permanent errors — stop retrying
        if (responseText.includes("1903") || responseText.includes("1904") || responseText.includes("1905")) {
          errorMsg = responseText.includes("1903")
            ? "SMS Misr: اسم المرسل ALMOHANDES غير مفعّل بعد — اضغط Add Sender ID في لوحة SMS Misr"
            : responseText.includes("1904")
            ? "SMS Misr: رصيد الرسائل غير كافٍ"
            : "SMS Misr: رقم الهاتف غير صحيح";
          console.error(`[SMS MISR] ${errorMsg}`);
          return { success: false, provider: "sms-misr", error: errorMsg, responseCode: responseText };
        }
      }
    } catch (err) {
      console.error("[SMS MISR Network Error]:", err);
    }
  }

  // 2. SMS MISR - Username/Password fallback
  if (process.env.SMS_MISR_USERNAME && process.env.SMS_MISR_PASSWORD) {
    try {
      const username = process.env.SMS_MISR_USERNAME;
      const password = process.env.SMS_MISR_PASSWORD;

      console.log(`[SMS MISR u/p] Fallback: Sending OTP to ${formattedMobile}...`);
      const encodedMsg = encodeURIComponent(message);
      const url = `https://smsmisr.com/api/webapi/?username=${username}&password=${password}&language=2&sender=${sender}&mobile=${formattedMobile}&message=${encodedMsg}`;

      const res = await fetch(url, { method: "POST" });
      const responseText = await res.text();
      console.log(`[SMS MISR u/p Response]:`, responseText);

      const isSuccess = responseText.includes("1901") || responseText.toLowerCase().includes("success");
      let errorMsg = "";
      if (!isSuccess) {
        if (responseText.includes("1902")) errorMsg = "SMS Misr: بيانات الدخول خاطئة";
        else if (responseText.includes("1903")) errorMsg = "SMS Misr: Sender ID غير مفعّل";
        else if (responseText.includes("1904")) errorMsg = "SMS Misr: رصيد غير كافٍ";
        else if (responseText.includes("1905")) errorMsg = "SMS Misr: رقم هاتف غير صحيح";
        else errorMsg = responseText;
        console.error(`[SMS MISR u/p] ${errorMsg}`);
      }

      return {
        success: isSuccess,
        messageId: responseText,
        provider: "sms-misr",
        error: isSuccess ? undefined : errorMsg,
        responseCode: responseText,
      };
    } catch (err) {
      console.error("[SMS MISR u/p Network Error]:", err);
    }
  }

  // 3. Twilio fallback
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
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const data = await res.json();
      return { success: res.ok, messageId: data.sid, provider: "twilio" };
    } catch (err) {
      console.error("[Twilio SMS Error]:", err);
    }
  }

  // 4. Dev fallback — log to console
  console.log("==========================================");
  console.log(`📱 [DEV OTP] Phone: ${cleanedPhone} | Code: ${code}`);
  console.log("==========================================");
  return { success: true, provider: "console-dev" };
}
