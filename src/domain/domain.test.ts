import { describe, expect, it } from 'vitest';
import { formatTime, parseFileName, plural } from './names';
import { EMPTY_QUEUE, current, nextIndex, playNext, prevIndex, removeIds, setShuffle, startQueue } from './queue';

const seq = () => {
  let i = 0;
  const vals = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2];
  return () => vals[i++ % vals.length];
};

describe('имена файлов', () => {
  it('артист - название', () => {
    expect(parseFileName('Snave - vampire (remix).mp3')).toEqual({ artist: 'Snave', title: 'vampire (remix)', trackNo: 0 });
  });
  it('номер трека', () => {
    expect(parseFileName('03. Artist - Song.flac')).toEqual({ artist: 'Artist', title: 'Song', trackNo: 3 });
  });
  it('без артиста', () => {
    expect(parseFileName('locked_in.m4a')).toEqual({ artist: '', title: 'locked in', trackNo: 0 });
  });
  it('название из одних цифр не считается номером', () => {
    expect(parseFileName('1999.mp3').title).toBe('1999');
  });
});

describe('форматирование', () => {
  it('время', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.4)).toBe('1:05');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(formatTime(NaN)).toBe('0:00');
  });
  it('множественное число', () => {
    expect(plural(1, 'трек', 'трека', 'треков')).toBe('трек');
    expect(plural(3, 'трек', 'трека', 'треков')).toBe('трека');
    expect(plural(11, 'трек', 'трека', 'треков')).toBe('треков');
    expect(plural(22, 'трек', 'трека', 'треков')).toBe('трека');
  });
});

describe('очередь', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('старт с выбранного трека', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'c');
    expect(current(q)).toBe('c');
    expect(nextIndex(q, true)).toBe(3);
  });

  it('конец очереди без повтора', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'd');
    expect(nextIndex(q, true)).toBe(-1);
    expect(nextIndex(q, false)).toBe(0); // ручной «вперёд» всё равно переходит в начало
    expect(nextIndex({ ...q, repeat: 'all' }, true)).toBe(0);
  });

  it('повтор одного работает только при автопереходе', () => {
    const q = { ...startQueue(EMPTY_QUEUE, ids, 'b'), repeat: 'one' as const };
    expect(nextIndex(q, true)).toBe(1);
    expect(nextIndex(q, false)).toBe(2);
  });

  it('назад с первого трека', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'a');
    expect(prevIndex(q)).toBe(0);
    expect(prevIndex({ ...q, repeat: 'all' })).toBe(3);
  });

  it('перемешивание держит текущий трек и возвращает порядок', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'c');
    const s = setShuffle(q, true, seq());
    expect(current(s)).toBe('c');
    expect(s.index).toBe(0);
    expect([...s.order].sort()).toEqual(ids);
    const back = setShuffle(s, false);
    expect(back.order).toEqual(ids);
    expect(current(back)).toBe('c');
  });

  it('играть следующим', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'a');
    const n = playNext(q, 'd');
    expect(n.order).toEqual(['a', 'd', 'b', 'c']);
    expect(current(n)).toBe('a');
    expect(playNext(EMPTY_QUEUE, 'x').order).toEqual(['x']);
  });

  it('удаление треков из очереди', () => {
    const q = startQueue(EMPTY_QUEUE, ids, 'c');
    const r = removeIds(q, new Set(['a', 'b']));
    expect(r.order).toEqual(['c', 'd']);
    expect(current(r)).toBe('c');
    const gone = removeIds(q, new Set(['c']));
    expect(gone.order).toEqual(['a', 'b', 'd']);
    expect(removeIds(q, new Set(ids)).index).toBe(-1);
  });
});
