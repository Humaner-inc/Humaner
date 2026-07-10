export type TestAgent = {
  id: string;
  label: string;
};

export type TestEnvConfig = {
  apiUrl: string;
  apiKeyMasked: string;
  apiKeyConfigured: boolean;
  agents: TestAgent[];
  rawEnv: {
    HUMANER_API_URL: string;
    HUMANER_API_KEY: string;
    HUMANER_AGENT_ID: string;
    HUMANER_AGENTS: string;
  };
};

function maskSecret(value: string): string {
  if (!value) {
    return "(not set)";
  }
  if (value.length <= 8) {
    return "••••••••";
  }
  return `${value.slice(0, 4)}${"•".repeat(Math.min(value.length - 8, 24))}${value.slice(-4)}`;
}

function parseAgents(
  agentsEnv: string | undefined,
  fallbackAgentId: string | undefined,
): TestAgent[] {
  const trimmed = agentsEnv?.trim();
  if (trimmed) {
    return trimmed
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [id, ...labelParts] = entry.split(":");
        const label = labelParts.join(":").trim();
        return {
          id: id.trim(),
          label: label || id.trim(),
        };
      })
      .filter((agent) => agent.id.length > 0);
  }

  const fallback = fallbackAgentId?.trim();
  if (fallback) {
    return [{ id: fallback, label: "Default agent" }];
  }

  return [];
}

export function getTestEnvConfig(): TestEnvConfig {
  const apiUrl = process.env.HUMANER_API_URL?.trim() || "http://localhost:3001";
  const apiKey = process.env.HUMANER_API_KEY?.trim() || "";
  const agentId = process.env.HUMANER_AGENT_ID?.trim() || "";
  const agentsRaw = process.env.HUMANER_AGENTS?.trim() || "";

  return {
    apiUrl,
    apiKeyMasked: maskSecret(apiKey),
    apiKeyConfigured: apiKey.length > 0,
    agents: parseAgents(agentsRaw, agentId),
    rawEnv: {
      HUMANER_API_URL: apiUrl,
      HUMANER_API_KEY: maskSecret(apiKey),
      HUMANER_AGENT_ID: agentId || "(not set)",
      HUMANER_AGENTS: agentsRaw || "(not set)",
    },
  };
}

export function getServerCredentials(): {
  apiUrl: string;
  apiKey: string;
} {
  return {
    apiUrl: process.env.HUMANER_API_URL?.trim() || "http://localhost:3001",
    apiKey: process.env.HUMANER_API_KEY?.trim() || "",
  };
}
