import type { AudioState } from '@/hooks/useScriptGeneration';
import type { PodcastScript } from '@shared/research';

const MIME_EXTENSIONS: Record<string, string> = {
  'audio/aac': 'aac',
  'audio/flac': 'flac',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
};

function safeName(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return normalized || fallback;
}

function audioExtension(audio: AudioState): string {
  const mediaType = audio.mediaType?.split(';')[0].toLowerCase() || audio.blob?.type.split(';')[0].toLowerCase();
  return (mediaType && MIME_EXTENSIONS[mediaType]) || 'mp3';
}

export function transcriptText(script: PodcastScript): string {
  const transcript = script.segments.map((segment) => `${segment.speaker}: ${segment.text}`).join('\n\n');
  return `# ${script.title}\n\nTurns: ${script.segments.length}\nDuration: ${script.totalDuration}\nCreated: ${script.createdAt}\n\n${transcript}\n`;
}

export function productionJson(script: PodcastScript): string {
  return `${JSON.stringify(script, null, 2)}\n`;
}

export function episodeArchiveName(script: PodcastScript): string {
  return `${safeName(script.title.replace(/^The Notebook Pod:\s*/i, ''), 'research-conversation')}.zip`;
}

export async function createEpisodeArchive(
  script: PodcastScript,
  audioBySegment: Record<number, AudioState>,
): Promise<Blob> {
  const [{ strToU8, zipSync }, audioFiles] = await Promise.all([
    import('fflate'),
    Promise.all(script.segments.map(async (segment, index) => {
      const audio = audioBySegment[index];
      if (audio?.status !== 'ready' || !audio.blob) return null;
      const turn = String(index + 1).padStart(2, '0');
      const speaker = safeName(segment.speaker, 'speaker');
      return {
        path: `audio/${turn}-${speaker}.${audioExtension(audio)}`,
        bytes: new Uint8Array(await audio.blob.arrayBuffer()),
      };
    })),
  ]);

  const files: Record<string, Uint8Array> = {
    'transcript.txt': strToU8(transcriptText(script)),
    'production.json': strToU8(productionJson(script)),
  };
  audioFiles.forEach((audio) => {
    if (audio) files[audio.path] = audio.bytes;
  });

  const archive = zipSync(files, { level: 6 });
  const bytes = archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer;
  return new Blob([bytes], { type: 'application/zip' });
}
