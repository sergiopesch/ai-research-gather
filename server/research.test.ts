import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchPapers } from './research.js';

const feed = `
  <rss><channel>
    <item>
      <title>Embodied AI systems that learn safe interaction</title>
      <link>https://arxiv.org/abs/2607.10001</link>
      <description>Abstract: We study embodied agents and safety in interactive environments.</description>
      <pubDate>Wed, 29 Jul 2026 12:00:00 GMT</pubDate>
      <dc:creator>A. Researcher, B. Scientist</dc:creator>
    </item>
    <item>
      <title>Computer Vision for Robotics</title>
      <link>https://arxiv.org/abs/2607.10002</link>
      <description>Abstract: A general cross-disciplinary systems survey.</description>
      <pubDate>Wed, 29 Jul 2026 11:00:00 GMT</pubDate>
      <dc:creator>C. Researcher</dc:creator>
    </item>
  </channel></rss>
`;

describe('research topic search', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('filters by the typed topic without treating other selected area names as topic matches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => feed,
    }));

    const papers = await searchPapers([
      'Robotics',
      'Computer Vision',
      'Large Language Models',
      'embodied AI safety',
    ], '2026-07-15', 6);

    expect(papers).toHaveLength(1);
    expect(papers[0].title).toBe('Embodied AI systems that learn safe interaction');
  });
});
