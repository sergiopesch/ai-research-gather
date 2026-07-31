import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { createEpisodeArchive, episodeArchiveName, transcriptText } from './episode-export';
import type { PodcastScript } from '@shared/research';

const script: PodcastScript = {
  id: 'paper-1',
  title: 'The Notebook Pod: Useful Research',
  settings: { turnCount: 2 },
  speakers: [
    { id: 'speaker_1', name: 'Dr. Rowan', model: 'openai:gpt-test', voice: { providerId: 'openai', modelId: 'tts-test', voiceId: 'coral', speed: 1 } },
    { id: 'speaker_2', name: 'Alex', model: 'openai:gpt-test', voice: { providerId: 'openai', modelId: 'tts-test', voiceId: 'alloy', speed: 1 } },
  ],
  segments: [
    { speaker: 'Dr. Rowan', speakerId: 'speaker_1', speakerModel: 'openai:gpt-test', text: 'A grounded opening.' },
    { speaker: 'Alex', speakerId: 'speaker_2', speakerModel: 'openai:gpt-test', text: 'A useful response.' },
  ],
  totalDuration: '0:12',
  createdAt: '2026-07-31T12:00:00.000Z',
};

describe('episode export', () => {
  it('creates a readable transcript and a safe archive name', () => {
    expect(episodeArchiveName(script)).toBe('useful-research.zip');
    expect(transcriptText(script)).toContain('Dr. Rowan: A grounded opening.');
    expect(transcriptText(script)).toContain('Turns: 2');
  });

  it('packages the transcript, production settings, and ready voice clips', async () => {
    const archive = await createEpisodeArchive(script, {
      0: { status: 'ready', blob: new Blob(['first'], { type: 'audio/mpeg' }), mediaType: 'audio/mpeg' },
      1: { status: 'ready', blob: new Blob(['second'], { type: 'audio/wav' }), mediaType: 'audio/wav' },
    });
    const files = unzipSync(new Uint8Array(await archive.arrayBuffer()));

    expect(Object.keys(files).sort()).toEqual([
      'audio/01-dr-rowan.mp3',
      'audio/02-alex.wav',
      'production.json',
      'transcript.txt',
    ]);
    expect(strFromU8(files['transcript.txt'])).toContain('Alex: A useful response.');
    expect(JSON.parse(strFromU8(files['production.json']))).toMatchObject({ id: 'paper-1', settings: { turnCount: 2 } });
    expect(strFromU8(files['audio/01-dr-rowan.mp3'])).toBe('first');
  });
});
