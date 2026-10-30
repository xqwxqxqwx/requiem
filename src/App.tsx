import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBackClose } from './backStack';
import type { Track } from './db/db';
import { importFiles, type ImportProgress } from './db/importer';
import { plural } from './domain/names';
import { groupAlbums, useTracks } from './hooks';
import { player } from './player/player';
import { settings, useStore } from './store';
import { MiniPlayer } from './components/MiniPlayer';
import { Nav, type Tab } from './components/Nav';
import { NowPlaying } from './components/NowPlaying';
import { TrackSheet } from './components/TrackSheet';
import { AlbumScreen, AlbumsScreen } from './screens/AlbumsScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { LikedScreen } from './screens/LikedScreen';
import { MoreScreen } from './screens/MoreScreen';

interface Toast {
  id: number;
  text: string;
}

export function App() {
  const tracks = useTracks();
  const { track: current } = useStore(player);
  const { monoCovers } = useStore(settings);

  const [tab, setTab] = useState<Tab>('tracks');
  const [albumKey, setAlbumKey] = useState<string | null>(null);
  const [npOpen, setNpOpen] = useState(false);
  const [menu, setMenu] = useState<Track | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const toastTimer = useRef(0);
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  const closeAlbum = useCallback(() => setAlbumKey(null), []);
  const closeNp = useCallback(() => setNpOpen(false), []);
  const closeMenu = useCallback(() => setMenu(null), []);
  useBackClose(albumKey !== null, closeAlbum);
  useBackClose(npOpen, closeNp);
  useBackClose(menu !== null, closeMenu);

  const notify = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // убрать сплэш после первой загрузки библиотеки
  useEffect(() => {
    if (!tracks) return;
    const s = document.getElementById('splash');
    s?.classList.add('gone');
    const t = setTimeout(() => s?.remove(), 500);
    return () => clearTimeout(t);
  }, [tracks]);

  useEffect(() => {
    document.documentElement.classList.toggle('mono-covers', monoCovers);
  }, [monoCovers]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = [...list];
    setProgress({ done: 0, total: files.length, added: 0, skipped: 0, current: '' });
    const res = await importFiles(files, setProgress);
    setProgress(null);
    if (!res.total) notify('аудиофайлов не нашлось');
    else if (!res.added) notify('всё это уже есть в плеере');
    else
      notify(
        `добавлено ${res.added} ${plural(res.added, 'трек', 'трека', 'треков')}` + (res.skipped ? ` · пропущено ${res.skipped}` : ''),
      );
  };

  const openAlbum = (t: Track) => {
    const key = t.album.toLowerCase() + '|' + (t.artist || '').toLowerCase();
    setNpOpen(false);
    setTab('albums');
    setAlbumKey(key);
    window.scrollTo({ top: 0 });
  };

  const albums = useMemo(() => (tracks && albumKey ? groupAlbums(tracks) : []), [tracks, albumKey]);
  const album = albums.find((a) => a.key === albumKey);

  const goTab = (t: Tab) => {
    setAlbumKey(null);
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  let screen = null;
  if (tracks) {
    if (tab === 'albums' && album) screen = <AlbumScreen album={album} onBack={closeAlbum} onMenu={setMenu} />;
    else if (tab === 'albums')
      screen = (
        <AlbumsScreen
          tracks={tracks}
          onOpen={(k) => {
            setAlbumKey(k);
            window.scrollTo({ top: 0 });
          }}
        />
      );
    else if (tab === 'liked') screen = <LikedScreen tracks={tracks} onMenu={setMenu} />;
    else if (tab === 'more') screen = <MoreScreen tracks={tracks} notify={notify} />;
    else
      screen = (
        <LibraryScreen
          tracks={tracks}
          onMenu={setMenu}
          onImport={(folder) => (folder ? folderInput : filesInput).current?.click()}
        />
      );
  }

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <main className={`app ${current ? 'has-mini' : ''}`}>{screen}</main>

      <MiniPlayer onOpen={() => setNpOpen(true)} />
      <Nav tab={tab} onTab={goTab} />

      {npOpen && <NowPlaying onClose={closeNp} />}
      {menu && <TrackSheet track={menu} onClose={closeMenu} onAlbum={openAlbum} notify={notify} />}

      <input
        ref={filesInput}
        type="file"
        accept="audio/*,.mp3,.m4a,.flac,.ogg,.opus,.wav,.aac"
        multiple
        hidden
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={folderInput}
        type="file"
        multiple
        hidden
        {...{ webkitdirectory: '', directory: '' }}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {progress && (
        <div className="toast importing" role="status">
          <span className="spin" aria-hidden="true" />
          <span className="toast-text">
            добавляю {Math.min(progress.done + 1, progress.total)} из {progress.total}
            {progress.current && <span className="dim"> · {progress.current}</span>}
          </span>
        </div>
      )}
      {!progress && toast && (
        <div className="toast" key={toast.id} role="status">
          <span>{toast.text}</span>
        </div>
      )}
    </>
  );
}
