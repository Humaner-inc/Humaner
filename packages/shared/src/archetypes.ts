export type PersonalityTone = "casual" | "corporate" | "efficient" | "custom";

/** Solid persona discs — Humaner green, cobalt, orange, custom grey. */
export const PERSONA_DISK: Record<PersonalityTone, string> = {
  casual: "#226342",
  corporate: "#2252bc",
  efficient: "#f85919",
  custom: "#F2F2F2",
};

/** Panel behind persona color fields — shows through the top-left dissolve. */
export const PERSONA_FIELD_BACKGROUND = "#101010";

/**
 * Color blooms from the lower-right and dissolves into the panel at the
 * top-left. Interpolates in oklab so the hue never muddies through black
 * (the usual cheap look of `transparent` in sRGB).
 */
export function personaSquareFillStyle(color: string): {
  backgroundImage: string;
} {
  return {
    backgroundImage: [
      `radial-gradient(90% 80% at 72% 68% in oklab, ${color} 0%, transparent 70%)`,
      `radial-gradient(155% 140% at 118% 122% in oklab, ${color} 0%, ${color} 46%, transparent 78%)`,
    ].join(", "),
  };
}

export type ArchetypeDefinition = {
  id: PersonalityTone;
  /** Persona name — Astral, Taleb, Vidi, Custom. */
  personaName: string | null;
  /** Tone label — Casual, Corporate, Efficient, Zero preset. */
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  bestFor: string;
  userMessage: string;
  agentMessage: string;
  agentStyle: "casual" | "corporate" | "efficient";
  imageSrc: string;
  gradientSrc: string;
};

export const ARCHETYPE_COMPARE_QUESTION = "I need to reset my password.";

/** Canonical agent personalities — shared by landing + documentation. */
export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    id: "casual",
    personaName: "Astral",
    name: "Casual",
    tagline: "Warm, human with friendly tone.",
    description:
      "Friendly and engaging. Uses contractions, lowercase openers and few jokes.",
    traits: [
      "Contractions and natural phrasing",
      "Warm acknowledgements before answers",
    ],
    bestFor: "Retail, community brands, and consumer support",
    userMessage: ARCHETYPE_COMPARE_QUESTION,
    agentMessage:
      "hey no worries! simply go to settings → account → reset password. Must takes like 30 seconds, send me a message when it's done.",
    agentStyle: "casual",
    imageSrc: "/personas/Astral.png",
    gradientSrc: "/personas/Astral.png",
  },
  {
    id: "corporate",
    personaName: "Taleb",
    name: "Corporate",
    tagline: "Polished with professional tone.",
    description:
      "The tone says it all. Complete sentences, courteous framing, and maximum clarity.",
    traits: [
      "Full sentences and professional tone",
      "Structured step-by-step guidance",
    ],
    bestFor: "SaaS, B2B, and regulated industries",
    userMessage: ARCHETYPE_COMPARE_QUESTION,
    agentMessage:
      "Thank you for reaching out. Please navigate to Settings, select Account, and click Reset Password. The change takes effect immediately.",
    agentStyle: "corporate",
    imageSrc: "/personas/Taleb.png",
    gradientSrc: "/personas/Taleb.png",
  },
  {
    id: "efficient",
    personaName: "Vidi",
    name: "Efficient",
    tagline: "Goes straight to the point.",
    description:
      "Avoids noise and goes straight to the point. Ideal when customers want answers rather than small talk.",
    traits: ["Direct answers", "Confident, decisive tone"],
    bestFor: "High-volume support and technical products",
    userMessage: ARCHETYPE_COMPARE_QUESTION,
    agentMessage:
      "Yes go to Settings → Account → Reset. If encountering issues, reach out to support@company.com",
    agentStyle: "efficient",
    imageSrc: "/personas/Vidi.png",
    gradientSrc: "/personas/Vidi.png",
  },
  {
    id: "custom",
    personaName: "Custom",
    name: "Zero preset",
    tagline: "Your brand, your rules.",
    description:
      "Define tone, vocabulary and your own brand voice from scratch.",
    traits: ["Configurable tone", "Custom openers and vocabulary"],
    bestFor: "Full control over your brand identity",
    userMessage: ARCHETYPE_COMPARE_QUESTION,
    agentMessage:
      "Happy to help. Head to Settings → Account → Reset Password — you'll be back in within a minute. Ping me if anything looks off.",
    agentStyle: "corporate",
    imageSrc: "/personas/Custom.png",
    gradientSrc: "/personas/Custom.png",
  },
];

/** Built-in presets (excludes Custom / zero preset). */
export const PRESET_ARCHETYPES = ARCHETYPES.filter(
  (archetype) => archetype.id !== "custom",
);

export function formatArchetypeTone(archetype: ArchetypeDefinition): string {
  if (archetype.id === "custom") {
    return archetype.name;
  }

  return archetype.personaName ? `${archetype.name} tone` : archetype.name;
}

export function getArchetype(id: PersonalityTone): ArchetypeDefinition {
  const archetype = ARCHETYPES.find((item) => item.id === id);
  if (!archetype) {
    return ARCHETYPES[0]!;
  }
  return archetype;
}
