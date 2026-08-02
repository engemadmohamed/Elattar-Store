import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBYzZiZzR3-XLiUrIvZocl8EoIRWdGKQlE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "almohandes-ddfc3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "almohandes-ddfc3",
  storageBucket: "almohandes-ddfc3.appspot.com",
  messagingSenderId: "15359091850",
  appId: "1:15359091850:web:almohandes",
};

// Initialize Firebase client app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(app);
firebaseAuth.languageCode = "ar";

/**
 * Safely creates or resets an invisible RecaptchaVerifier on containerId
 */
export function setupRecaptcha(containerId: string = "recaptcha-container") {
  if (typeof window === "undefined") return null;

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ""; // Clear existing iframe/elements to prevent 'already rendered' error
  }

  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    (window as any).recaptchaVerifier = null;
  }

  const verifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "invisible",
    callback: () => {
      console.log("[Firebase Auth] reCAPTCHA verified automatically");
    },
    "expired-callback": () => {
      console.warn("[Firebase Auth] reCAPTCHA expired");
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends SMS verification code via Firebase Phone Authentication with automatic reCAPTCHA retry handling
 */
export async function sendFirebasePhoneOtp(
  phone: string,
  containerId: string = "recaptcha-container"
): Promise<ConfirmationResult> {
  // Format to E.164 (+201xxxxxxxxx)
  let formattedPhone = phone.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (formattedPhone.startsWith("01") && formattedPhone.length === 11) {
    formattedPhone = `+2${formattedPhone}`;
  } else if (formattedPhone.startsWith("201")) {
    formattedPhone = `+${formattedPhone}`;
  } else if (!formattedPhone.startsWith("+")) {
    formattedPhone = `+${formattedPhone}`;
  }

  try {
    const appVerifier = setupRecaptcha(containerId);
    if (!appVerifier) {
      throw new Error("فشل إعداد reCAPTCHA الفاحص");
    }

    console.log(`[Firebase Phone Auth] Sending SMS via Firebase to ${formattedPhone}...`);
    const confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, appVerifier);
    console.log(`[Firebase Phone Auth] 🟢 Verification SMS dispatched by Firebase!`);
    return confirmationResult;
  } catch (err: any) {
    if (err?.message?.includes("already been rendered") || err?.code?.includes("already-rendered")) {
      console.warn("[Firebase Phone Auth] Retrying with fresh recaptcha container...");
      const container = document.getElementById(containerId);
      if (container) container.innerHTML = "";
      (window as any).recaptchaVerifier = null;

      const freshVerifier = setupRecaptcha(containerId);
      if (freshVerifier) {
        return await signInWithPhoneNumber(firebaseAuth, formattedPhone, freshVerifier);
      }
    }
    throw err;
  }
}
