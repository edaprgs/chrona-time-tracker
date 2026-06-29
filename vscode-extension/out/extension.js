"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
let queue = [];
let flushTimer = null;
let activeSessionId = null;
let statusBar;
function activate(ctx) {
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = "chrona.showStatus";
    ctx.subscriptions.push(statusBar);
    refreshStatus();
    // Poll for active session every 30s so the extension knows which session to attach events to
    const sessionPoll = setInterval(fetchActiveSession, 30000);
    fetchActiveSession();
    ctx.subscriptions.push(vscode.commands.registerCommand("chrona.enable", () => {
        getConfig().update("enabled", true, true);
        vscode.window.showInformationMessage("Chrona tracking enabled.");
        refreshStatus();
    }), vscode.commands.registerCommand("chrona.disable", () => {
        getConfig().update("enabled", false, true);
        vscode.window.showInformationMessage("Chrona tracking disabled.");
        refreshStatus();
    }), vscode.commands.registerCommand("chrona.showStatus", showStatus), 
    // Track file opens
    vscode.workspace.onDidOpenTextDocument((doc) => {
        enqueue({ event_type: "file_open", ...docMeta(doc), lines_changed: null });
    }), 
    // Track file saves with line-count delta
    vscode.workspace.onDidSaveTextDocument((doc) => {
        enqueue({ event_type: "file_save", ...docMeta(doc), lines_changed: null });
    }), 
    // Track edits (debounced — only record significant changes)
    vscode.workspace.onDidChangeTextDocument((e) => {
        const delta = e.contentChanges.reduce((sum, c) => sum + Math.abs(c.text.split("\n").length - 1), 0);
        if (delta > 0) {
            enqueue({ event_type: "file_edit", ...docMeta(e.document), lines_changed: delta });
        }
    }), 
    // Track terminal commands
    vscode.window.onDidOpenTerminal((term) => {
        enqueue({
            event_type: "terminal",
            file_path: null,
            workspace: workspaceName(),
            language: null,
            lines_changed: null,
            git_branch: null,
            metadata: { name: term.name },
        });
    }));
    ctx.subscriptions.push({ dispose: () => { clearInterval(sessionPoll); if (flushTimer)
            clearTimeout(flushTimer); } });
}
function deactivate() {
    flush();
}
// ─── helpers ──────────────────────────────────────────────────────────────────
function getConfig() {
    return vscode.workspace.getConfiguration("chrona");
}
function cfg(key) {
    return getConfig().get(key);
}
function docMeta(doc) {
    return {
        file_path: doc.fileName,
        workspace: workspaceName(),
        language: doc.languageId,
        git_branch: null, // populated asynchronously via git extension below
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
    queue.push({ ...partial, timestamp: new Date().toISOString(), session_id: activeSessionId });
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
async function fetchActiveSession() {
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
            activeSessionId = json.session?.id ?? null;
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
    else if (activeSessionId) {
        statusBar.text = "$(clock) Chrona: recording";
        statusBar.color = new vscode.ThemeColor("statusBarItem.prominentForeground");
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
    vscode.window.showInformationMessage(`Chrona: ${enabled ? "enabled" : "disabled"} · session: ${activeSessionId ?? "none"} · token: ${token ? "set" : "not set"} · queued: ${queue.length}`);
}
//# sourceMappingURL=extension.js.map