import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Track } from './db/db';
import { coverUrl } from './art/cover';
import { settings, useStore } from './store';

/** Вся библиотека, в выбранной сортировке. undefined — ещё грузится. */
export function useTracks(): Track[] | undefined {
  const { sort } = useStore(settings);
  return useLiveQuery(async () => {
    const all = await db.tracks.toArray();
    const by = (a: string, b: string) => a.localeCompare(b, 'ru', { sensitivity: 'base' });
    if (sort === 'title') all.sort((a, b) => by(a.title, b.title));
    else if (sort === 'artist') all.sort((a, b) => by(a.artist, b.artist) || by(a.album, b.album) || a.trackNo - b.trackNo);
    else all.sort((a, b) => b.addedAt - a.addedAt);
    return all;
  }, [sort]);
}

export function useCover(t: Track | null | undefined): string {
  const [url, setUrl] = useState('');
  const key = t ? `${t.id}|${t.hasCover}|${t.title}|${t.artist}` : '';
  useEffect(() => {
    if (!t) return setUrl('');
    let alive = true;
    coverUrl(t).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps -- трек сравниваем по ключу, а не по ссылке
  return url;
}

export interface Album {
  key: string;
  title: string;
  artist: string;
  year: number;
  tracks: Track[];
  /** трек, чья обложка представляет альбом */
  face: Track;
}

export function groupAlbums(tracks: Track[]): Album[] {
  const map = new Map<string, Album>();
  for (const t of tracks) {
    if (!t.album) continue;
    const key = t.album.toLowerCase() + '|' + (t.artist || '').toLowerCase();
    let a = map.get(key);
    if (!a) {
      a = { key, title: t.album, artist: t.artist, year: t.year, tracks: [], face: t };
      map.set(key, a);
    }
    a.tracks.push(t);
    if (!a.face.hasCover && t.hasCover) a.face = t;
    if (!a.year && t.year) a.year = t.year;
  }
  const list = [...map.values()];
  for (const a of list) a.tracks.sort((x, y) => x.trackNo - y.trackNo || x.title.localeCompare(y.title));
  return list.sort((a, b) => a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' }));
}

export function matches(t: Track, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return t.title.toLowerCase().includes(s) || t.artist.toLowerCase().includes(s) || t.album.toLowerCase().includes(s);
}
