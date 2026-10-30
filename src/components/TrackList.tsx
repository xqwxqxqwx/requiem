import { useCallback, useMemo } from 'react';
import type { Track } from '../db/db';
import { player, playList, toggle } from '../player/player';
import { useStore } from '../store';
import { TrackRow } from './TrackRow';

/** Список треков: тап — играть весь список с этого места; тап по играющему — пауза. */
export function TrackList({ tracks, numbered, onMenu }: { tracks: Track[]; numbered?: boolean; onMenu: (t: Track) => void }) {
  const { track: cur, playing } = useStore(player);
  const ids = useMemo(() => tracks.map((t) => t.id), [tracks]);
  const onPlay = useCallback(
    (t: Track) => {
      if (player.get().track?.id === t.id) toggle();
      else playList(ids, t.id);
    },
    [ids],
  );
  return (
    <div className="track-list">
      {tracks.map((t) => (
        <TrackRow
          key={t.id}
          track={t}
          active={cur?.id === t.id}
          playing={playing}
          number={numbered ? t.trackNo : undefined}
          onPlay={onPlay}
          onMenu={onMenu}
        />
      ))}
    </div>
  );
}
