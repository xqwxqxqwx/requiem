/* Мини-хранилище состояния с подпиской — для useSyncExternalStore. */
import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get(): T;
  set(patch: Partial<T> | ((s: T) => Partial<T>)): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set(patch) {
      const p = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...p };
      subs.forEach((fn) => fn());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function useStore<T extends object>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}

/* ── настройки (на устройстве, в localStorage) ── */
export interface Settings {
  /** обесцвечивать обложки в интерфейсе и на экране блокировки */
  monoCovers: boolean;
  /** сортировка списка треков */
  sort: 'added' | 'title' | 'artist';
}

const SETTINGS_KEY = 'requiem:settings';

function loadSettings(): Settings {
  const def: Settings = { monoCovers: false, sort: 'added' };
  try {
    return { ...def, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return def;
  }
}

export const settings = createStore<Settings>(loadSettings());
settings.subscribe(() => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.get()));
  } catch {
    /* приватный режим — настройки просто не запомнятся */
  }
});
