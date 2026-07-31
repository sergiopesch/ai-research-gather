import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConversationSettingsPanel } from './ConversationSettingsPanel';

describe('ConversationSettingsPanel', () => {
  it('selects the twenty-turn deep dive in a private or local studio', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConversationSettingsPanel settings={{ turnCount: 8 }} maxTurns={20} hasVoice={false} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /20 turns.*deep dive/i }));
    expect(onChange).toHaveBeenCalledWith({ turnCount: 20 });
    expect(screen.getByText(/longer conversations take more generation time/i)).toBeInTheDocument();
  });

  it('keeps longer presets visibly locked in the public studio', () => {
    render(<ConversationSettingsPanel settings={{ turnCount: 8 }} maxTurns={8} hasVoice={false} onChange={() => undefined} />);

    expect(screen.getByRole('radio', { name: /8 turns.*quick/i })).toBeEnabled();
    expect(screen.getByRole('radio', { name: /12 turns.*balanced/i })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /20 turns.*deep dive/i })).toBeDisabled();
    expect(screen.getByText(/public studio is capped at 8 turns/i)).toBeInTheDocument();
  });

  it('explains the number of voice clips that will be generated', () => {
    render(<ConversationSettingsPanel settings={{ turnCount: 20 }} maxTurns={20} hasVoice onChange={() => undefined} />);
    expect(screen.getByText('20 voice clips will be generated after their script turns arrive.')).toBeInTheDocument();
  });
});
