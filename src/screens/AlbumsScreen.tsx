import { useMemo } from 'react';
import type { Track } from '../db/db';
import { formatTotal, plural } from '../domain/names';
import { groupAlbums, type Album } from '../hooks';
import { playList, playShuffled } from '../player/player';
import { Flourish, IconBack, IconPlay, IconShuffle } from '../components/art';
import { Cover } from '../components/Cover';
import { TrackList } from '../components/TrackList';

export function AlbumsScreen({ tracks, onOpen }: { tracks: Track[]; onOpen: (key: string) => void }) {
  const albums = useMemo(() => groupAlbums(tracks), [tracks]);
  return (
    <div className="screen">
      <header className="title-head">
        <Flourish className="flourish l" />
        <h1 className="gothic-title">Альбомы</h1>
        <Flourish className="flourish r" />
        <div className="title-sub mono">
          {albums.length} {plural(albums.length, 'альбом', 'альбома', 'альбомов')}
        </div>
      </header>
      {albums.length ? (
        <div className="album-grid">
          {albums.map((a) => (
            <button key={a.key} className="album-card" onClick={() => onOpen(a.key)}>
              <Cover track={a.face} />
              <span className="album-title">{a.title}</span>
              <span className="track-sub">{a.artist || 'неизвестен'}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty small">
          <div className="phrase">альбомов пока нет.</div>
          <div className="sub">они появятся сами, если в тегах треков указан альбом</div>
        </div>
      )}
    </div>
  );
}

export function AlbumScreen({ album, onBack, onMenu }: { album: Album; onBack: () => void; onMenu: (t: Track) => void }) {
  const ids = album.tracks.map((t) => t.id);
  const total = album.tracks.reduce((s, t) => s + t.duration, 0);
  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Назад">
          <IconBack />
        </button>
      </div>
      <div className="album-hero">
        <Cover track={album.face} className="hero-cover" eager />
        <h1 className="hero-title">{album.title}</h1>
        <div className="hero-artist">{album.artist || 'неизвестен'}</div>
        <div className="title-sub mono">
          {[album.year || null, `${album.tracks.length} ${plural(album.tracks.length, 'трек', 'трека', 'треков')}`, formatTotal(total)]
            .filter(Boolean)
            .join(' · ')}
        </div>
        <div className="hero-actions">
          <button className="btn primary" onClick={() => playList(ids)}>
            <IconPlay /> Играть
          </button>
          <button className="btn" onClick={() => playShuffled(ids)}>
            <IconShuffle /> Вперемешку
          </button>
        </div>
      </div>
      <TrackList tracks={album.tracks} numbered onMenu={onMenu} />
    </div>
  );
}
