// Injected into the Chrona web app — bridges timer events to the background worker
// config.js is NOT available here (content scripts are isolated), so we hardcode.
const SUPABASE_URL      = "https://vnplmrvcdetlvugfezqq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucGxtcnZjZGV0bHZ1Z2ZlenFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTc4OTAsImV4cCI6MjA5Nzc5Mzg5MH0.YCXk9wqM8YSKcUJbZC3eNRB2P5oHnd9Qu8Tt4QA3Dq4";

const STORAGE_KEY = "chrona_timer";
const SB_URL_KEY  = "chrona_sb_url";
const SB_KEY_KEY  = "chrona_sb_anon";

function getSupabaseCredentials() {
  // The web app stores these as NEXT_PUBLIC env vars baked into the page.
  // We read them from a known meta tag that the app sets, or fall back to
  // scanning localStorage for the Supabase auth session.
  const url = localStorage.getItem(SB_URL_KEY);
  const key = localStorage.getItem(SB_KEY_KEY);
  if (url && key) return { supabaseUrl: url, supabaseAnonKey: key };

  // Try to find the Supabase auth session in localStorage
  // Supabase stores it as "sb-<ref>-auth-token"
  let accessToken = null;
  let userId      = null;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
      try {
        const parsed = JSON.parse(localStorage.getItem(k) ?? "");
        accessToken  = parsed?.access_token ?? null;
        userId       = parsed?.user?.id ?? null;
      } catch {}
    }
  }
  return { accessToken, userId, supabaseUrl: null, supabaseAnonKey: null };
}

function getTimerState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sendToBackground(type) {
  const creds = getSupabaseCredentials();
  const timerState = getTimerState();

  // Try to get Supabase URL from meta tag set by layout.tsx
  const metaUrl = document.querySelector('meta[name="sb-url"]')?.content;
  const metaKey = document.querySelector('meta[name="sb-anon"]')?.content;

  chrome.runtime.sendMessage({
    type,
    ...creds,
    ...(metaUrl ? { supabaseUrl: metaUrl } : {}),
    ...(metaKey ? { supabaseAnonKey: metaKey } : {}),
    timerState,
  });
}

// Listen to events dispatched by Timer.tsx
window.addEventListener("chrona:punch-in",  () => sendToBackground("PUNCH_IN"));
window.addEventListener("chrona:pause",     () => sendToBackground("PAUSE"));
window.addEventListener("chrona:resume",    () => sendToBackground("RESUME"));
window.addEventListener("chrona:punch-out", () => sendToBackground("PUNCH_OUT"));

// On load: auto-authenticate using the session already stored by the Chrona web app
// then sync timer state — no manual sign-in needed
(function syncOnLoad() {
  const creds = getSupabaseCredentials();

  // If we have a token from the web app session, send it to background immediately
  if (creds.accessToken && creds.userId) {
    chrome.runtime.sendMessage({
      type: "AUTO_AUTH",
      accessToken:     creds.accessToken,
      userId:          creds.userId,
      supabaseUrl:     SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    });
  }

  const timerState = getTimerState();
  if (!timerState) return;
  if (timerState.isRunning) {
    sendToBackground("PUNCH_IN");
  } else if (timerState.punchedInAt && !timerState.isRunning) {
    sendToBackground("PUNCH_IN");
    sendToBackground("PAUSE");
  }
})();

// Supabase silently rotates the access token in localStorage on refresh (~hourly),
// but that doesn't fire a same-tab "storage" event, so re-push it periodically
// or the background worker keeps using a stale token and inserts start failing silently.
setInterval(() => {
  const creds = getSupabaseCredentials();
  if (creds.accessToken && creds.userId) {
    chrome.runtime.sendMessage({
      type: "AUTO_AUTH",
      accessToken:     creds.accessToken,
      userId:          creds.userId,
      supabaseUrl:     SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
    });
  }
}, 4 * 60 * 1000);
