import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EpisodeExportPanel } from './EpisodeExportPanel';
import type { PodcastScript } from '@shared/research';

const script: PodcastScript = {
  id: 'paper-1',
  title: 'A research conversation',
  settings: { turnCount: 2 },
  speakers: [
    { id: 'speaker_1', name: 'Dr. Rowan', model: 'openai:gpt-test', voice: { providerId: 'openai', modelId: 'tts-test', speed: 1 } },
    { id: 'speaker_2', name: 'Alex', model: 'openai:gpt-test', voice: { providerId: 'openai', modelId: 'tts-test', speed: 1 } },
  ],
  segments: [
    { speaker: 'Dr. Rowan', speakerId: 'speaker_1', speakerModel: 'openai:gpt-test', text: 'Opening.' },
    { speaker: 'Alex', speakerId: 'speaker_2', speakerModel: 'openai:gpt-test', text: 'Response.' },
  ],
  totalDuration: '0:10',
  createdAt: '2026-07-31T12:00:00.000Z',
};

const callbacks = () => ({
  onDownloadEpisode: vi.fn(),
  onDownloadTranscript: vi.fn(),
  onDownloadProduction: vi.fn(),
});

describe('EpisodeExportPanel', () => {
  it('makes the complete episode package the obvious action when audio is ready', () => {
    const actions = callbacks();
    render(
      <EpisodeExportPanel
        script={script}
        audioBySegment={{
          0: { status: 'ready', blob: new Blob(['first'], { type: 'audio/mpeg' }) },
          1: { status: 'ready', blob: new Blob(['second'], { type: 'audio/mpeg' }) },
        }}
        isExporting={false}
        {...actions}
      />,
    );

    expect(screen.getByText('2 turns · 2 of 2 voice clips')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Download episode' }));
    expect(actions.onDownloadEpisode).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Download transcript' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download production file' })).toBeInTheDocument();
  });

  it('defaults to the transcript when no voice route was configured', () => {
    const actions = callbacks();
    render(
      <EpisodeExportPanel
        script={{ ...script, speakers: script.speakers.map(({ voice: _voice, ...speaker }) => speaker) }}
        audioBySegment={{}}
        isExporting={false}
        {...actions}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download transcript' }));
    expect(actions.onDownloadTranscript).toHaveBeenCalledOnce();
    expect(screen.getByText('2 turns · Transcript and production settings')).toBeInTheDocument();
  });
});
