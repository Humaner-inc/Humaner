import { hasBasePath } from 'next/dist/client/has-base-path';
import { removeBasePath } from 'next/dist/client/remove-base-path';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';

export function getPathname(): string | null {
  const store = workUnitAsyncStorage.getStore();
  if (!store || store.type !== 'request') {
    return null;
  }

  const pathname = store.url.pathname;
  if (hasBasePath(pathname)) {
    return removeBasePath(pathname);
  }

  return pathname;
}

export function getSearchParam(name: string): string | null {
  const store = workUnitAsyncStorage.getStore();
  if (!store || store.type !== 'request') {
    return null;
  }

  const url = store.url;
  if (url instanceof URL) {
    return url.searchParams.get(name);
  }
  if (typeof url === 'object' && url && 'searchParams' in url) {
    const params = (url as { searchParams?: URLSearchParams }).searchParams;
    return params?.get(name) ?? null;
  }
  if (typeof url === 'object' && url && 'search' in url) {
    const search = String((url as { search?: string }).search ?? '');
    return new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search
    ).get(name);
  }
  return null;
}
