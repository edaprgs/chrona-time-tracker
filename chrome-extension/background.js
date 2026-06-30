import { isBlocked, getProductiveLabel, getDomain } from "./blocklist.js";

// ─── State ────────────────────────────────────────────────────────────────────
// Persisted in chrome.storage.session (cleared on browser close)

let state = {
  isPunchedIn: false,
  isPaused: false,
  userId: null,
  accessToken: null,
  supabaseUrl: null,
  supabaseAnonKey: null,
  lastTabUrl: null,
  lastTabTime: null,
};

async function loadState() {
  const stored = await chrome.storage.session.get("trackerState");
  if (stored.trackerState) Object.assign(state, stored.trackerState);
  // Also load credentials from local storage (persisted across browser restarts)
  const creds = await chrome.storage.local.get(["accessToken", "userId", "supabaseUrl", "supabaseAnonKey"]);
  if (creds.accessToken) Object.assign(state, creds);
}

async function persistState() {
  await chrome.storage.session.set({ trackerState: state });
}

// ─── Supabase ─────────────────────────────────────────────────────────────────

async function supabaseSignIn(email, password, supabaseUrl, supabaseAnonKey) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Sign-in failed");
  return res.json(); // { access_token, user: { id } }
}

async function logActivity({ eventType, note, url, domain, category, durationSeconds }) {
  if (!state.isPunchedIn || state.isPaused) return;
  if (!state.accessToken || !state.userId || !state.supabaseUrl) return;

  await fetch(`${state.supabaseUrl}/rest/v1/activity_events`, {
    method: "POST",
    headers: {
      "apikey": state.supabaseAnonKey,
      "Authorization": `Bearer ${state.accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      user_id: state.userId,
      event_type: eventType,
      note: note || null,
      timestamp: new Date().toISOString(),
      metadata: { url, domain, category, duration_seconds: durationSeconds },
    }),
  });
}

// ─── Tab tracking ─────────────────────────────────────────────────────────────

async function handleTabChange(url, title) {
  if (!state.isPunchedIn || state.isPaused) return;
  if (!url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return;
  if (isBlocked(url)) return;

  const domain   = getDomain(url);
  const category = getProductiveLabel(url);
  // Keep this short and recognizable — the raw page title (e.g. a live
  // timer string like "00:05:14 · Nudgine LLC") is confusing in the log,
  // so just use the known category name or bare domain.
  const note     = category || domain || title;

  // Log duration on previous tab before switching
  if (state.lastTabUrl && state.lastTabTime) {
    const durationSeconds = Math.round((Date.now() - state.lastTabTime) / 1000);
    if (durationSeconds >= 10) { // ignore tabs visited for < 10s
      const prevDomain   = getDomain(state.lastTabUrl);
      const prevCategory = getProductiveLabel(state.lastTabUrl);
      await logActivity({
        eventType: "browser_visit",
        note: state.lastTabNote,
        url: state.lastTabUrl,
        domain: prevDomain,
        category: prevCategory,
        durationSeconds,
      });
    }
  }

  state.lastTabUrl  = url;
  state.lastTabTime = Date.now();
  state.lastTabNote = note;
  await persistState();
}

// ─── Message handlers ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "PUNCH_IN": {
        state.isPunchedIn = true;
        state.isPaused    = false;
        state.userId      = msg.userId;
        state.accessToken = msg.accessToken;
        state.supabaseUrl = msg.supabaseUrl;
        state.supabaseAnonKey = msg.supabaseAnonKey;
        state.lastTabUrl  = null;
        state.lastTabTime = null;
        await persistState();
        await chrome.storage.local.set({
          accessToken: msg.accessToken,
          userId: msg.userId,
          supabaseUrl: msg.supabaseUrl,
          supabaseAnonKey: msg.supabaseAnonKey,
        });
        // Start tracking current tab immediately
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) await handleTabChange(tab.url, tab.title ?? "");
        sendResponse({ ok: true });
        break;
      }

      case "PAUSE": {
        // Log current tab duration before pausing
        if (state.lastTabUrl && state.lastTabTime) {
          const durationSeconds = Math.round((Date.now() - state.lastTabTime) / 1000);
          if (durationSeconds >= 10) {
            await logActivity({
              eventType: "browser_visit",
              note: state.lastTabNote,
              url: state.lastTabUrl,
              domain: getDomain(state.lastTabUrl),
              category: getProductiveLabel(state.lastTabUrl),
              durationSeconds,
            });
          }
        }
        state.isPaused    = true;
        state.lastTabUrl  = null;
        state.lastTabTime = null;
        await persistState();
        sendResponse({ ok: true });
        break;
      }

      case "RESUME": {
        state.isPaused = false;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) await handleTabChange(tab.url, tab.title ?? "");
        await persistState();
        sendResponse({ ok: true });
        break;
      }

      case "PUNCH_OUT": {
        // Log current tab before punching out
        if (state.lastTabUrl && state.lastTabTime) {
          const durationSeconds = Math.round((Date.now() - state.lastTabTime) / 1000);
          if (durationSeconds >= 10) {
            await logActivity({
              eventType: "browser_visit",
              note: state.lastTabNote,
              url: state.lastTabUrl,
              domain: getDomain(state.lastTabUrl),
              category: getProductiveLabel(state.lastTabUrl),
              durationSeconds,
            });
          }
        }
        state.isPunchedIn = false;
        state.isPaused    = false;
        state.lastTabUrl  = null;
        state.lastTabTime = null;
        await persistState();
        sendResponse({ ok: true });
        break;
      }

      case "AUTO_AUTH": {
        // Session token pulled from the web app's localStorage — no password needed
        state.accessToken    = msg.accessToken;
        state.userId         = msg.userId;
        state.supabaseUrl    = msg.supabaseUrl;
        state.supabaseAnonKey = msg.supabaseAnonKey;
        await chrome.storage.local.set({
          accessToken: msg.accessToken,
          userId: msg.userId,
          supabaseUrl: msg.supabaseUrl,
          supabaseAnonKey: msg.supabaseAnonKey,
        });
        await persistState();
        sendResponse({ ok: true });
        break;
      }

      case "SIGN_IN": {
        try {
          const { access_token, user } = await supabaseSignIn(
            msg.email, msg.password, msg.supabaseUrl, msg.supabaseAnonKey
          );
          state.accessToken    = access_token;
          state.userId         = user.id;
          state.supabaseUrl    = msg.supabaseUrl;
          state.supabaseAnonKey = msg.supabaseAnonKey;
          await chrome.storage.local.set({
            accessToken: access_token,
            userId: user.id,
            supabaseUrl: msg.supabaseUrl,
            supabaseAnonKey: msg.supabaseAnonKey,
          });
          await persistState();
          sendResponse({ ok: true, userId: user.id });
        } catch (e) {
          sendResponse({ ok: false, error: e.message });
        }
        break;
      }

      case "SIGN_OUT": {
        state.accessToken = null;
        state.userId      = null;
        state.isPunchedIn = false;
        state.isPaused    = false;
        await chrome.storage.local.clear();
        await persistState();
        sendResponse({ ok: true });
        break;
      }

      case "GET_STATE": {
        sendResponse({ ...state });
        break;
      }
    }
  })();
  return true; // keep message channel open for async response
});

// ─── Tab event listeners ──────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url) await handleTabChange(tab.url, tab.title ?? "");
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id !== tabId) return; // only track the active tab
  if (tab?.url) await handleTabChange(tab.url, tab.title ?? "");
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadState();
