export interface PresentationTheme {
  id: string;
  name: string;
  category?: "minimal" | "vibrant" | "dark" | "editorial";
  bg: string;
  cardBg: string;
  text: string;
  textMuted: string;
  primary: string;
  accent: string;
  border: string;
  fontFamily: "sans" | "serif" | "mono" | "display";
}

export const PRESET_THEMES: PresentationTheme[] = [
  {
    id: "light",
    name: "Minimal Light",
    category: "minimal",
    bg: "#FFFFFF",
    cardBg: "#F8FAFC",
    text: "#0F172A",
    textMuted: "#64748B",
    primary: "#2563EB",
    accent: "#38BDF8",
    border: "#E2E8F0",
    fontFamily: "sans",
  },
  {
    id: "dark",
    name: "Minimal Obsidian",
    category: "dark",
    bg: "#09090B",
    cardBg: "#18181B",
    text: "#FAFAFA",
    textMuted: "#A1A1AA",
    primary: "#6366F1",
    accent: "#818CF8",
    border: "#27272A",
    fontFamily: "sans",
  },
  {
    id: "sentio",
    name: "Sentio Indigo",
    category: "minimal",
    bg: "#0B0F19",
    cardBg: "#111827",
    text: "#F8FAFC",
    textMuted: "#94A3B8",
    primary: "#3B82F6",
    accent: "#60A5FA",
    border: "#1F2937",
    fontFamily: "sans",
  },
  {
    id: "nordic",
    name: "Nordic Slate",
    category: "minimal",
    bg: "#0F172A",
    cardBg: "#1E293B",
    text: "#F1F5F9",
    textMuted: "#94A3B8",
    primary: "#38BDF8",
    accent: "#7DD3FC",
    border: "#334155",
    fontFamily: "sans",
  },
  {
    id: "emerald",
    name: "Emerald Noir",
    category: "dark",
    bg: "#061412",
    cardBg: "#0B2420",
    text: "#ECFDF5",
    textMuted: "#6EE7B7",
    primary: "#10B981",
    accent: "#34D399",
    border: "#134E48",
    fontFamily: "sans",
  },
  {
    id: "warm",
    name: "Warm Editorial",
    category: "editorial",
    bg: "#FAF8F5",
    cardBg: "#F2EDE4",
    text: "#1C1917",
    textMuted: "#78716C",
    primary: "#D97706",
    accent: "#F59E0B",
    border: "#E7E0D3",
    fontFamily: "serif",
  },
  {
    id: "violet",
    name: "Cyber Violet",
    category: "vibrant",
    bg: "#0F0728",
    cardBg: "#1D0E4A",
    text: "#FAF5FF",
    textMuted: "#C084FC",
    primary: "#A855F7",
    accent: "#E879F9",
    border: "#3B1875",
    fontFamily: "display",
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    category: "vibrant",
    bg: "#180D15",
    cardBg: "#2A1220",
    text: "#FFF1F2",
    textMuted: "#FDA4AF",
    primary: "#F43F5E",
    accent: "#FB7185",
    border: "#4C1D36",
    fontFamily: "sans",
  },
];

export const DEFAULT_THEME = PRESET_THEMES[0];

export function resolveTheme(themeInput?: any): PresentationTheme {
  if (!themeInput) return DEFAULT_THEME;
  if (typeof themeInput === "string") {
    return PRESET_THEMES.find((t) => t.id === themeInput) || DEFAULT_THEME;
  }
  const preset = PRESET_THEMES.find((t) => t.id === themeInput.id);
  return {
    id: themeInput.id || preset?.id || "custom",
    name: themeInput.name || preset?.name || "Custom Theme",
    category: themeInput.category || preset?.category || "minimal",
    bg: themeInput.bg || preset?.bg || DEFAULT_THEME.bg,
    cardBg: themeInput.cardBg || preset?.cardBg || DEFAULT_THEME.cardBg,
    text: themeInput.text || preset?.text || DEFAULT_THEME.text,
    textMuted:
      themeInput.textMuted || preset?.textMuted || DEFAULT_THEME.textMuted,
    primary: themeInput.primary || preset?.primary || DEFAULT_THEME.primary,
    accent: themeInput.accent || preset?.accent || DEFAULT_THEME.accent,
    border: themeInput.border || preset?.border || DEFAULT_THEME.border,
    fontFamily:
      themeInput.fontFamily || preset?.fontFamily || DEFAULT_THEME.fontFamily,
  };
}
