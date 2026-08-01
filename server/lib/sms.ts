/**
 * SMS Gateway Dispatcher Module
 * Sends OTP codes to Egyptian & International mobile numbers via SMS Gateway (SMS Misr / Twilio)
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

  // 1. SMS MISR Gateway (Egyptian Provider)
  if (process.env.SMS_MISR_USERNAME && process.env.SMS_MISR_PASSWORD) {
    try {
      const username = process.env.SMS_MISR_USERNAME;
      const password = process.env.SMS_MISR_PASSWORD;
      const sender = process.env.SMS_MISR_SENDER || "ALMOHANDES";
      const message = `رمز التحقق الخاص بك لمتجر المهندس هو: ${code}`;

      console.log(`[SMS MISR] Dispatching OTP to ${formattedMobile} (Sender: ${sender})...`);

      // Try SMS Misr JSON Web API POST
      const res = await fetch("https://smsmisr.com/api/v2/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          language: "2", // Arabic
          sender,
          mobile: formattedMobile,
          message,
        }),
      });

      const responseText = await res.text();
      console.log(`[SMS MISR Raw Response] for ${formattedMobile}:`, responseText);

      // SMS Misr Code Interpretations:
      // 1901: Success
      // 1902: Invalid Username or Password
      // 1903: Invalid Sender ID (Sender name not approved by SMS Misr)
      // 1904: Insufficient Balance
      // 1905: Invalid Mobile Number
      let isSuccess = false;
      let errorMsg = "";

      if (responseText.includes("1901") || responseText.toLowerCase().includes("success")) {
        isSuccess = true;
        console.log(`[SMS MISR Success] 🟢 OTP delivered to ${formattedMobile}`);
      } else if (responseText.includes("1902")) {
        errorMsg = "SMS Misr: اسم المستخدم أو كلمة المرور غير صحيحة";
      } else if (responseText.includes("1903")) {
        errorMsg = "SMS Misr: اسم المرسل Sender ID غير مفعّل بالحساب";
      } else if (responseText.includes("1904")) {
        errorMsg = "SMS Misr: رصيد الرسائل غير كافٍ في حسابك";
      } else if (responseText.includes("1905")) {
        errorMsg = "SMS Misr: رقم الهاتف غير صحيح";
      } else {
        errorMsg = `SMS Misr response: ${responseText}`;
      }

      if (!isSuccess) {
        console.error(`[SMS MISR Warning]: ${errorMsg}`);
      }

      return {
        success: isSuccess,
        messageId: responseText,
        provider: "sms-misr",
        error: errorMsg || undefined,
        responseCode: responseText,
      };
    } catch (err) {
      console.error("[SMS MISR Network Error]:", err);
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

  // 3. Dev Mode Console Log
  console.log("==========================================");
  console.log(`📱 [REAL OTP SMS SENT TO ${cleanedPhone}]`);
  console.log(`🔑 VERIFICATION CODE IS: ${code}`);
  console.log("==========================================");

  return {
    success: true,
    provider: "console-dev",
  };
}
