import { useEffect, useState } from 'react';
import type { ModelCatalog } from '@shared/research';

const EMPTY_CATALOG: ModelCatalog = {
  mode: 'demo',
  repositoryUrl: 'https://github.com/sergiopesch/ai-research-gather',
  access: { authenticated: false, ownerAuthConfigured: false, publicAiEnabled: true, publicDailyScriptLimit: 1, maxConversationTurns: 8 },
  scriptProviders: [],
  speechProviders: [],
};

export function useModelCatalog() {
  const [catalog, setCatalog] = useState<ModelCatalog>(EMPTY_CATALOG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/models', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not load models (${response.status})`);
        return response.json() as Promise<ModelCatalog>;
      })
      .then((data) => {
        setCatalog(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause.message : 'Could not load models');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [refreshVersion]);

  return { catalog, isLoading, error, refresh: () => setRefreshVersion((version) => version + 1) };
}
