/*
 * Движок плеера: один <audio> на всё приложение, очередь и Media Session
 * (обложка, название и кнопки на экране блокировки, в шторке и на наушниках).
 */
import { db, type Track } from '../db/db';
import { probeDuration } from '../db/importer';
import { artworkDataUrl } from '../art/cover';
import {
  EMPTY_QUEUE,
  current,
  nextIndex,
  playNext as qPlayNext,
  prevIndex,
  removeIds,
  setShuffle,
  startQueue,
  type QueueState,
  type Repeat,
} from '../domain/queue';
import { createStore, settings } from '../store';

export interface PlayerState {
  queue: QueueState;
  track: Track | null;
  playing: boolean;
  /** трек грузится из базы */
  loading: boolean;
  error: string;
}

export const player = createStore<PlayerState>({ queue: EMPTY_QUEUE, track: null, playing: false, loading: false, error: '' });

/** Время обновляется часто — отдельный стор, чтобы не перерисовывать весь интерфейс. */
export const clock = createStore({ time: 0, duration: 0 });

const audio = new Audio();
audio.preload = 'auto';
let objectUrl = '';
let loadToken = 0;

const QUEUE_KEY = 'requiem:queue';
const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;

/* ── сохранение очереди между запусками ── */
function persist() {
  try {
    const { queue } = player.get();
    localStorage.setItem(QUEUE_KEY, JSON.stringify({ queue, time: audio.currentTime || 0 }));
  } catch {
    /* нет места или приватный режим */
  }
}

let lastPersist = 0;
audio.addEventListener('timeupdate', () => {
  clock.set({ time: audio.currentTime });
  const now = Date.now();
  if (now - lastPersist > 4000) {
    lastPersist = now;
    persist();
    updatePosition();
  }
});
audio.addEventListener('durationchange', () => {
  if (Number.isFinite(audio.duration)) clock.set({ duration: audio.duration });
  updatePosition();
});
audio.addEventListener('play', () => {
  player.set({ playing: true });
  if (ms) ms.playbackState = 'playing';
});
audio.addEventListener('pause', () => {
  player.set({ playing: false });
  if (ms) ms.playbackState = 'paused';
  persist();
});
audio.addEventListener('ended', () => {
  next(true);
});
audio.addEventListener('error', () => {
  if (!audio.src) return;
  player.set({ error: 'Этот файл не получается воспроизвести', playing: false });
});

function updatePosition() {
  if (!ms?.setPositionState) return;
  const d = audio.duration;
  if (!Number.isFinite(d) || d <= 0) return;
  try {
    ms.setPositionState({ duration: d, position: Math.min(audio.currentTime, d), playbackRate: audio.playbackRate });
  } catch {
    /* бывает при гонке с durationchange */
  }
}

async function updateMetadata(t: Track) {
  if (!ms) return;
  const base = { title: t.title, artist: t.artist || 'неизвестен', album: t.album };
  ms.metadata = new MediaMetadata(base);
  try {
    const src = await artworkDataUrl(t, settings.get().monoCovers);
    if (player.get().track?.id !== t.id) return;
    ms.metadata = new MediaMetadata({ ...base, artwork: [{ src, sizes: '512x512', type: 'image/jpeg' }] });
  } catch {
    /* без обложки тоже работает */
  }
}

/** Загрузить трек с индексом `index` в очереди и (по желанию) запустить. */
async function loadIndex(index: number, autoplay: boolean, startAt = 0): Promise<void> {
  const q = player.get().queue;
  const id = q.order[index];
  if (!id) return;
  const token = ++loadToken;
  player.set({ queue: { ...q, index }, loading: true, error: '' });

  const [track, row] = await Promise.all([db.tracks.get(id), db.audio.get(id)]);
  if (token !== loadToken) return;
  if (!track || !row) {
    // трек удалили — выкидываем из очереди и идём дальше
    player.set((s) => ({ queue: removeIds(s.queue, new Set([id])), loading: false }));
    const nq = player.get().queue;
    if (nq.order.length) return loadIndex(Math.min(index, nq.order.length - 1), autoplay);
    return stop();
  }

  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(row.blob);
  audio.src = objectUrl;
  if (startAt) audio.currentTime = startAt;
  clock.set({ time: startAt, duration: track.duration });
  player.set({ track, loading: false });
  persist();
  updateMetadata(track);

  if (!track.duration) {
    probeDuration(row.blob).then((d) => d && db.tracks.update(id, { duration: d }));
  }
  if (autoplay) {
    await play();
    db.tracks.update(id, { playCount: track.playCount + 1, lastPlayedAt: Date.now() });
  }
}

export async function play(): Promise<void> {
  if (!audio.src) {
    const q = player.get().queue;
    if (q.order.length) return loadIndex(Math.max(0, q.index), true);
    return;
  }
  try {
    await audio.play();
  } catch (e) {
    // NotAllowedError — браузер хочет жест пользователя; AbortError — нас перебил новый трек
    if (e instanceof DOMException && e.name === 'NotAllowedError') player.set({ playing: false });
  }
}

export function pause(): void {
  audio.pause();
}

export function toggle(): void {
  if (audio.paused) play();
  else pause();
}

export function stop(): void {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = '';
  player.set({ queue: EMPTY_QUEUE, track: null, playing: false });
  clock.set({ time: 0, duration: 0 });
  if (ms) {
    ms.metadata = null;
    ms.playbackState = 'none';
  }
  persist();
}

/** Запустить список (альбом, «любимое», поиск) с выбранного трека. */
export function playList(ids: string[], startId?: string): Promise<void> {
  const q = startQueue(player.get().queue, ids, startId);
  player.set({ queue: q });
  return loadIndex(q.index, true);
}

/** «Вперемешку»: включает перемешивание и стартует со случайного трека. */
export function playShuffled(ids: string[]): Promise<void> {
  const q = startQueue({ ...player.get().queue, shuffle: true }, ids, undefined);
  player.set({ queue: q });
  return loadIndex(0, true);
}

export function next(auto = false): void {
  const q = player.get().queue;
  const i = nextIndex(q, auto);
  if (i < 0) {
    // очередь доиграла: остаёмся на последнем треке, на паузе в начале
    audio.pause();
    audio.currentTime = 0;
    return;
  }
  if (i === q.index) {
    audio.currentTime = 0;
    play();
    return;
  }
  loadIndex(i, true);
}

export function prev(): void {
  if (audio.currentTime > 3) {
    seek(0);
    return;
  }
  const i = prevIndex(player.get().queue);
  if (i >= 0) loadIndex(i, !audio.paused || player.get().playing);
}

export function seek(sec: number): void {
  if (!Number.isFinite(sec)) return;
  audio.currentTime = Math.max(0, Math.min(sec, audio.duration || sec));
  clock.set({ time: audio.currentTime });
  updatePosition();
}

export function jumpTo(index: number): void {
  loadIndex(index, true);
}

export function toggleShuffle(): void {
  player.set((s) => ({ queue: setShuffle(s.queue, !s.queue.shuffle) }));
  persist();
}

export function cycleRepeat(): void {
  const order: Repeat[] = ['off', 'all', 'one'];
  player.set((s) => ({ queue: { ...s.queue, repeat: order[(order.indexOf(s.queue.repeat) + 1) % 3] } }));
  persist();
}

export function queueNext(id: string): void {
  const had = !!current(player.get().queue);
  player.set((s) => ({ queue: qPlayNext(s.queue, id) }));
  if (!had) loadIndex(0, true);
  persist();
}

/** После удаления треков из библиотеки. */
export function forget(ids: string[]): void {
  const gone = new Set(ids);
  const cur = player.get().track;
  if (cur && gone.has(cur.id)) {
    const wasPlaying = player.get().playing;
    const q = removeIds(player.get().queue, gone);
    if (!q.order.length) return stop();
    player.set({ queue: q });
    loadIndex(Math.max(0, q.index), wasPlaying);
    return;
  }
  player.set((s) => ({ queue: removeIds(s.queue, gone) }));
  persist();
}

/** Лайк/переименование текущего трека — обновить карточку. */
export function refreshTrack(t: Track): void {
  if (player.get().track?.id === t.id) player.set({ track: t });
}

export function refreshArtwork(): void {
  const t = player.get().track;
  if (t) updateMetadata(t);
}

/* ── кнопки экрана блокировки и наушников ── */
if (ms) {
  const h = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
    try {
      ms.setActionHandler(action, fn);
    } catch {
      /* действие не поддерживается этим браузером */
    }
  };
  h('play', () => play());
  h('pause', () => pause());
  h('stop', () => pause());
  h('previoustrack', () => prev());
  h('nexttrack', () => next());
  h('seekto', (d) => d.seekTime != null && seek(d.seekTime));
  h('seekbackward', (d) => seek(audio.currentTime - (d.seekOffset || 10)));
  h('seekforward', (d) => seek(audio.currentTime + (d.seekOffset || 10)));
}

/** Восстановить очередь и позицию после перезапуска — на паузе. */
export async function restore(): Promise<void> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const { queue, time } = JSON.parse(raw) as { queue: QueueState; time: number };
    if (!queue?.order?.length || queue.index < 0) return;
    const known = new Set((await db.tracks.toCollection().primaryKeys()) as string[]);
    const gone = new Set(queue.order.filter((id) => !known.has(id)));
    const q = removeIds(queue, gone);
    if (q.index < 0) return;
    player.set({ queue: q });
    await loadIndex(q.index, false, gone.size ? 0 : time);
  } catch {
    /* испорченное сохранение — начинаем с чистого листа */
  }
}
