/** Разбор имени файла, когда в треке нет тегов: «01. Artist - Title (feat. X).mp3». */
export function parseFileName(name: string): { artist: string; title: string; trackNo: number } {
  let base = name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/_/g, ' ').trim();
  let trackNo = 0;
  const num = base.match(/^(\d{1,3})\s*[.\-)]?\s+(.*)$/);
  if (num && num[2]) {
    trackNo = Number(num[1]);
    base = num[2];
  }
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim(), trackNo };
  }
  return { artist: '', title: base, trackNo };
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** «2 ч 14 мин» — для сводки по библиотеке и альбому. */
export function formatTotal(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 1) return `${Math.round(sec)} сек`;
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

export function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} КБ`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(0)} МБ`;
  return `${(b / 1024 ** 3).toFixed(1)} ГБ`;
}

/** Детерминированное число из строки — чтобы обложка-заглушка у трека всегда была одна и та же. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
