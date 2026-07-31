import type { ModelCatalog, ProviderOption, SpeechModelOption } from "../shared/research.js";
import { DEFAULT_CONVERSATION_TURNS, MAX_CONVERSATION_TURNS } from "../shared/conversation.js";
import { ownerAuthConfigured } from "./auth.js";
import { subscriptionAvailability } from "./subscription-adapters.js";

const configured = (key: string): boolean => Boolean(process.env[key]?.trim());
const gatewayConfigured = (): boolean => configured("AI_GATEWAY_API_KEY") || configured("VERCEL_OIDC_TOKEN");
const hostedDeployment = (): boolean => process.env.VERCEL === "1" || ["production", "preview"].includes(process.env.VERCEL_ENV || "");
const REPOSITORY_URL = "https://github.com/sergiopesch/ai-research-gather";

// Zero-cost language models reported by the AI Gateway catalogue and confirmed
// healthy on 2026-07-29. Keep this list deliberately narrow: the public deployment
// must never advertise a paid or currently unhealthy model merely because Gateway
// authentication is present.
const gatewayFreeScriptProviders: Array<Omit<ProviderOption, "configured" | "configurationKey">> = [
  {
    id: "inclusionai",
    label: "InclusionAI",
    availability: "free",
    models: [
      { id: "ling-3.0-flash-free", label: "Ling 3.0 Flash", description: "Free · Fast and capable" },
    ],
  },
  {
    id: "poolside",
    label: "Poolside",
    availability: "free",
    models: [
      { id: "laguna-s-2.1-free", label: "Laguna S 2.1", description: "Free · Strong reasoning" },
    ],
  },
];

const scriptProviders: Array<Omit<ProviderOption, "configured" | "configurationKey"> & { envKey: string }> = [
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    availability: "local-key",
    models: [
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", description: "Highest quality" },
      { id: "gpt-5.5", label: "GPT-5.5", description: "Balanced" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini", description: "Fast" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    availability: "local-key",
    models: [
      { id: "claude-sonnet-5", label: "Claude Sonnet 5", description: "Balanced" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8", description: "Highest quality" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Fast" },
    ],
  },
  {
    id: "google",
    label: "Google",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    availability: "local-key",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", description: "Balanced" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", description: "Highest quality" },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", description: "Fast" },
    ],
  },
  {
    id: "xai",
    label: "xAI",
    envKey: "XAI_API_KEY",
    availability: "local-key",
    models: [
      { id: "grok-4.5", label: "Grok 4.5", description: "Balanced" },
      { id: "grok-4.20-reasoning", label: "Grok 4.20 Reasoning", description: "Deep reasoning" },
      { id: "grok-4.20-non-reasoning", label: "Grok 4.20", description: "Fast" },
    ],
  },
];

const elevenVoiceA = process.env.ELEVENLABS_VOICE_A_ID || "9BWtsMINqrJLrRacOk9x";
const elevenVoiceB = process.env.ELEVENLABS_VOICE_B_ID || "TX3LPaxmHKxFdv7VOQHJ";
const lmntVoiceA = process.env.LMNT_VOICE_A_ID || "lily";
const lmntVoiceB = process.env.LMNT_VOICE_B_ID || "daniel";

const speechProviders: Array<Omit<ProviderOption<SpeechModelOption>, "configured" | "configurationKey"> & { envKey: string }> = [
  {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    availability: "local-key",
    models: [
      {
        id: "gpt-4o-mini-tts",
        label: "GPT-4o mini TTS",
        voices: [
          { id: "coral", label: "Coral" },
          { id: "cedar", label: "Cedar" },
          { id: "marin", label: "Marin" },
          { id: "alloy", label: "Alloy" },
        ],
      },
    ],
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    envKey: "ELEVENLABS_API_KEY",
    availability: "local-key",
    models: [
      {
        id: "eleven_multilingual_v2",
        label: "Eleven Multilingual v2",
        voices: [
          { id: elevenVoiceA, label: "Studio A" },
          { id: elevenVoiceB, label: "Studio B" },
        ],
      },
      {
        id: "eleven_flash_v2_5",
        label: "Eleven Flash v2.5",
        voices: [
          { id: elevenVoiceA, label: "Studio A" },
          { id: elevenVoiceB, label: "Studio B" },
        ],
      },
    ],
  },
  {
    id: "deepgram",
    label: "Deepgram",
    envKey: "DEEPGRAM_API_KEY",
    availability: "local-key",
    models: [
      { id: "aura-2-thalia-en", label: "Aura 2 Thalia", voices: [{ id: "", label: "Thalia" }] },
      { id: "aura-2-orpheus-en", label: "Aura 2 Orpheus", voices: [{ id: "", label: "Orpheus" }] },
      { id: "aura-2-zeus-en", label: "Aura 2 Zeus", voices: [{ id: "", label: "Zeus" }] },
    ],
  },
  {
    id: "lmnt",
    label: "LMNT",
    envKey: "LMNT_API_KEY",
    availability: "local-key",
    models: [
      {
        id: "aurora",
        label: "Aurora",
        voices: [
          { id: lmntVoiceA, label: "Lily" },
          { id: lmntVoiceB, label: "Daniel" },
        ],
      },
      {
        id: "blizzard",
        label: "Blizzard",
        voices: [
          { id: lmntVoiceA, label: "Lily" },
          { id: lmntVoiceB, label: "Daniel" },
        ],
      },
    ],
  },
];

type CatalogContext = { ownerAuthenticated?: boolean; localRequest?: boolean };

export function getModelCatalog(context: CatalogContext = {}): ModelCatalog {
  const hasGateway = gatewayConfigured();
  const isLocal = context.localRequest ?? !hostedDeployment();
  const allowDirectProviderKeys = isLocal || Boolean(context.ownerAuthenticated);
  const hasDirectScriptProvider = allowDirectProviderKeys && scriptProviders.some((provider) => configured(provider.envKey));
  const localSubscriptions = isLocal ? subscriptionAvailability() : { codex: false, grok: false };
  const hasLocalSubscription = localSubscriptions.codex || localSubscriptions.grok;
  const hasConfiguredScriptProvider = hasGateway || hasDirectScriptProvider || hasLocalSubscription;
  const demoEnabled = process.env.AI_DEMO_MODE !== "false" && !hasConfiguredScriptProvider;
  const authenticated = Boolean(context.ownerAuthenticated);
  const publicDailyScriptLimit = Math.max(0, Math.min(20, Number(process.env.PUBLIC_SCRIPT_LIMIT_PER_DAY || 1) || 1));

  return {
    mode: authenticated && hostedDeployment()
      ? "owner-cloud"
      : hasLocalSubscription
        ? "local-subscription"
        : hasGateway
          ? "hosted-free"
          : hasDirectScriptProvider ? "self-hosted" : "demo",
    repositoryUrl: REPOSITORY_URL,
    access: {
      authenticated,
      ownerAuthConfigured: ownerAuthConfigured(),
      publicAiEnabled: process.env.PUBLIC_AI_ENABLED !== "false",
      publicDailyScriptLimit,
      maxConversationTurns: allowDirectProviderKeys ? MAX_CONVERSATION_TURNS : DEFAULT_CONVERSATION_TURNS,
    },
    scriptProviders: [
      ...(demoEnabled ? [{
        id: "demo",
        label: "Demo",
        configured: true,
        availability: "demo" as const,
        models: [{ id: "notebook-demo", label: "Notebook Demo", description: "No key required" }],
      }] : []),
      ...gatewayFreeScriptProviders.map((provider) => ({
        ...provider,
        configured: hasGateway,
        configurationKey: hasGateway ? undefined : "AI_GATEWAY_API_KEY",
      })),
      ...(isLocal ? [
        {
          id: "chatgpt",
          label: "ChatGPT",
          configured: localSubscriptions.codex,
          availability: "subscription" as const,
          setupHint: localSubscriptions.codex ? undefined : "Install Codex and run codex login. Your session stays on this machine.",
          models: [{ id: "codex", label: "ChatGPT plan", description: "Uses your local Codex login" }],
        },
        {
          id: "grok",
          label: "Grok",
          configured: localSubscriptions.grok,
          availability: "subscription" as const,
          setupHint: localSubscriptions.grok ? undefined : "Install Grok Build and run grok login. Your session stays on this machine.",
          models: [{ id: "grok-build", label: "Grok plan", description: "Uses your local Grok Build login" }],
        },
      ] : []),
      ...scriptProviders.map(({ envKey, ...provider }) => ({
        ...provider,
        configured: allowDirectProviderKeys && configured(envKey),
        configurationKey: allowDirectProviderKeys && configured(envKey) ? undefined : envKey,
      })),
    ],
    // Gateway speech models are paid. The hosted free experience therefore keeps
    // voice off; users can unlock a voice provider with their own local key.
    speechProviders: speechProviders.map(({ envKey, ...provider }) => ({
      ...provider,
      configured: allowDirectProviderKeys && configured(envKey),
      configurationKey: allowDirectProviderKeys && configured(envKey) ? undefined : envKey,
    })),
  };
}

export function hasGatewayCredentials(): boolean {
  return gatewayConfigured();
}

export function toGatewayModelId(route: string): string {
  const { providerId, modelId } = parseModelRoute(route);
  return `${providerId}/${modelId}`;
}

export function isGatewayFreeScriptRoute(route: string): boolean {
  const { providerId, modelId } = parseModelRoute(route);
  return gatewayConfigured() && gatewayFreeScriptProviders.some(
    (provider) => provider.id === providerId && provider.models.some((model) => model.id === modelId),
  );
}

export function parseModelRoute(route: string): { providerId: string; modelId: string } {
  const separator = route.indexOf(":");
  if (separator < 1 || separator === route.length - 1) {
    throw new Error("Choose a valid model route.");
  }

  return { providerId: route.slice(0, separator), modelId: route.slice(separator + 1) };
}

export function isSubscriptionScriptRoute(route: string): boolean {
  const { providerId } = parseModelRoute(route);
  return providerId === "chatgpt" || providerId === "grok";
}

export function assertScriptModelRoute(route: string, context: CatalogContext = {}): void {
  const { providerId, modelId } = parseModelRoute(route);
  const provider = getModelCatalog(context).scriptProviders.find((item) => item.id === providerId);
  if (!provider?.configured || !provider.models.some((model) => model.id === modelId)) {
    throw new Error("That script model is not configured on this server.");
  }
}

export function assertSpeechRoute(providerId: string, modelId: string, voiceId?: string, context: CatalogContext = {}): void {
  const provider = getModelCatalog(context).speechProviders.find((item) => item.id === providerId);
  const model = provider?.models.find((item) => item.id === modelId);
  if (!provider?.configured || !model) {
    throw new Error("That voice model is not configured on this server.");
  }
  if (voiceId && !model.voices.some((voice) => voice.id === voiceId)) {
    throw new Error("That voice is not available for the selected model.");
  }
}
