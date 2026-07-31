import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ModelRouter } from './ModelRouter';
import type { ModelCatalog, ScriptSpeakerConfig } from '@shared/research';

const catalog: ModelCatalog = {
  mode: 'self-hosted',
  repositoryUrl: 'https://github.com/sergiopesch/ai-research-gather',
  access: {
    authenticated: false,
    ownerAuthConfigured: false,
    publicAiEnabled: false,
    publicDailyScriptLimit: 0,
    maxConversationTurns: 20,
  },
  scriptProviders: [
    { id: 'openai', label: 'OpenAI', configured: true, availability: 'local-key', configurationKey: 'OPENAI_API_KEY', models: [{ id: 'gpt-test', label: 'GPT Test' }] },
    { id: 'anthropic', label: 'Anthropic', configured: true, availability: 'local-key', configurationKey: 'ANTHROPIC_API_KEY', models: [{ id: 'claude-test', label: 'Claude Test' }] },
    { id: 'xai', label: 'xAI', configured: false, availability: 'local-key', configurationKey: 'XAI_API_KEY', models: [{ id: 'grok-test', label: 'Grok Test' }] },
  ],
  speechProviders: [
    { id: 'elevenlabs', label: 'ElevenLabs', configured: true, availability: 'local-key', configurationKey: 'ELEVENLABS_API_KEY', models: [{ id: 'eleven-test', label: 'Eleven Test', voices: [{ id: 'voice-a', label: 'Voice A' }] }] },
  ],
};

const initial: ScriptSpeakerConfig[] = [
  { id: 'speaker_1', name: 'Dr. Rowan', model: 'openai:gpt-test' },
  { id: 'speaker_2', name: 'Alex', model: 'openai:gpt-test' },
];

function Harness() {
  const [speakers, setSpeakers] = useState(initial);
  return <><ModelRouter catalog={catalog} speakers={speakers} onChange={setSpeakers} /><output data-testid="state">{JSON.stringify(speakers)}</output></>;
}

const currentDialog = () => screen.getByRole('dialog', { name: /cast setup|dr\. rowan|alex/i });

describe('ModelRouter', () => {
  it('guides Rowan from a script provider to an independent voice provider', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    let dialog = currentDialog();
    expect(within(dialog).getByRole('heading', { name: 'Dr. Rowan · Script' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Step 1 of 4')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Anthropic · Ready' }));
    expect(screen.getByTestId('state')).toHaveTextContent('anthropic:claude-test');

    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    expect(within(dialog).getByRole('heading', { name: 'Dr. Rowan · Voice' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'ElevenLabs · Ready' }));
    expect(screen.getByTestId('state')).toHaveTextContent('elevenlabs');
    expect(screen.getByTestId('state')).toHaveTextContent('voice-a');
    expect(within(dialog).getByRole('button', { name: 'Preview voice' })).toBeInTheDocument();
  });

  it('copies Rowan’s complete route to Alex without overwriting Alex’s name', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    let dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Anthropic · Ready' }));
    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'ElevenLabs · Ready' }));
    await user.click(within(dialog).getByRole('button', { name: /continue/i }));

    dialog = currentDialog();
    expect(within(dialog).getByRole('heading', { name: 'Alex · Script' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /use rowan’s complete setup/i }));

    dialog = currentDialog();
    expect(within(dialog).getByRole('heading', { name: 'Alex · Voice' })).toBeInTheDocument();
    expect(within(dialog).getByText(/rowan’s script and voice settings are now applied to alex/i)).toBeInTheDocument();

    const state = screen.getByTestId('state').textContent || '';
    expect(state).toContain('Dr. Rowan');
    expect(state).toContain('Alex');
    expect(state.match(/anthropic:claude-test/g)).toHaveLength(2);
    expect(state.match(/elevenlabs/g)).toHaveLength(2);
  });

  it('lets Alex use a different writing model for a side-by-side comparison', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    let dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Anthropic · Ready' }));

    const state = screen.getByTestId('state').textContent || '';
    expect(state.match(/openai:gpt-test/g)).toHaveLength(1);
    expect(state.match(/anthropic:claude-test/g)).toHaveLength(1);
  });

  it('explains how to unlock a provider without silently changing the route', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'xAI · Key needed' }));

    expect(within(dialog).getByText('Add XAI_API_KEY to .env.local, restart the studio, and xAI will unlock automatically.')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /local setup guide/i })).toHaveAttribute('href', catalog.repositoryUrl);
    expect(screen.getByTestId('state')).toHaveTextContent('openai:gpt-test');
  });

  it('makes the public free boundary clear for both script and voice', async () => {
    const user = userEvent.setup();
    const hostedCatalog: ModelCatalog = {
      ...catalog,
      mode: 'hosted-free',
      access: { ...catalog.access, publicAiEnabled: true, publicDailyScriptLimit: 3, maxConversationTurns: 8 },
      scriptProviders: [
        { id: 'inclusionai', label: 'InclusionAI', configured: true, availability: 'free', models: [{ id: 'ling-free', label: 'Ling Free' }] },
        { id: 'openai', label: 'OpenAI', configured: false, availability: 'local-key', configurationKey: 'OPENAI_API_KEY', models: [{ id: 'gpt-test', label: 'GPT Test' }] },
      ],
      speechProviders: [
        { id: 'openai', label: 'OpenAI', configured: false, availability: 'local-key', configurationKey: 'OPENAI_API_KEY', models: [{ id: 'tts-test', label: 'TTS Test', voices: [{ id: 'coral', label: 'Coral' }] }] },
      ],
    };
    const hostedSpeakers = initial.map((speaker) => ({ ...speaker, model: 'inclusionai:ling-free' }));
    render(<ModelRouter catalog={hostedCatalog} speakers={hostedSpeakers} onChange={() => undefined} />);

    expect(screen.getByText('Public studio')).toBeInTheDocument();
    let dialog = currentDialog();
    expect(within(dialog).getByRole('button', { name: 'InclusionAI · Free' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(dialog).getByRole('button', { name: 'OpenAI · Key needed' }));
    expect(within(dialog).getByText(/openai script is intentionally locked in the public studio/i)).toHaveTextContent('OPENAI_API_KEY');

    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'OpenAI · Key needed' }));
    expect(within(dialog).getByText(/openai voice is intentionally locked in the public studio/i)).toHaveTextContent('OPENAI_API_KEY');
  });

  it('lets each persona keep voice generation off', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    let dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: /continue/i }));
    dialog = currentDialog();
    await user.click(within(dialog).getByRole('button', { name: 'ElevenLabs · Ready' }));
    expect(screen.getByTestId('state')).toHaveTextContent('elevenlabs');

    const off = within(dialog).getByRole('button', { name: /no generated voice/i });
    await user.click(off);
    expect(screen.getByTestId('state')).not.toHaveTextContent('elevenlabs');
    expect(off).toHaveAttribute('aria-pressed', 'true');
  });

  it('closes to a compact summary and can reopen the setup', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(within(currentDialog()).getByRole('button', { name: /close cast setup/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cast setup' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /use your own models locally/i })).toHaveAttribute('href', catalog.repositoryUrl);

    await user.click(screen.getByRole('button', { name: /configure cast/i }));
    expect(within(currentDialog()).getByRole('heading', { name: 'Dr. Rowan · Script' })).toBeInTheDocument();
  });
});
