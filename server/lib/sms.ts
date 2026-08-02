/**
 * SMS Misr Gateway Dispatcher
 * Comprehensive SMS sending module supporting both Live (1) & Test (2) environments
 */

export interface SmsResult {
  success: boolean;
  messageId?: string;
  provider: "sms-misr" | "console-dev";
  error?: string;
  responseCode?: string;
}

export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const cleanedPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");

  // Format Egyptian mobile number to 201xxxxxxxxx
  let mobile = cleanedPhone;
  if (mobile.startsWith("01") && mobile.length === 11) {
    mobile = `2${mobile}`;
  } else if (mobile.startsWith("+2")) {
    mobile = mobile.replace("+", "");
  } else if (!mobile.startsWith("20") && mobile.length === 10) {
    mobile = `20${mobile}`;
  }

  const message = `كود التحقق الخاص بك لمتجر المهندس هو: ${code}`;
  const sender = process.env.SMS_MISR_SENDER || "ALMOHANDES";
  const username = process.env.SMS_MISR_USERNAME || "0d332a22-857a-4433-b582-2d896daa2bd6";
  const password = process.env.SMS_MISR_PASSWORD || "3d7a2a45-30f5-4e52-8714-c0985c0ec9ee";
  const token = process.env.SMS_AUTH_TOKEN || "";
  const envPreference = process.env.SMS_MISR_ENVIRONMENT || "2"; // Default to 2 (Test Mode)

  // Try environments: preferred first (e.g. 2), then alternate (e.g. 1)
  const environments = [envPreference, envPreference === "2" ? "1" : "2"];

  for (const env of environments) {
    console.log(`[SMS MISR] Attempting SMS dispatch to ${mobile} (Environment: ${env}, Sender: ${sender})...`);

    // Strategy A: SMS Misr OTP API (POST JSON with environment parameter)
    try {
      const otpPayload = {
        environment: env,
        username,
        password,
        sender,
        mobile,
        otp: code,
        message,
        language: "2",
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("https://smsmisr.com/api/OTP/", {
        method: "POST",
        headers,
        body: JSON.stringify(otpPayload),
      });

      const responseText = await res.text();
      console.log(`[SMS MISR OTP API env=${env}] Response:`, responseText);

      let isSuccess = false;
      try {
        const json = JSON.parse(responseText);
        isSuccess = json.Code === "1901" || String(json.Code) === "1901" || json.success === true;
      } catch {
        isSuccess = responseText.includes("1901");
      }

      if (isSuccess) {
        console.log(`[SMS MISR] 🟢 OTP delivered successfully to ${mobile} (env=${env})`);
        return { success: true, messageId: responseText, provider: "sms-misr" };
      }
    } catch (err) {
      console.error(`[SMS MISR OTP API env=${env}] Network Error:`, err);
    }

    // Strategy B: SMS Misr Web API (Form / URL params endpoint)
    try {
      const encodedMsg = encodeURIComponent(message);
      const url = `https://smsmisr.com/api/webapi/?username=${username}&password=${password}&language=2&sender=${sender}&mobile=${mobile}&message=${encodedMsg}&environment=${env}`;

      const res = await fetch(url, { method: "POST" });
      const responseText = await res.text();
      console.log(`[SMS MISR WebAPI env=${env}] Response:`, responseText);

      const isSuccess = responseText.includes("1901") || responseText.toLowerCase().includes("success");
      if (isSuccess) {
        console.log(`[SMS MISR] 🟢 OTP delivered via WebAPI to ${mobile} (env=${env})`);
        return { success: true, messageId: responseText, provider: "sms-misr" };
      }
    } catch (err) {
      console.error(`[SMS MISR WebAPI env=${env}] Network Error:`, err);
    }

    // Strategy C: Standard SMS API (POST JSON)
    try {
      const smsPayload = {
        environment: env,
        username,
        password,
        sender,
        mobile,
        message,
        language: "2",
      };

      const res = await fetch("https://smsmisr.com/api/SMS/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(smsPayload),
      });

      const responseText = await res.text();
      console.log(`[SMS MISR Standard SMS env=${env}] Response:`, responseText);

      const isSuccess = responseText.includes("1901");
      if (isSuccess) {
        console.log(`[SMS MISR] 🟢 OTP delivered via Standard SMS to ${mobile} (env=${env})`);
        return { success: true, messageId: responseText, provider: "sms-misr" };
      }
    } catch (err) {
      console.error(`[SMS MISR Standard SMS env=${env}] Network Error:`, err);
    }
  }

  // Fallback log to console if SMS gateway fails completely
  console.log("==================================================");
  console.log(`📱 [CONSOLE OTP FALLBACK] Phone: ${cleanedPhone} | OTP Code: ${code}`);
  console.log("==================================================");

  return {
    success: false,
    provider: "sms-misr",
    error: "تعذر إرسال رمز التحقق إلى هاتفك حالياً. يرجى التأكد من الرقم والمحاولة لاحقاً.",
  };
}
