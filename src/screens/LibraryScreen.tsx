import { useMemo, useState } from 'react';
import type { Track } from '../db/db';
import { formatTotal, plural } from '../domain/names';
import { matches } from '../hooks';
import { settings, useStore, type Settings } from '../store';
import { CatHeadphones, Flourish, IconClose, IconFolder, IconPlus, IconSearch, IconSort, ThornDivider } from '../components/art';
import { TrackList } from '../components/TrackList';

const SORTS: [Settings['sort'], string][] = [
  ['added', 'недавние'],
  ['title', 'по названию'],
  ['artist', 'по исполнителю'],
];

interface Props {
  tracks: Track[];
  onImport: (folder: boolean) => void;
  onMenu: (t: Track) => void;
}

export function LibraryScreen({ tracks, onImport, onMenu }: Props) {
  const { sort } = useStore(settings);
  const [q, setQ] = useState('');
  const shown = useMemo(() => tracks.filter((t) => matches(t, q.trim())), [tracks, q]);
  const total = useMemo(() => tracks.reduce((s, t) => s + t.duration, 0), [tracks]);

  const nextSort = () => {
    const i = SORTS.findIndex(([k]) => k === sort);
    settings.set({ sort: SORTS[(i + 1) % SORTS.length][0] });
  };

  return (
    <div className="screen">
      <header className="title-head">
        <Flourish className="flourish l" />
        <h1 className="gothic-title">Requiem</h1>
        <Flourish className="flourish r" />
        <div className="title-sub mono">
          {tracks.length
            ? `${tracks.length} ${plural(tracks.length, 'трек', 'трека', 'треков')} · ${formatTotal(total)}`
            : 'тёмный плеер'}
        </div>
      </header>

      {!tracks.length ? (
        <div className="empty">
          <CatHeadphones />
          <div className="phrase">тишина. ни одной песни.</div>
          <div className="sub">добавь свои mp3, flac или m4a — они останутся на телефоне и будут играть без интернета</div>
          <div className="empty-actions">
            <button className="btn primary" onClick={() => onImport(false)}>
              <IconPlus /> Добавить файлы
            </button>
            <button className="btn" onClick={() => onImport(true)}>
              <IconFolder /> Папку
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="lib-tools">
            <label className="search">
              <IconSearch />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="поиск" enterKeyHint="search" />
              {q && (
                <button onClick={() => setQ('')} aria-label="Очистить">
                  <IconClose />
                </button>
              )}
            </label>
            <button className="icon-btn" onClick={() => onImport(false)} aria-label="Добавить файлы">
              <IconPlus />
            </button>
            <button className="icon-btn" onClick={() => onImport(true)} aria-label="Добавить папку">
              <IconFolder />
            </button>
          </div>
          <div className="section-title">
            <span>{q ? `найдено ${shown.length}` : 'все треки'}</span>
            <button className="act" onClick={nextSort}>
              <IconSort className="ico" /> {SORTS.find(([k]) => k === sort)?.[1]}
            </button>
          </div>
          {shown.length ? (
            <TrackList tracks={shown} onMenu={onMenu} />
          ) : (
            <div className="empty small">
              <div className="phrase">ничего не нашлось.</div>
            </div>
          )}
          <ThornDivider />
        </>
      )}
    </div>
  );
}
