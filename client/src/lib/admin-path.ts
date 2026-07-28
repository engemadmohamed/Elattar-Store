// The admin dashboard is served under a non-obvious, configurable path
// instead of `/admin` so it isn't discoverable by guessing the URL.
// Set VITE_ADMIN_PATH in your .env file to change it (see .env.example).
const raw = (import.meta.env.VITE_ADMIN_PATH as string | undefined)?.trim();

export const ADMIN_BASE = raw ? `/${raw.replace(/^\/+|\/+$/g, "")}` : "/admin";
