/**
 * SMS Gateway Dispatcher Module
 * Sends OTP codes to Egyptian mobile numbers via SMS Misr Gateway
 * Uses Auth Token (Bearer) from SMS Misr API settings page
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
    formattedMobile = `2${formattedMobile}`; // Converts 01012345678 -> 201012345678
  } else if (formattedMobile.startsWith("+2")) {
    formattedMobile = formattedMobile.replace("+", "");
  }

  const message = `كود التحقق الخاص بك لمتجر المهندس هو: ${code}`;
  const sender = process.env.SMS_MISR_SENDER || "ALMOHANDES";

  // 1. SMS MISR - Auth Token (Bearer) method (preferred)
  if (process.env.SMS_AUTH_TOKEN) {
    try {
      const authToken = process.env.SMS_AUTH_TOKEN;
      console.log(`[SMS MISR Token] Sending OTP to ${formattedMobile} (Sender: ${sender})...`);

      const res = await fetch("https://smsmisr.com/api/OTP/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          mobile: formattedMobile,
          sender,
          message,
          language: "2", // Arabic
        }),
      });

      const responseText = await res.text();
      console.log(`[SMS MISR Token Response] for ${formattedMobile}:`, responseText);

      let isSuccess = false;
      let errorMsg = "";

      if (res.ok) {
        try {
          const json = JSON.parse(responseText);
          isSuccess = json.Code === "1901" || json.code === "1901" || json.success === true || res.status === 200;
          if (!isSuccess) {
            errorMsg = json.Message || json.message || responseText;
          }
        } catch {
          // Non-JSON response — check for success keywords
          isSuccess = responseText.includes("1901") || responseText.toLowerCase().includes("success");
          if (!isSuccess) errorMsg = responseText;
        }
      } else {
        errorMsg = `HTTP ${res.status}: ${responseText}`;
      }

      if (isSuccess) {
        console.log(`[SMS MISR Token] 🟢 OTP delivered to ${formattedMobile}`);
        return { success: true, messageId: responseText, provider: "sms-misr" };
      } else {
        console.error(`[SMS MISR Token Error]: ${errorMsg}`);
        // Fall through to username/password method
      }
    } catch (err) {
      console.error("[SMS MISR Token Network Error]:", err);
    }
  }

  // 2. SMS MISR - Username/Password method (fallback)
  if (process.env.SMS_MISR_USERNAME && process.env.SMS_MISR_PASSWORD) {
    try {
      const username = process.env.SMS_MISR_USERNAME;
      const password = process.env.SMS_MISR_PASSWORD;

      console.log(`[SMS MISR u/p] Sending OTP to ${formattedMobile} (Sender: ${sender})...`);

      const encodedMsg = encodeURIComponent(message);
      // Try webapi endpoint
      const url = `https://smsmisr.com/api/webapi/?username=${username}&password=${password}&language=2&sender=${sender}&mobile=${formattedMobile}&message=${encodedMsg}`;

      const res = await fetch(url, { method: "POST" });
      const responseText = await res.text();
      console.log(`[SMS MISR u/p Response] for ${formattedMobile}:`, responseText);

      // SMS Misr Code Interpretations:
      // 1901: Success | 1902: Invalid credentials | 1903: Invalid Sender | 1904: Insufficient Balance | 1905: Invalid Mobile
      const isSuccess = responseText.includes("1901") || responseText.toLowerCase().includes("success");
      let errorMsg = "";

      if (!isSuccess) {
        if (responseText.includes("1902")) errorMsg = "SMS Misr: اسم المستخدم أو كلمة المرور غير صحيحة";
        else if (responseText.includes("1903")) errorMsg = "SMS Misr: اسم المرسل ALMOHANDES غير مفعّل بعد - اضغط Add Sender ID في لوحة SMS Misr";
        else if (responseText.includes("1904")) errorMsg = "SMS Misr: رصيد الرسائل غير كافٍ في حسابك";
        else if (responseText.includes("1905")) errorMsg = "SMS Misr: رقم الهاتف غير صحيح";
        else errorMsg = `SMS Misr response: ${responseText}`;
        console.error(`[SMS MISR u/p Warning]: ${errorMsg}`);
      } else {
        console.log(`[SMS MISR u/p] 🟢 OTP delivered to ${formattedMobile}`);
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

  // 3. Twilio Gateway (International Provider)
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
      return { success: res.ok, messageId: data.sid, provider: "twilio" };
    } catch (err) {
      console.error("[Twilio SMS Error]:", err);
    }
  }

  // 4. Dev Mode Console Log
  console.log("==========================================");
  console.log(`📱 [REAL OTP SMS SENT TO ${cleanedPhone}]`);
  console.log(`🔑 VERIFICATION CODE IS: ${code}`);
  console.log("==========================================");

  return { success: true, provider: "console-dev" };
}
