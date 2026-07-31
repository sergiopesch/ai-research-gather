import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { assertScriptModelRoute, getModelCatalog } from './model-catalog.js';

const scriptEnvironmentKeys = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'XAI_API_KEY',
  'AI_GATEWAY_API_KEY',
  'VERCEL_OIDC_TOKEN',
  'AI_DEMO_MODE',
  'VERCEL',
  'VERCEL_ENV',
  'ELEVENLABS_API_KEY',
  'DEEPGRAM_API_KEY',
  'LMNT_API_KEY',
  'LOCAL_SUBSCRIPTIONS_ENABLED',
] as const;
const originalEnvironment = Object.fromEntries(scriptEnvironmentKeys.map((key) => [key, process.env[key]]));

beforeEach(() => {
  scriptEnvironmentKeys.forEach((key) => delete process.env[key]);
  process.env.AI_DEMO_MODE = 'true';
  process.env.LOCAL_SUBSCRIPTIONS_ENABLED = 'false';
});

afterEach(() => {
  scriptEnvironmentKeys.forEach((key) => {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
});

describe('model catalog', () => {
  it('keeps every provider visible and provides a zero-key demo route', () => {
    const zeroKeyCatalog = getModelCatalog();
    expect(zeroKeyCatalog.scriptProviders.find((provider) => provider.id === 'demo')?.configured).toBe(true);
    expect(zeroKeyCatalog.mode).toBe('demo');
    expect(zeroKeyCatalog.scriptProviders.find((provider) => provider.id === 'inclusionai')).toMatchObject({
      configured: false,
      availability: 'free',
      configurationKey: 'AI_GATEWAY_API_KEY',
    });
    expect(zeroKeyCatalog.scriptProviders.find((provider) => provider.id === 'openai')).toMatchObject({
      configured: false,
      configurationKey: 'OPENAI_API_KEY',
    });

    process.env.OPENAI_API_KEY = 'test-key';
    const configuredCatalog = getModelCatalog();
    expect(configuredCatalog.access.maxConversationTurns).toBe(20);
    expect(configuredCatalog.scriptProviders.some((provider) => provider.id === 'demo')).toBe(false);
    expect(configuredCatalog.scriptProviders.find((provider) => provider.id === 'openai')?.configured).toBe(true);
  });

  it('rejects models outside the allowlisted configured routes', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    expect(() => assertScriptModelRoute('openai:gpt-5.6-sol')).not.toThrow();
    expect(() => assertScriptModelRoute('openai:made-up-model')).toThrow(/not configured/i);
  });

  it('exposes only verified zero-cost models through the hosted Gateway', () => {
    process.env.AI_GATEWAY_API_KEY = 'project-scoped-test-key';
    const catalog = getModelCatalog();

    expect(catalog.mode).toBe('hosted-free');
    expect(catalog.scriptProviders.some((provider) => provider.id === 'demo')).toBe(false);
    expect(catalog.scriptProviders.filter((provider) => provider.configured).map((provider) => provider.id)).toEqual([
      'inclusionai',
      'poolside',
    ]);
    expect(catalog.scriptProviders.find((provider) => provider.id === 'openai')).toMatchObject({
      configured: false,
      configurationKey: 'OPENAI_API_KEY',
    });
    expect(catalog.speechProviders.find((provider) => provider.id === 'openai')).toMatchObject({
      configured: false,
      configurationKey: 'OPENAI_API_KEY',
    });
    expect(() => assertScriptModelRoute('inclusionai:ling-3.0-flash-free')).not.toThrow();
    expect(() => assertScriptModelRoute('openai:gpt-5.6-sol')).toThrow(/not configured/i);
  });

  it('unlocks direct script and voice routes only with the user provider key', () => {
    process.env.OPENAI_API_KEY = 'provider-key';
    const catalog = getModelCatalog();

    expect(catalog.mode).toBe('self-hosted');
    expect(catalog.scriptProviders.find((provider) => provider.id === 'openai')?.configured).toBe(true);
    expect(catalog.speechProviders.find((provider) => provider.id === 'openai')).toMatchObject({
      configured: true,
      configurationKey: undefined,
    });
    expect(catalog.speechProviders.find((provider) => provider.id === 'openai')?.models.map((model) => model.id)).toEqual(['gpt-4o-mini-tts']);
  });

  it('keeps free Gateway and direct-key routes separate when both credentials exist', () => {
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.OPENAI_API_KEY = 'provider-key';

    const catalog = getModelCatalog();
    expect(catalog.scriptProviders.find((provider) => provider.id === 'inclusionai')?.configured).toBe(true);
    expect(catalog.scriptProviders.find((provider) => provider.id === 'openai')?.configured).toBe(true);
    expect(catalog.speechProviders.find((provider) => provider.id === 'openai')?.models.map((model) => model.id)).toEqual(['gpt-4o-mini-tts']);
  });

  it('never exposes direct paid routes from a hosted deployment', () => {
    process.env.VERCEL = '1';
    process.env.AI_GATEWAY_API_KEY = 'gateway-key';
    process.env.OPENAI_API_KEY = 'provider-key';

    const catalog = getModelCatalog();
    expect(catalog.scriptProviders.filter((provider) => provider.configured).map((provider) => provider.id)).toEqual([
      'inclusionai',
      'poolside',
    ]);
    expect(catalog.speechProviders.some((provider) => provider.configured)).toBe(false);
    expect(catalog.access.maxConversationTurns).toBe(8);
  });
});
