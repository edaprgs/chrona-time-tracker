const $ = (id) => document.getElementById(id);

async function getState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, resolve);
  });
}

async function refresh() {
  const bgState = await getState();
  const signedIn = Boolean(bgState.accessToken && bgState.userId);

  $("not-signed-in").style.display = signedIn ? "none" : "block";
  $("signed-in").style.display     = signedIn ? "block" : "none";

  const badge = $("status-badge");
  if (!signedIn) {
    badge.textContent = "Not connected";
    badge.className   = "status-badge signed-out";
  } else if (bgState.isPunchedIn && !bgState.isPaused) {
    badge.textContent = "● Tracking";
    badge.className   = "status-badge recording";
    $("timer-status").textContent = "Tracking";
  } else if (bgState.isPunchedIn && bgState.isPaused) {
    badge.textContent = "Paused";
    badge.className   = "status-badge paused";
    $("timer-status").textContent = "Paused";
  } else {
    badge.textContent = "Idle";
    badge.className   = "status-badge idle";
    $("timer-status").textContent = "Idle";
  }
}

$("sign-out-btn").addEventListener("click", async () => {
  await new Promise((resolve) => chrome.runtime.sendMessage({ type: "SIGN_OUT" }, resolve));
  await refresh();
});

(async () => {
  await refresh();
})();
