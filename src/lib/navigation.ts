import { useCallback, useSyncExternalStore } from 'react';

const subscribe = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};

const getPathname = () => window.location.pathname;

export function navigate(to: string, options?: { replace?: boolean }): void {
  if (options?.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getPathname, () => '/');
}

export function useNavigate() {
  return useCallback((to: string, options?: { replace?: boolean }) => navigate(to, options), []);
}
