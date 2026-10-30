import { useRef, useState } from 'react';
import { formatTime } from '../domain/names';
import { clock, seek } from '../player/player';
import { useStore } from '../store';

/** Полоса прогресса: тонкая линия, красная заполненная часть, ползунок-крест. Тянется пальцем. */
export function Scrubber() {
  const { time, duration } = useStore(clock);
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);

  const at = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (duration || 0);
  };

  const shown = drag ?? time;
  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0;

  return (
    <div className="scrub">
      <div
        ref={ref}
        className={`scrub-track ${drag != null ? 'dragging' : ''}`}
        role="slider"
        aria-label="Позиция в треке"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(shown)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(time + 5);
          if (e.key === 'ArrowLeft') seek(time - 5);
        }}
        onPointerDown={(e) => {
          if (!duration) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDrag(at(e.clientX));
        }}
        onPointerMove={(e) => drag != null && setDrag(at(e.clientX))}
        onPointerUp={(e) => {
          if (drag == null) return;
          seek(at(e.clientX));
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        <div className="scrub-line" />
        <div className="scrub-fill" style={{ width: `${pct}%` }} />
        <div className="scrub-thumb" style={{ left: `${pct}%` }}>
          <svg viewBox="0 0 14 20" aria-hidden="true">
            <path fill="currentColor" d="M7 0 8.2 4v2.8H11L14 8l-3 1.2H8.2V16L7 20l-1.2-4V9.2H3L0 8l3-1.2h2.8V4Z" />
          </svg>
        </div>
      </div>
      <div className="scrub-times mono">
        <span>{formatTime(shown)}</span>
        <span>-{formatTime(Math.max(0, duration - shown))}</span>
      </div>
    </div>
  );
}
