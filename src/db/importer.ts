import { db, type Track } from './db';
import { parseFileName } from '../domain/names';

const AUDIO_EXT = /\.(mp3|m4a|aac|flac|ogg|oga|opus|wav|weba|webm|alac|aiff?)$/i;
const COVER_MAX = 640;

export function isAudioFile(f: File): boolean {
  return f.type.startsWith('audio/') || AUDIO_EXT.test(f.name);
}

export interface ImportProgress {
  done: number;
  total: number;
  added: number;
  skipped: number;
  current: string;
}

/** Обложки бывают по 3–5 МБ — ужимаем до 640px, хватит и для экрана, и для экрана блокировки. */
async function shrinkCover(data: Uint8Array, mime: string): Promise<Blob | null> {
  try {
    const src = new Blob([data as BlobPart], { type: mime || 'image/jpeg' });
    const bmp = await createImageBitmap(src);
    const k = Math.min(1, COVER_MAX / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k);
    const h = Math.round(bmp.height * k);
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.86 });
  } catch {
    return null;
  }
}

/** Длительность через сам браузер — на случай, если в файле нет нужных заголовков. */
export function probeDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    const url = URL.createObjectURL(blob);
    const done = (v: number) => {
      URL.revokeObjectURL(url);
      a.removeAttribute('src');
      resolve(Number.isFinite(v) ? v : 0);
    };
    a.preload = 'metadata';
    a.onloadedmetadata = () => done(a.duration);
    a.onerror = () => done(0);
    a.src = url;
  });
}

export async function importFiles(all: File[], onProgress?: (p: ImportProgress) => void): Promise<ImportProgress> {
  const files = all.filter(isAudioFile);
  const p: ImportProgress = { done: 0, total: files.length, added: 0, skipped: all.length - files.length, current: '' };
  if (!files.length) return p;

  const { parseBlob, selectCover } = await import('music-metadata');
  const known = new Set(await db.tracks.orderBy('fileKey').keys() as string[]);
  const now = Date.now();

  for (const file of files) {
    p.current = file.name;
    onProgress?.({ ...p });
    const fileKey = `${file.name}|${file.size}`;
    if (known.has(fileKey)) {
      p.skipped++;
      p.done++;
      continue;
    }

    const fromName = parseFileName(file.name);
    let title = fromName.title;
    let artist = fromName.artist;
    let album = '';
    let trackNo = fromName.trackNo;
    let year = 0;
    let duration = 0;
    let cover: Blob | null = null;

    try {
      const meta = await parseBlob(file, { duration: false });
      const c = meta.common;
      title = c.title?.trim() || title;
      artist = c.artist?.trim() || c.albumartist?.trim() || artist;
      album = c.album?.trim() || '';
      trackNo = c.track?.no ?? trackNo;
      year = c.year ?? 0;
      duration = meta.format.duration ?? 0;
      const pic = selectCover(c.picture);
      if (pic) cover = await shrinkCover(pic.data, pic.format);
    } catch {
      /* битые теги — остаёмся с тем, что вытащили из имени файла */
    }
    if (!duration) duration = await probeDuration(file);

    // randomUUID есть только на https — по локальной сети (http://192.168…) берём запасной вариант
    const id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const track: Track = {
      id,
      title,
      artist,
      album,
      duration,
      trackNo,
      year,
      hasCover: !!cover,
      liked: false,
      // сохраняем порядок выбора: первый файл — «самый новый» среди одной пачки
      addedAt: now - p.done,
      playCount: 0,
      lastPlayedAt: 0,
      fileKey,
      size: file.size,
    };

    try {
      await db.transaction('rw', db.tracks, db.audio, db.covers, async () => {
        await db.audio.put({ id, blob: file });
        if (cover) await db.covers.put({ id, blob: cover });
        await db.tracks.add(track);
      });
      known.add(fileKey);
      p.added++;
    } catch (e) {
      console.warn('не удалось сохранить', file.name, e);
      p.skipped++;
      // скорее всего кончилось место — дальше пробовать бессмысленно
      if (e instanceof Error && /quota/i.test(e.name + e.message)) {
        p.done = p.total;
        break;
      }
    }
    p.done++;
  }
  p.current = '';
  onProgress?.({ ...p });
  return p;
}
