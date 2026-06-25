import { hasBasePath } from 'next/dist/client/has-base-path';
import { removeBasePath } from 'next/dist/client/remove-base-path';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';

export function getPathname(): string | null {
  const store = workUnitAsyncStorage.getStore();
  if (!store || store.type !== 'request') {
    return null;
  }

  const url = new URL(store.url.pathname + store.url.search, 'http://n');
  if (hasBasePath(url.pathname)) {
    return removeBasePath(url.pathname) + url.search;
  }

  return url.pathname + url.search;
}
