"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
let queue = [];
let flushTimer = null;
let isPunchedIn = false;
let isPaused = false;
let statusBar;
let pendingSignInState = null;
let currentBranch = null;
// Per-file edit accumulation — net lines changed since the last flush for
// that file, so a burst of keystrokes becomes ONE consolidated log entry
// instead of a separate row per change event.
const pendingEdits = new Map();
const EDIT_IDLE_MS = 10000; // flush a file's edit summary after 10s of no further changes to it
function activate(ctx) {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = "chrona.showStatus";
    ctx.subscriptions.push(statusBar);
    refreshStatus();
    // Poll punch state every 10s — a short interval keeps the window where
    // events get dropped right after punching in small (the sessions table
    // only gets a row at punch-out, so this live_status poll is the only
    // signal the extension has for "are you punched in right now").
    const statusPoll = setInterval(fetchPunchState, 10000);
    fetchPunchState();
    setupGitTracking();
    ctx.subscriptions.push(vscode.commands.registerCommand("chrona.enable", () => {
        getConfig().update("enabled", true, true);
        vscode.window.showInformationMessage("Chrona tracking enabled.");
        refreshStatus();
    }), vscode.commands.registerCommand("chrona.disable", () => {
        getConfig().update("enabled", false, true);
        vscode.window.showInformationMessage("Chrona tracking disabled.");
        refreshStatus();
    }), vscode.commands.registerCommand("chrona.showStatus", showStatus), vscode.commands.registerCommand("chrona.signIn", signIn), vscode.window.registerUriHandler({
        handleUri(uri) {
            const params = new URLSearchParams(uri.query);
            const key = params.get("key");
            const state = params.get("state");
            if (!key || !state || state !== pendingSignInState) {
                vscode.window.showErrorMessage("Chrona sign-in failed: invalid or expired request.");
                return;
            }
            pendingSignInState = null;
            getConfig().update("accessToken", key, true);
            vscode.window.showInformationMessage("Chrona: signed in successfully.");
            refreshStatus();
            fetchPunchState();
        },
    }), 
    // Track file opens
    vscode.workspace.onDidOpenTextDocument((doc) => {
        if (doc.uri.scheme !== "file")
            return;
        enqueue({ event_type: "file_open", ...docMeta(doc), lines_changed: null, note: null });
    }), 
    // Track file saves
    vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.scheme !== "file")
            return;
        // A save flushes any pending edit summary for this file immediately,
        // so the save event carries the accurate net line delta.
        const pending = pendingEdits.get(doc.fileName);
        const lines_changed = pending?.delta ?? null;
        if (pending) {
            clearTimeout(pending.timer);
            pendingEdits.delete(doc.fileName);
        }
        enqueue({ event_type: "file_save", ...docMeta(doc), lines_changed, note: null });
    }), 
    // Track edits — accumulated per file, flushed as one consolidated entry
    // after EDIT_IDLE_MS of inactivity on that file (or on save, above).
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme !== "file")
            return;
        const delta = e.contentChanges.reduce((sum, c) => {
            const added = c.text.length ? c.text.split("\n").length - 1 || 1 : 0;
            const removed = c.rangeLength > 0 ? c.range.end.line - c.range.start.line + 1 : 0;
            return sum + added - removed;
        }, 0);
        if (delta === 0)
            return;
        const key = e.document.fileName;
        const existing = pendingEdits.get(key);
        if (existing)
            clearTimeout(existing.timer);
        const totalDelta = (existing?.delta ?? 0) + delta;
        const timer = setTimeout(() => {
            pendingEdits.delete(key);
            enqueue({ event_type: "file_edit", ...docMeta(e.document), lines_changed: totalDelta, note: null });
        }, EDIT_IDLE_MS);
        pendingEdits.set(key, { delta: totalDelta, doc: e.document, timer });
    }), 
    // Track terminal commands
    vscode.window.onDidOpenTerminal((term) => {
        enqueue({
            event_type: "terminal",
            file_path: null,
            workspace: workspaceName(),
            language: null,
            lines_changed: null,
            git_branch: currentBranch,
            note: term.name,
            metadata: { name: term.name },
        });
    }));
    ctx.subscriptions.push({
        dispose: () => {
            clearInterval(statusPoll);
            if (flushTimer)
                clearTimeout(flushTimer);
            for (const { timer } of pendingEdits.values())
                clearTimeout(timer);
        },
    });
}
function deactivate() {
    // Flush any in-progress edit summaries immediately rather than losing them.
    for (const [key, { delta, doc, timer }] of pendingEdits) {
        clearTimeout(timer);
        if (isPunchedIn && !isPaused) {
            queue.push({ event_type: "file_edit", ...docMeta(doc), lines_changed: delta, note: null, timestamp: new Date().toISOString(), session_id: null });
        }
        pendingEdits.delete(key);
    }
    flush();
}
// ─── Git tracking ───────────────────────────────────────────────────────────
// Populates currentBranch for every event's git_branch field, and emits a
// git_commit event (with the commit message as the note) whenever HEAD moves
// to a new commit in any open repository.
async function setupGitTracking() {
    const gitExt = vscode.extensions.getExtension("vscode.git");
    if (!gitExt)
        return;
    const exports = gitExt.isActive ? gitExt.exports : await gitExt.activate();
    const api = exports.getAPI(1);
    const watchedRepos = new Set();
    function watchRepo(repo) {
        const key = repo.rootUri.toString();
        if (watchedRepos.has(key))
            return;
        watchedRepos.add(key);
        let lastCommitHash = repo.state.HEAD?.commit ?? null;
        currentBranch = repo.state.HEAD?.name ?? currentBranch;
        repo.state.onDidChange(async () => {
            currentBranch = repo.state.HEAD?.name ?? currentBranch;
            const newCommit = repo.state.HEAD?.commit ?? null;
            if (!newCommit || newCommit === lastCommitHash)
                return;
            lastCommitHash = newCommit;
            try {
                const [latest] = await repo.log({ maxEntries: 1 });
                const message = latest?.message?.split("\n")[0] ?? null;
                enqueue({
                    event_type: "git_commit",
                    file_path: null,
                    workspace: workspaceName(),
                    language: null,
                    lines_changed: null,
                    git_branch: currentBranch,
                    note: message,
                    metadata: { hash: newCommit },
                });
            }
            catch {
                // repo.log can fail transiently right after a commit; skip silently
            }
        });
    }
    api.repositories.forEach(watchRepo);
    api.onDidOpenRepository(watchRepo);
}
// ─── helpers ──────────────────────────────────────────────────────────────────
function getConfig() {
    return vscode.workspace.getConfiguration("chrona");
}
async function signIn() {
    const baseUrl = (cfg("apiUrl") || "http://localhost:3000").replace(/\/$/, "");
    pendingSignInState = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const authUrl = vscode.Uri.parse(`${baseUrl}/vscode-auth?state=${pendingSignInState}`);
    await vscode.env.openExternal(authUrl);
    vscode.window.showInformationMessage("Chrona: approve the sign-in request in your browser.");
}
function cfg(key) {
    return getConfig().get(key);
}
function docMeta(doc) {
    return {
        file_path: doc.fileName,
        workspace: workspaceName(),
        language: doc.languageId,
        git_branch: currentBranch,
        metadata: null,
    };
}
function workspaceName() {
    const folders = vscode.workspace.workspaceFolders;
    return folders?.[0]?.name ?? null;
}
function enqueue(partial) {
    if (!cfg("enabled"))
        return;
    if (!cfg("accessToken"))
        return;
    // Only track while actually punched in and not paused — matches the
    // Chrome extension's behavior.
    if (!isPunchedIn || isPaused)
        return;
    queue.push({ ...partial, timestamp: new Date().toISOString(), session_id: null });
    if (flushTimer)
        clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, cfg("debounceMs") ?? 5000);
}
async function flush() {
    if (queue.length === 0)
        return;
    const batch = [...queue];
    queue = [];
    const token = cfg("accessToken");
    const baseUrl = (cfg("apiUrl") || "http://localhost:3000").replace(/\/$/, "");
    try {
        const res = await fetch(`${baseUrl}/api/activity`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(batch),
        });
        if (!res.ok) {
            // Re-queue on failure
            queue = [...batch, ...queue];
        }
    }
    catch {
        queue = [...batch, ...queue];
    }
    refreshStatus();
}
async function fetchPunchState() {
    const token = cfg("accessToken");
    const baseUrl = (cfg("apiUrl") || "http://localhost:3000").replace(/\/$/, "");
    if (!token)
        return;
    try {
        const res = await fetch(`${baseUrl}/api/activity`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const json = await res.json();
            isPunchedIn = json.punchedIn ?? false;
            isPaused = json.paused ?? false;
            refreshStatus();
        }
    }
    catch { }
}
function refreshStatus() {
    const enabled = cfg("enabled");
    const hasToken = Boolean(cfg("accessToken"));
    if (!hasToken) {
        statusBar.text = "$(clock) Chrona: no token";
        statusBar.tooltip = "Set chrona.accessToken in VS Code settings";
        statusBar.color = new vscode.ThemeColor("statusBarItem.warningForeground");
    }
    else if (!enabled) {
        statusBar.text = "$(clock) Chrona: off";
        statusBar.color = undefined;
    }
    else if (isPunchedIn && !isPaused) {
        statusBar.text = "$(clock) Chrona: recording";
        statusBar.color = new vscode.ThemeColor("statusBarItem.prominentForeground");
    }
    else if (isPunchedIn && isPaused) {
        statusBar.text = "$(clock) Chrona: paused";
        statusBar.color = new vscode.ThemeColor("statusBarItem.warningForeground");
    }
    else {
        statusBar.text = "$(clock) Chrona: idle";
        statusBar.color = undefined;
    }
    statusBar.show();
}
function showStatus() {
    const enabled = cfg("enabled");
    const token = cfg("accessToken");
    vscode.window.showInformationMessage(`Chrona: ${enabled ? "enabled" : "disabled"} · punched in: ${isPunchedIn} · paused: ${isPaused} · token: ${token ? "set" : "not set"} · queued: ${queue.length}`);
}
//# sourceMappingURL=extension.js.map