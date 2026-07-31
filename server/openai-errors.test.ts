import { describe, expect, it } from 'vitest';
import { publicGenerationError } from './openai.js';

describe('public generation errors', () => {
  it('replaces Gateway billing and free-tier URLs with useful local guidance', () => {
    const message = publicGenerationError(new Error(
      'Free tier users do not have access to this model. Upgrade to paid credits at https://vercel.com/example.',
    ));

    expect(message).toBe(
      'That hosted model is not currently available. Choose another free model, or run the repository locally with your own provider key.',
    );
    expect(message).not.toMatch(/https?:\/\//);
    expect(message).not.toMatch(/paid credits/i);
  });
});
