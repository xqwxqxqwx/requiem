/* Вся графика плеера — собственные SVG, в одной семье с «Ноктюрном». */
import { useId, type ReactNode } from 'react';

/** Острый крест с заточенными концами. */
export function Cross({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 20" aria-hidden="true">
      <path fill="currentColor" d="M7 0 8.2 4v2.8H11L14 8l-3 1.2H8.2V16L7 20l-1.2-4V9.2H3L0 8l3-1.2h2.8V4Z" />
    </svg>
  );
}

/** Разделитель: терновая лоза с крестом посередине. */
export function ThornDivider() {
  const id = useId().replace(/:/g, '');
  const line = (flip: boolean) => (
    <svg className="line" preserveAspectRatio="none" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <defs>
        <pattern id={`${id}${flip ? 'b' : 'a'}`} width="16" height="10" patternUnits="userSpaceOnUse">
          <rect y="4.6" width="16" height="0.8" fill="currentColor" />
          <path fill="currentColor" d="M2 5Q5 4.3 6.6 .6 6.4 4 8.6 5Z" />
          <path fill="currentColor" d="M9.5 5q3 .7 4.6 4.4-.2-3.4 1.9-4.4Z" />
        </pattern>
      </defs>
      <rect width="100%" height="10" fill={`url(#${id}${flip ? 'b' : 'a'})`} />
    </svg>
  );
  return (
    <div className="thorns" role="separator">
      {line(false)}
      <Cross className="mid" />
      {line(true)}
    </div>
  );
}

/** «Tribal»-завиток в духе Y2K-принтов: острые лезвия, расходящиеся от центра. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 92 40" aria-hidden="true" fill="currentColor">
      <path d="M92 20C72 17 52 7 24 1c16 8 34 15 46 19.5C56 23 38 30 12 39c28-4 54-11 80-19Z" />
      <path d="M84 20C62 19.4 34 19 0 20c34 1 62 .6 84 0Z" />
      <path d="M60 14.5C56 9 50 6 42 6.5c7 2 11 5.5 13 10Z" />
      <path d="M60 25.5c-4 5.5-10 8.5-18 8 7-2 11-5.5 13-10Z" />
      <path d="M36 9.5c-3-1-6-1-9 .5 3 0 5.5 1 7.5 3Z" opacity=".7" />
    </svg>
  );
}

/** Уголок-орнамент для рамки обложки: колючий «tribal»-завиток. */
export function CornerThorn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" fill="currentColor">
      <path d="M0 0h40C26 2 12 4 4 12 2 18 1 28 0 40Z" opacity=".9" />
      <path d="M6 6c10 1 18 4 24 12-8-5-15-7-24-6Z" />
      <path d="M6 6c1 10 4 18 12 24-5-8-7-15-6-24Z" />
      <path d="M14 14l12 2-10 1Z" />
      <path d="M14 14l2 12 1-10Z" />
    </svg>
  );
}

/** Сердце с терновыми шипами — знак приложения и «любимое». */
export function ThornHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        d="M50 82C30 66 14 54 14 38c0-10 8-18 18-18 8 0 14 5 18 11 4-6 10-11 18-11 10 0 18 8 18 18 0 16-16 28-36 44Z"
      />
      <g fill="currentColor">
        <path d="m18 28-10-6 12 2ZM14 44 3 46l11-6ZM24 62l-8 8 5-10ZM38 74l-2 10 -1-11ZM31 21l-3-11 6 10ZM50 30l-3-8 6 7Z" />
        <path d="m82 28 10-6-12 2ZM86 44l11 2-11-6ZM76 62l8 8-5-10ZM62 74l2 10 1-11ZM69 21l3-11-6 10Z" />
      </g>
      <path fill="var(--red)" d="M50 72C36 61 24 52 24 40c0-6 5-11 11-11 6 0 10 4 15 10 5-6 9-10 15-10 6 0 11 5 11 11 0 12-12 21-26 32Z" opacity=".9" />
    </svg>
  );
}

/** Котик в наушниках у окна — для пустой библиотеки. */
export function CatHeadphones() {
  const id = useId().replace(/:/g, '');
  const cat = (
    <>
      <path d="M40 104c-6 0-8-8-6-18 2-12 10-20 18-22s14 4 16 14 2 22-2 26Z" />
      <circle cx="55" cy="56" r="11" />
      <path d="M46.5 50 44.5 37l9 9.5Z" />
      <path d="m57.5 46.5 9-9.5-1.6 13Z" />
      <path d="M66 102c14 2 24-4 22-12-1-4-5-4-6-1 2 3-2 9-14 9Z" />
    </>
  );
  return (
    <svg viewBox="0 0 150 120" aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`}>
          <stop offset="0" stopColor="#e8e6e3" stopOpacity=".2" />
          <stop offset=".55" stopColor="#e8e6e3" stopOpacity=".06" />
          <stop offset="1" stopColor="#e8e6e3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="96" cy="46" r="44" fill={`url(#${id}g)`} />
      <g stroke="#2a2a2e" strokeWidth="1.2" fill="none">
        <path d="M76 74V34a20 20 0 0 1 40 0v40Z" />
        <path d="M96 14v60M76 46h40" />
      </g>
      <circle cx="104" cy="30" r="5" fill="#e8e6e3" opacity=".55" style={{ filter: 'drop-shadow(0 0 4px #e8e6e3)' }} />
      <path d="M14 104h122" stroke="#2a2a2e" strokeWidth="1" />
      <path fill="#2a2a2e" d="M100 104l3-4 1 4ZM118 104l2 3.5 1.5-3.5ZM22 104l3-4 1 4Z" />
      <g fill="#8a8a8f" stroke="#8a8a8f" strokeWidth="1.6" opacity=".55">{cat}</g>
      <g fill="#050505">{cat}</g>
      {/* наушники */}
      <path d="M43.5 56a11.5 12.5 0 0 1 23 0" fill="none" stroke="#55555a" strokeWidth="1.6" />
      <rect x="41" y="53" width="5" height="8" rx="2" fill="#2a2a2e" stroke="#55555a" strokeWidth=".8" />
      <rect x="64" y="53" width="5" height="8" rx="2" fill="#2a2a2e" stroke="#55555a" strokeWidth=".8" />
      {/* провод к телефону на подоконнике */}
      <path d="M43 61c-6 10-14 18-4 30 6 7 14 6 20 12" fill="none" stroke="var(--red)" strokeWidth=".9" opacity=".85" />
      <rect x="57" y="100" width="12" height="4" rx="1" fill="#141416" stroke="#55555a" strokeWidth=".6" />
      <rect x="58.5" y="100.8" width="9" height="2.2" rx=".6" fill="#e8e6e3" opacity=".45" style={{ filter: 'drop-shadow(0 0 3px #e8e6e3)' }} />
      <g fill="#e8e6e3" style={{ filter: 'drop-shadow(0 0 2px #e8e6e3)' }}>
        <path d="M49 57q2-1.2 4 0M57 57q2-1.2 4 0" stroke="#e8e6e3" strokeWidth=".9" fill="none" />
      </g>
      {/* ноты в воздухе */}
      <g fill="#8a8a8f" opacity=".7">
        <path d="M78 58v-7l5-1.4v6.2" stroke="#8a8a8f" strokeWidth=".7" fill="none" />
        <ellipse cx="77" cy="58.3" rx="1.6" ry="1.1" />
        <ellipse cx="82" cy="55" rx="1.6" ry="1.1" />
        <path d="M30 44v-6" stroke="#8a8a8f" strokeWidth=".7" />
        <ellipse cx="29" cy="44.3" rx="1.4" ry="1" />
      </g>
    </svg>
  );
}

/* ── иконки интерфейса ── */
type IP = { className?: string };
const S = (p: { children: ReactNode; className?: string }) => (
  <svg className={p.className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {p.children}
  </svg>
);
const F = (p: { children: ReactNode; className?: string }) => (
  <svg className={p.className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {p.children}
  </svg>
);

/* кнопки управления — заливкой и с заострёнными углами */
export const IconPlay = (p: IP) => (
  <F {...p}>
    <path d="M7 3.5 20.5 12 7 20.5 8.4 12Z" />
  </F>
);
export const IconPause = (p: IP) => (
  <F {...p}>
    <path d="M6.5 3.5h3.2l-.6 17H7.1ZM14.3 3.5h3.2l-.6 17h-2Z" />
  </F>
);
export const IconNext = (p: IP) => (
  <F {...p}>
    <path d="M3.5 5 14 12 3.5 19l1.2-7ZM16.6 4.5h2.6l-.5 15h-1.6Z" />
  </F>
);
export const IconPrev = (p: IP) => (
  <F {...p}>
    <path d="M20.5 5 10 12l10.5 7-1.2-7ZM7.4 4.5H4.8l.5 15h1.6Z" />
  </F>
);
export const IconShuffle = (p: IP) => (
  <S {...p}>
    <path d="M3 7h3.5c4.5 0 6.5 10 11 10H21M3 17h3.5c1.6 0 2.8-1.2 3.8-2.8M13.7 9.8C14.7 8.2 15.9 7 17.5 7H21M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" />
  </S>
);
export const IconRepeat = (p: IP) => (
  <S {...p}>
    <path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3" />
  </S>
);
export const IconRepeatOne = (p: IP) => (
  <S {...p}>
    <path d="M4 11V9a3 3 0 0 1 3-3h12l-3-3M20 13v2a3 3 0 0 1-3 3H5l3 3" />
    <path d="M11 10.5 12.5 9.5V15" strokeWidth="1.4" />
  </S>
);
export const IconHeart = ({ className, filled }: IP & { filled?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 20.5C7 16.6 3 13.6 3 9.4 3 6.9 5 5 7.4 5c1.9 0 3.5 1.1 4.6 2.7C13.1 6.1 14.7 5 16.6 5 19 5 21 6.9 21 9.4c0 4.2-4 7.2-9 11.1Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* шипы */}
    <path d="m4.2 6.4-2-1.6 2.6.5ZM19.8 6.4l2-1.6-2.6.5ZM12 7.7l0-2.6.9 2Z" fill="currentColor" />
  </svg>
);
export const IconSearch = (p: IP) => (
  <S {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="m15 15 5.5 5.5" />
  </S>
);
export const IconMore = (p: IP) => (
  <S {...p}>
    <path d="M12 5h.01M12 12h.01M12 19h.01" strokeWidth="2.6" />
  </S>
);
export const IconDown = (p: IP) => (
  <S {...p}>
    <path d="m5 9 7 7 7-7" />
  </S>
);
export const IconBack = (p: IP) => (
  <S {...p}>
    <path d="M15 5 8 12l7 7" />
  </S>
);
export const IconClose = (p: IP) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);
export const IconPlus = (p: IP) => (
  <S {...p}>
    <path d="M12 4v16M4 12h16" strokeWidth="2" />
  </S>
);
export const IconFolder = (p: IP) => (
  <S {...p}>
    <path d="M3 7.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18V9a1.5 1.5 0 0 0-1.5-1.5H12L10 5H4.5A1.5 1.5 0 0 0 3 6.5Z" />
  </S>
);
export const IconTrash = (p: IP) => (
  <S {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </S>
);
export const IconQueue = (p: IP) => (
  <S {...p}>
    <path d="M4 6h12M4 11h12M4 16h7M17 14v6l4-3Z" />
  </S>
);
export const IconPlayNext = (p: IP) => (
  <S {...p}>
    <path d="M4 7h10M4 12h10M4 17h6M18 9v8M14 13h8" />
  </S>
);
export const IconAlbum = (p: IP) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.2" />
    <path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5" opacity=".6" />
  </S>
);
export const IconNote = (p: IP) => (
  <S {...p}>
    <path d="M9 18V5.5l11-2V16" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </S>
);
export const IconSettings = (p: IP) => (
  <S {...p}>
    <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="17" cy="17" r="2" />
  </S>
);
export const IconSort = (p: IP) => (
  <S {...p}>
    <path d="M7 4v16M3.5 16.5 7 20l3.5-3.5M14 6h7M14 11h5M14 16h3" />
  </S>
);
