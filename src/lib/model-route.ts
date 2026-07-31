export function splitModelRoute(route: string): { providerId: string; modelId: string } {
  const separator = route.indexOf(':');
  return separator > 0
    ? { providerId: route.slice(0, separator), modelId: route.slice(separator + 1) }
    : { providerId: '', modelId: '' };
}
