import { useEffect, useRef, useState } from 'react';
import type { Track } from '../db/db';
import { useCover } from '../hooks';

/* Одна общая «смотрелка»: обложки грузятся и рисуются, только когда строка видна на экране. */
const seen = new WeakMap<Element, () => void>();
let io: IntersectionObserver | null = null;
function watch(el: Element, cb: () => void) {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        seen.get(e.target)?.();
        seen.delete(e.target);
        io!.unobserve(e.target);
      }
    },
    { rootMargin: '300px 0px' },
  );
  seen.set(el, cb);
  io.observe(el);
  return () => {
    seen.delete(el);
    io?.unobserve(el);
  };
}

/** Квадратная обложка. Пока грузится — тёмная плашка. */
export function Cover({ track, className = '', eager }: { track: Track | null | undefined; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!!eager);
  useEffect(() => {
    if (visible || !ref.current) return;
    return watch(ref.current, () => setVisible(true));
  }, [visible]);
  const url = useCover(visible ? track : null);
  return (
    <div ref={ref} className={`cover ${className}`}>
      {url && <img src={url} alt="" draggable={false} decoding="async" />}
    </div>
  );
}
