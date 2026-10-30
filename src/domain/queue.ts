/** Логика очереди без побочных эффектов — её удобно тестировать отдельно от <audio>. */

export type Repeat = 'off' | 'all' | 'one';

export interface QueueState {
  /** исходный порядок (как в списке, откуда запустили) */
  base: string[];
  /** порядок воспроизведения: base или перемешанный */
  order: string[];
  index: number;
  shuffle: boolean;
  repeat: Repeat;
}

export const EMPTY_QUEUE: QueueState = { base: [], order: [], index: -1, shuffle: false, repeat: 'off' };

export function shuffled<T>(arr: T[], rnd: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Текущий трек остаётся первым, остальные — вперемешку. */
function shuffleAround(ids: string[], current: string | undefined, rnd?: () => number): string[] {
  if (!current) return shuffled(ids, rnd);
  return [current, ...shuffled(ids.filter((x) => x !== current), rnd)];
}

export function current(q: QueueState): string | undefined {
  return q.order[q.index];
}

export function startQueue(q: QueueState, ids: string[], startId: string | undefined, rnd?: () => number): QueueState {
  const first = startId ?? (q.shuffle ? undefined : ids[0]);
  if (q.shuffle) {
    const order = shuffleAround(ids, first, rnd);
    return { ...q, base: ids, order, index: 0 };
  }
  return { ...q, base: ids, order: ids, index: Math.max(0, ids.indexOf(first!)) };
}

export function setShuffle(q: QueueState, on: boolean, rnd?: () => number): QueueState {
  const cur = current(q);
  if (on) return { ...q, shuffle: true, order: shuffleAround(q.base, cur, rnd), index: cur ? 0 : -1 };
  return { ...q, shuffle: false, order: q.base, index: cur ? q.base.indexOf(cur) : -1 };
}

/** Индекс следующего трека; -1 — очередь закончилась. `auto` — трек доиграл сам (тогда работает «повтор одного»). */
export function nextIndex(q: QueueState, auto: boolean): number {
  if (!q.order.length) return -1;
  if (auto && q.repeat === 'one') return q.index;
  if (q.index + 1 < q.order.length) return q.index + 1;
  return q.repeat === 'off' && auto ? -1 : 0;
}

export function prevIndex(q: QueueState): number {
  if (!q.order.length) return -1;
  if (q.index > 0) return q.index - 1;
  return q.repeat === 'off' ? 0 : q.order.length - 1;
}

/** Вставить трек сразу после текущего. */
export function playNext(q: QueueState, id: string): QueueState {
  const strip = (a: string[], keep: number) => a.filter((x, i) => x !== id || i === keep);
  const cur = current(q);
  if (!cur) return { ...q, base: [id], order: [id], index: 0 };
  if (cur === id) return q;
  const order = strip(q.order, -1);
  const at = order.indexOf(cur) + 1;
  order.splice(at, 0, id);
  const base = q.base.includes(id) ? q.base : [...q.base, id];
  return { ...q, base, order, index: order.indexOf(cur) };
}

/** Убрать удалённые из библиотеки треки. */
export function removeIds(q: QueueState, gone: Set<string>): QueueState {
  if (!gone.size) return q;
  const cur = current(q);
  const order = q.order.filter((x) => !gone.has(x));
  const base = q.base.filter((x) => !gone.has(x));
  let index = cur && !gone.has(cur) ? order.indexOf(cur) : Math.min(q.index, order.length - 1);
  if (!order.length) index = -1;
  return { ...q, base, order, index };
}
