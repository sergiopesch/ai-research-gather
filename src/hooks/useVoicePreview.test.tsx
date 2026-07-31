import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useVoicePreview } from './useVoicePreview';
import type { ScriptSpeakerConfig } from '@shared/research';

const speaker: ScriptSpeakerConfig = {
  id: 'speaker_1',
  name: 'Dr. Rowan',
  model: 'openai:gpt-test',
  voice: {
    providerId: 'openai',
    modelId: 'gpt-4o-mini-tts',
    voiceId: 'coral',
    speed: 1.05,
    instructions: 'Speak warmly and conversationally.',
  },
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useVoicePreview', () => {
  it('generates and plays an explicit preview with the selected voice settings', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(['audio']), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } }));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:voice-preview') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);

    const { result } = renderHook(() => useVoicePreview());
    await act(async () => result.current.preview(speaker));

    expect(result.current.status).toBe('playing');
    expect(play).toHaveBeenCalledOnce();
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toBe('/api/generate-speech');
    const requestInit = request[1] as RequestInit;
    expect(JSON.parse(String(requestInit.body))).toMatchObject({
      providerId: 'openai',
      modelId: 'gpt-4o-mini-tts',
      voiceId: 'coral',
      speed: 1.05,
      instructions: 'Speak warmly and conversationally.',
    });

    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(pause).toHaveBeenCalled();
  });
});
