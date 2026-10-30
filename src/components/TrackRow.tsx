import { memo } from 'react';
import type { Track } from '../db/db';
import { formatTime } from '../domain/names';
import { IconHeart, IconMore } from './art';
import { Cover } from './Cover';

interface Props {
  track: Track;
  active: boolean;
  playing: boolean;
  /** номер вместо обложки — для страницы альбома */
  number?: number;
  onPlay: (t: Track) => void;
  onMenu: (t: Track) => void;
}

/** Три полоски «эквалайзера» у играющего трека. */
export function Bars({ on }: { on: boolean }) {
  return (
    <span className={`bars ${on ? 'on' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export const TrackRow = memo(function TrackRow({ track, active, playing, number, onPlay, onMenu }: Props) {
  return (
    <div className={`track ${active ? 'active' : ''}`}>
      <button className="track-main" onClick={() => onPlay(track)}>
        {number != null ? (
          <span className="track-no mono">{active ? <Bars on={playing} /> : number || '·'}</span>
        ) : (
          <span className="track-art">
            <Cover track={track} />
            {active && (
              <span className="track-art-over">
                <Bars on={playing} />
              </span>
            )}
          </span>
        )}
        <span className="track-text">
          <span className="track-title">{track.title}</span>
          <span className="track-sub">
            {track.liked && <IconHeart className="mini-heart" filled />}
            {track.artist || 'неизвестен'}
            <span className="dot">·</span>
            <span className="mono">{formatTime(track.duration)}</span>
          </span>
        </span>
      </button>
      <button className="icon-btn track-menu" onClick={() => onMenu(track)} aria-label="Действия с треком">
        <IconMore />
      </button>
    </div>
  );
});
