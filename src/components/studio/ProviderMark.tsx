import type { IconType } from 'react-icons';
import { Sparkles } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { SiAnthropic, SiDeepgram, SiElevenlabs } from 'react-icons/si';
import { RiZhipuAiFill } from 'react-icons/ri';
import { TbBrandOpenai } from 'react-icons/tb';

const ICONS: Record<string, { icon?: IconType; color?: string; wordmark?: string }> = {
  openai: { icon: TbBrandOpenai, color: '#10a37f' },
  chatgpt: { icon: TbBrandOpenai, color: '#10a37f' },
  anthropic: { icon: SiAnthropic, color: '#d97757' },
  google: { icon: FcGoogle },
  xai: { wordmark: 'xAI', color: '#050505' },
  grok: { wordmark: 'Grok', color: '#050505' },
  elevenlabs: { icon: SiElevenlabs, color: '#050505' },
  deepgram: { icon: SiDeepgram, color: '#0b8f65' },
  lmnt: { wordmark: 'LMNT', color: '#171717' },
  inclusionai: { wordmark: 'LING', color: '#6d4aff' },
  poolside: { wordmark: 'PS', color: '#2563eb' },
  zai: { icon: RiZhipuAiFill, color: '#111111' },
};

export function ProviderMark({ providerId, className = '' }: { providerId: string; className?: string }) {
  if (providerId === 'demo') {
    return <Sparkles aria-hidden="true" className={`shrink-0 ${className}`} color="#7d5066" />;
  }

  const definition = ICONS[providerId] || { wordmark: providerId.slice(0, 3).toUpperCase(), color: '#171717' };
  if (definition.icon) {
    const Icon = definition.icon;
    return <Icon aria-hidden="true" className={className} color={definition.color} />;
  }
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center whitespace-nowrap font-sans text-[10px] font-bold leading-none tracking-[-0.05em] ${className}`} style={{ color: definition.color }}>
      {definition.wordmark}
    </span>
  );
}
