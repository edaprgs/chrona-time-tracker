# Chrona Chrome Extension — Setup

## 1. Fill in your Supabase credentials

Open `config.js` and replace the placeholders:

```js
supabaseUrl:     "https://YOUR_PROJECT.supabase.co",
supabaseAnonKey: "YOUR_ANON_KEY",
```

Find these in: Supabase Dashboard → Project Settings → API

## 2. Load the extension in Chrome

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

## 3. Sign in

Click the Chrona icon in your toolbar → enter your Supabase URL, anon key, email, and password → Sign In.

Your credentials are saved — you only do this once.

## 4. Use it

- **Punch in** on the Chrona dashboard → extension starts tracking automatically
- **Pause** → tracking pauses
- **Resume / Punch out** → tracking follows

## What it tracks

Logs a `browser_visit` event in `activity_events` for every tab you spend 10+ seconds on.
Blocked sites (YouTube, Instagram, Facebook, TikTok, Netflix, Reddit, etc.) are never logged.

## Adding your Chrona app URL

If you deploy to Vercel/Netlify, add your production URL to `manifest.json` under `content_scripts.matches`:

```json
"matches": ["http://localhost:3000/*", "https://your-app.vercel.app/*"]
```

Then reload the extension.
