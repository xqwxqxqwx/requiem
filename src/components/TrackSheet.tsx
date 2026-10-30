import { useState } from 'react';
import { deleteTrack, toggleLike, type Track } from '../db/db';
import { formatBytes, formatTime } from '../domain/names';
import { forget, queueNext, refreshTrack } from '../player/player';
import { IconAlbum, IconHeart, IconPlayNext, IconTrash } from './art';
import { Cover } from './Cover';

interface Props {
  track: Track;
  onClose: () => void;
  onAlbum?: (t: Track) => void;
  notify: (text: string) => void;
}

/** Шторка действий с треком. Удаление — со вторым нажатием для подтверждения. */
export function TrackSheet({ track, onClose, onAlbum, notify }: Props) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <Cover track={track} className="sheet-cover" />
          <div>
            <div className="track-title">{track.title}</div>
            <div className="track-sub">
              {track.artist || 'неизвестен'}
              {track.album && ` · ${track.album}`}
            </div>
            <div className="track-sub mono dim">
              {formatTime(track.duration)} · {formatBytes(track.size)}
              {track.playCount > 0 && ` · ${track.playCount}×`}
            </div>
          </div>
        </div>

        <button
          className="sheet-act"
          onClick={() => {
            queueNext(track.id);
            notify('сыграет следующим');
            onClose();
          }}
        >
          <IconPlayNext /> Играть следующим
        </button>
        <button
          className="sheet-act"
          onClick={async () => {
            await toggleLike(track);
            refreshTrack({ ...track, liked: !track.liked });
            notify(track.liked ? 'убрано из любимого' : 'в любимом');
            onClose();
          }}
        >
          <IconHeart filled={track.liked} className={track.liked ? 'red' : ''} />
          {track.liked ? 'Убрать из любимого' : 'В любимое'}
        </button>
        {track.album && onAlbum && (
          <button
            className="sheet-act"
            onClick={() => {
              onAlbum(track);
              onClose();
            }}
          >
            <IconAlbum /> К альбому
          </button>
        )}
        <button
          className={`sheet-act danger ${confirm ? 'confirm' : ''}`}
          onClick={async () => {
            if (!confirm) return setConfirm(true);
            forget([track.id]);
            await deleteTrack(track.id);
            notify('трек удалён');
            onClose();
          }}
        >
          <IconTrash /> {confirm ? 'Точно удалить? Нажми ещё раз' : 'Удалить из плеера'}
        </button>
      </div>
    </div>
  );
}
