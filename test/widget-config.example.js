/**
 * Copy to widget-config.local.js and fill in your agent public IDs
 * (same values as Docs/scripts/load-chat.config.json → agents).
 */
window.__HUMANER_WIDGET_TEST__ = {
  baseUrl: "http://localhost:3001",
  agents: {
    ECOMMERCE: "YOUR_RETAIL_AGENT_PUBLIC_ID",
    EDUCATION: "YOUR_DIGITAL_AGENT_PUBLIC_ID",
    FITNESS: "YOUR_WELLNESS_AGENT_PUBLIC_ID",
    TRAVEL: "YOUR_HOSPITALITY_AGENT_PUBLIC_ID",
  },
};
