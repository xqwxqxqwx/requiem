import { useMemo } from 'react';
import type { Track } from '../db/db';
import { formatTotal, plural } from '../domain/names';
import { playList, playShuffled } from '../player/player';
import { IconPlay, IconShuffle, ThornHeart } from '../components/art';
import { TrackList } from '../components/TrackList';

export function LikedScreen({ tracks, onMenu }: { tracks: Track[]; onMenu: (t: Track) => void }) {
  const liked = useMemo(() => tracks.filter((t) => t.liked), [tracks]);
  const ids = liked.map((t) => t.id);
  const total = liked.reduce((s, t) => s + t.duration, 0);
  return (
    <div className="screen">
      <header className="liked-head">
        <ThornHeart className="liked-heart" />
        <h1 className="gothic-title">Любимое</h1>
        <div className="title-sub mono">
          {liked.length
            ? `${liked.length} ${plural(liked.length, 'трек', 'трека', 'треков')} · ${formatTotal(total)}`
            : 'пусто, как сердце в понедельник'}
        </div>
        {liked.length > 0 && (
          <div className="hero-actions">
            <button className="btn primary" onClick={() => playList(ids)}>
              <IconPlay /> Играть
            </button>
            <button className="btn" onClick={() => playShuffled(ids)}>
              <IconShuffle /> Вперемешку
            </button>
          </div>
        )}
      </header>
      {liked.length ? (
        <TrackList tracks={liked} onMenu={onMenu} />
      ) : (
        <div className="empty small">
          <div className="sub">нажми ♥ на экране плеера или в меню трека</div>
        </div>
      )}
    </div>
  );
}
