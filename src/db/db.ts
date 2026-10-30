import Dexie, { type EntityTable } from 'dexie';

/** Описание трека — лёгкая строка для списков. Сам звук и обложка лежат в отдельных таблицах. */
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** секунды; 0 — пока неизвестно */
  duration: number;
  trackNo: number;
  year: number;
  hasCover: boolean;
  liked: boolean;
  addedAt: number;
  playCount: number;
  lastPlayedAt: number;
  /** имя файла + размер — чтобы не добавлять один и тот же файл дважды */
  fileKey: string;
  size: number;
}

interface AudioRow {
  id: string;
  blob: Blob;
}

interface CoverRow {
  id: string;
  blob: Blob;
}

class PlayerDB extends Dexie {
  tracks!: EntityTable<Track, 'id'>;
  audio!: EntityTable<AudioRow, 'id'>;
  covers!: EntityTable<CoverRow, 'id'>;

  constructor() {
    super('requiem');
    this.version(1).stores({
      tracks: 'id, &fileKey, addedAt, artist, album, liked',
      audio: 'id',
      covers: 'id',
    });
  }
}

export const db = new PlayerDB();

export async function deleteTrack(id: string): Promise<void> {
  await db.transaction('rw', db.tracks, db.audio, db.covers, async () => {
    await db.tracks.delete(id);
    await db.audio.delete(id);
    await db.covers.delete(id);
  });
}

export async function clearLibrary(): Promise<void> {
  await db.transaction('rw', db.tracks, db.audio, db.covers, async () => {
    await db.tracks.clear();
    await db.audio.clear();
    await db.covers.clear();
  });
}

export function toggleLike(t: Track): Promise<number> {
  return db.tracks.update(t.id, { liked: !t.liked });
}

/** Просим браузер не вычищать музыку при нехватке места. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
