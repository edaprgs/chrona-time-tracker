// Domains that are NEVER tracked — social, entertainment, personal
export const BLOCKED_DOMAINS = new Set([
  "youtube.com", "youtu.be", "music.youtube.com",
  "instagram.com", "facebook.com", "messenger.com",
  "twitter.com", "x.com",
  "tiktok.com",
  "netflix.com", "hulu.com", "disneyplus.com", "primevideo.com", "max.com",
  "twitch.tv",
  "reddit.com",
  "linkedin.com",
  "pinterest.com",
  "snapchat.com",
  "tumblr.com",
  "9gag.com",
  "buzzfeed.com",
  "espn.com", "nba.com", "nfl.com",
  "amazon.com", "ebay.com", "shopee.com", "lazada.com",
  "spotify.com",
  "pornhub.com", "xvideos.com",
]);

// Productive domains — these are explicitly logged with a category label
export const PRODUCTIVE_DOMAINS = {
  // Code
  "github.com":            "GitHub",
  "gitlab.com":            "GitLab",
  "bitbucket.org":         "Bitbucket",
  "vscode.dev":            "VS Code Web",
  "codepen.io":            "CodePen",
  "codesandbox.io":        "CodeSandbox",
  "stackblitz.com":        "StackBlitz",
  "replit.com":            "Replit",
  // Docs / Research
  "developer.mozilla.org": "MDN",
  "stackoverflow.com":     "Stack Overflow",
  "npmjs.com":             "npm",
  "docs.rs":               "Rust Docs",
  "pkg.go.dev":            "Go Docs",
  "devdocs.io":            "DevDocs",
  "w3schools.com":         "W3Schools",
  "css-tricks.com":        "CSS-Tricks",
  "web.dev":               "web.dev",
  "tailwindcss.com":       "Tailwind Docs",
  "ui.shadcn.com":         "shadcn/ui",
  "nextjs.org":            "Next.js Docs",
  "supabase.com":          "Supabase",
  "vercel.com":            "Vercel",
  "netlify.com":           "Netlify",
  "cloudflare.com":        "Cloudflare",
  "render.com":            "Render",
  "railway.app":           "Railway",
  // Project Management
  "linear.app":            "Linear",
  "atlassian.net":         "Jira / Confluence",
  "notion.so":             "Notion",
  "trello.com":            "Trello",
  "asana.com":             "Asana",
  "clickup.com":           "ClickUp",
  "basecamp.com":          "Basecamp",
  "airtable.com":          "Airtable",
  // Design
  "figma.com":             "Figma",
  "sketch.com":            "Sketch",
  "zeplin.io":             "Zeplin",
  "dribbble.com":          "Dribbble",
  // AI Tools
  "claude.ai":             "Claude",
  "chat.openai.com":       "ChatGPT",
  "gemini.google.com":     "Gemini",
  "cursor.sh":             "Cursor",
  "v0.dev":                "v0",
  // Communication (work)
  "slack.com":             "Slack",
  "discord.com":           "Discord",
  "meet.google.com":       "Google Meet",
  "zoom.us":               "Zoom",
  "teams.microsoft.com":   "Teams",
  "mail.google.com":       "Gmail",
  "outlook.live.com":      "Outlook",
  // Cloud / Infra
  "console.aws.amazon.com":"AWS Console",
  "console.cloud.google.com": "GCP Console",
  "portal.azure.com":      "Azure",
  "app.datadoghq.com":     "Datadog",
  "sentry.io":             "Sentry",
  "grafana.com":           "Grafana",
  "postman.com":           "Postman",
};

export function getDomain(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return null;
  }
}

export function isBlocked(url) {
  const domain = getDomain(url);
  if (!domain) return true;
  // Check exact + parent domain
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain === blocked || domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

export function getProductiveLabel(url) {
  const domain = getDomain(url);
  if (!domain) return null;
  for (const [prod, label] of Object.entries(PRODUCTIVE_DOMAINS)) {
    if (domain === prod || domain.endsWith(`.${prod}`)) return label;
  }
  // localhost / the deployed Chrona app are always labeled clearly
  if (domain === "localhost" || domain === "127.0.0.1") return "Local Dev";
  if (domain === "chrona-time-tracker.vercel.app") return "Chrona";
  return null; // unknown domain — still track it
}
