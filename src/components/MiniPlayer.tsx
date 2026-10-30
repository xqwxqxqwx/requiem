import { clock, next, player, toggle } from '../player/player';
import { useStore } from '../store';
import { IconNext, IconPause, IconPlay } from './art';
import { Cover } from './Cover';

function Progress() {
  const { time, duration } = useStore(clock);
  return <div className="mini-progress" style={{ transform: `scaleX(${duration ? Math.min(1, time / duration) : 0})` }} />;
}

export function MiniPlayer({ onOpen }: { onOpen: () => void }) {
  const { track, playing } = useStore(player);
  if (!track) return null;
  return (
    <div className="mini">
      <Progress />
      <button className="mini-main" onClick={onOpen} aria-label="Открыть плеер">
        <Cover track={track} className="mini-cover" />
        <span className="mini-text">
          <span className="track-title">{track.title}</span>
          <span className="track-sub">{track.artist || 'неизвестен'}</span>
        </span>
      </button>
      <button className="icon-btn mini-play" onClick={toggle} aria-label={playing ? 'Пауза' : 'Играть'}>
        {playing ? <IconPause /> : <IconPlay />}
      </button>
      <button className="icon-btn" onClick={() => next()} aria-label="Следующий">
        <IconNext />
      </button>
    </div>
  );
}
