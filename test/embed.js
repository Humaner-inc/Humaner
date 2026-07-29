(function () {
  const hint = document.getElementById("setup-hint");
  const cfg = window.__HUMANER_WIDGET_TEST__;
  const vertical = window.__HUMANER_VERTICAL__;

  function showHint(message) {
    if (!hint) return;
    hint.hidden = false;
    const body = hint.querySelector("[data-hint-body]");
    if (body) body.textContent = message;
  }

  if (!cfg?.baseUrl) {
    showHint(
      "Copy widget-config.example.js to widget-config.local.js and set baseUrl plus agent public IDs.",
    );
    return;
  }

  if (!vertical || !cfg.agents?.[vertical]) {
    showHint("Missing vertical key on this page.");
    return;
  }

  const agentId = cfg.agents[vertical];
  if (!agentId || agentId.includes("YOUR_") || agentId.includes("REPLACE")) {
    showHint(
      `Set agents.${vertical} in widget-config.local.js (Dashboard → agent → Integrations → Widget).`,
    );
    return;
  }

  const base = String(cfg.baseUrl).replace(/\/$/, "");
  const script = document.createElement("script");
  script.src = `${base}/widget.js`;
  script.setAttribute("data-agent", agentId);
  script.setAttribute("data-position", "bottom-right");
  document.body.appendChild(script);
})();
