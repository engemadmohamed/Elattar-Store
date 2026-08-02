/**
 * Firebase Admin SDK initialization
 * Used for:
 *  - Creating custom tokens after OTP verification (so client can sign in to Firebase)
 *  - Verifying Firebase ID tokens from client
 *  - Managing Firebase Auth users
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let adminApp: any = null;

function getAdmin() {
  if (adminApp) return adminApp;

  try {
    const admin = require("firebase-admin");

    if (admin.apps.length > 0) {
      adminApp = admin;
      return adminApp;
    }

    const serviceAccountPath = path.join(__dirname, "..", "firebase-service-account.json");
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    adminApp = admin;
    console.log("[Firebase Admin] ✅ Initialized for project:", serviceAccount.project_id);
    return adminApp;
  } catch (err) {
    console.error("[Firebase Admin] ❌ Failed to initialize:", err);
    return null;
  }
}

/**
 * Creates a Firebase custom token for a given user UID.
 * Client can use this token to sign in to Firebase.
 */
export async function createFirebaseCustomToken(uid: string, claims?: Record<string, unknown>): Promise<string | null> {
  try {
    const admin = getAdmin();
    if (!admin) return null;

    const token = await admin.auth().createCustomToken(uid, claims || {});
    console.log(`[Firebase Admin] ✅ Custom token created for UID: ${uid}`);
    return token;
  } catch (err) {
    console.error("[Firebase Admin] ❌ Failed to create custom token:", err);
    return null;
  }
}

/**
 * Verifies a Firebase ID token from the client.
 * Returns the decoded token payload if valid.
 */
export async function verifyFirebaseIdToken(idToken: string) {
  try {
    const admin = getAdmin();
    if (!admin) return null;

    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (err) {
    console.error("[Firebase Admin] ❌ Failed to verify ID token:", err);
    return null;
  }
}

/**
 * Creates or retrieves a Firebase Auth user by phone number.
 */
export async function getOrCreateFirebaseUser(phone: string, displayName?: string): Promise<string | null> {
  try {
    const admin = getAdmin();
    if (!admin) return null;

    // Format phone to E.164: +201XXXXXXXXX
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("01") && formattedPhone.length === 11) {
      formattedPhone = `+2${formattedPhone}`;
    } else if (formattedPhone.startsWith("201")) {
      formattedPhone = `+${formattedPhone}`;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+${formattedPhone}`;
    }

    let userRecord;
    try {
      // Try to get existing user by phone
      userRecord = await admin.auth().getUserByPhoneNumber(formattedPhone);
      console.log(`[Firebase Admin] Found existing user: ${userRecord.uid}`);
    } catch {
      // Create new Firebase user
      userRecord = await admin.auth().createUser({
        phoneNumber: formattedPhone,
        displayName: displayName || "مستخدم جديد",
      });
      console.log(`[Firebase Admin] ✅ Created new Firebase user: ${userRecord.uid}`);
    }

    return userRecord.uid;
  } catch (err) {
    console.error("[Firebase Admin] ❌ Failed to get/create user:", err);
    return null;
  }
}
