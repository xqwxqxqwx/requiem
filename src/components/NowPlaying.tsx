import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, toggleLike, type Track } from '../db/db';
import { useBackClose } from '../backStack';
import { useCover } from '../hooks';
import { cycleRepeat, jumpTo, next, player, prev, refreshTrack, toggle, toggleShuffle } from '../player/player';
import { useStore } from '../store';
import { formatTime } from '../domain/names';
import {
  CornerThorn,
  Cross,
  IconDown,
  IconHeart,
  IconNext,
  IconPause,
  IconPlay,
  IconPrev,
  IconQueue,
  IconRepeat,
  IconRepeatOne,
  IconShuffle,
} from './art';
import { Scrubber } from './Scrubber';
import { Bars } from './TrackRow';

export function NowPlaying({ onClose }: { onClose: () => void }) {
  const { track, playing, queue, error } = useStore(player);
  const cover = useCover(track);
  const [showQueue, setShowQueue] = useState(false);
  const closeQueue = () => setShowQueue(false);
  useBackClose(showQueue, closeQueue);

  // свайп вниз закрывает, влево/вправо по обложке — соседний трек
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dy, setDy] = useState(0);
  const onDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const y = e.clientY - start.current.y;
    if (y > 0 && Math.abs(y) > Math.abs(e.clientX - start.current.x)) setDy(y);
  };
  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    setDy(0);
    if (y > 110) onClose();
    else if (Math.abs(x) > 70 && Math.abs(x) > Math.abs(y) * 1.5) {
      if (x < 0) next();
      else prev();
    }
  };

  if (!track) return null;

  const like = async () => {
    await toggleLike(track);
    refreshTrack({ ...track, liked: !track.liked });
  };

  const upNext = queue.order[queue.index + 1];

  return (
    <div className="np" style={dy ? { transform: `translateY(${dy}px)`, transition: 'none' } : undefined}>
      <div className="np-bg" style={cover ? { backgroundImage: `url(${cover})` } : undefined} aria-hidden="true" />
      <div className="np-inner" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (start.current = null)}>
        <div className="np-top">
          <button className="icon-btn" onClick={onClose} aria-label="Свернуть">
            <IconDown />
          </button>
          <div className="np-top-label">
            <span>сейчас играет</span>
            {track.album && <b>{track.album}</b>}
          </div>
          <button className="icon-btn" onClick={() => setShowQueue(true)} aria-label="Очередь">
            <IconQueue />
          </button>
        </div>

        <div className="np-cover-wrap">
          <div className={`np-cover ${playing ? 'playing' : ''}`}>
            {cover && <img src={cover} alt="" draggable={false} />}
            <span className="np-cover-grain" />
            <CornerThorn className="corner tl" />
            <CornerThorn className="corner tr" />
            <CornerThorn className="corner bl" />
            <CornerThorn className="corner br" />
          </div>
        </div>

        <div className="np-meta">
          <div className="np-text">
            <h1 className="np-title">{track.title}</h1>
            <div className="np-artist">{track.artist || 'неизвестен'}</div>
          </div>
          <button className={`icon-btn like ${track.liked ? 'on' : ''}`} onClick={like} aria-label={track.liked ? 'Убрать из любимого' : 'В любимое'}>
            <IconHeart filled={track.liked} />
          </button>
        </div>

        {error && <div className="np-error">{error}</div>}

        <div onPointerDown={(e) => e.stopPropagation()}>
          <Scrubber />
        </div>

        <div className="np-controls">
          <button className={`icon-btn mode ${queue.shuffle ? 'on' : ''}`} onClick={toggleShuffle} aria-label="Перемешать" aria-pressed={queue.shuffle}>
            <IconShuffle />
          </button>
          <button className="icon-btn skip" onClick={prev} aria-label="Предыдущий">
            <IconPrev />
          </button>
          <button className="play-big" onClick={toggle} aria-label={playing ? 'Пауза' : 'Играть'}>
            <svg className="ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" />
            </svg>
            {playing ? <IconPause /> : <IconPlay />}
          </button>
          <button className="icon-btn skip" onClick={() => next()} aria-label="Следующий">
            <IconNext />
          </button>
          <button
            className={`icon-btn mode ${queue.repeat !== 'off' ? 'on' : ''}`}
            onClick={cycleRepeat}
            aria-label={queue.repeat === 'one' ? 'Повтор одного' : queue.repeat === 'all' ? 'Повтор всех' : 'Без повтора'}
          >
            {queue.repeat === 'one' ? <IconRepeatOne /> : <IconRepeat />}
          </button>
        </div>

        <UpNext id={upNext} onOpen={() => setShowQueue(true)} />
      </div>

      {showQueue && <QueueSheet onClose={closeQueue} />}
    </div>
  );
}

function UpNext({ id, onOpen }: { id: string | undefined; onOpen: () => void }) {
  const t = useLiveQuery(() => (id ? db.tracks.get(id) : undefined), [id]);
  return (
    <button className="np-next" onClick={onOpen}>
      <Cross className="x" />
      {t ? (
        <>
          <span className="lbl">дальше</span>
          <span className="t">{t.title}</span>
        </>
      ) : (
        <span className="lbl">дальше — тишина</span>
      )}
    </button>
  );
}

function QueueSheet({ onClose }: { onClose: () => void }) {
  const { queue, playing } = useStore(player);
  const rest = queue.order.slice(queue.index, queue.index + 200);
  const tracks = useLiveQuery(() => db.tracks.bulkGet(rest), [rest.join(',')]);
  return (
    <div className="sheet-wrap" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
      <div className="sheet queue-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="section-title">
          <span>очередь</span>
          <span className="dim">{queue.order.length - queue.index} в очереди</span>
        </div>
        <div className="queue-list">
          {tracks?.map((t: Track | undefined, i) =>
            t ? (
              <button key={t.id + i} className={`q-row ${i === 0 ? 'active' : ''}`} onClick={() => i && jumpTo(queue.index + i)}>
                <span className="q-no mono">{i === 0 ? <Bars on={playing} /> : i}</span>
                <span className="q-text">
                  <span className="track-title">{t.title}</span>
                  <span className="track-sub">{t.artist || 'неизвестен'}</span>
                </span>
                <span className="mono dim">{formatTime(t.duration)}</span>
              </button>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
}
