import { IconAlbum, IconHeart, IconNote, IconSettings } from './art';

export type Tab = 'tracks' | 'albums' | 'liked' | 'more';

const TABS: [Tab, string, (p: { className?: string }) => React.JSX.Element][] = [
  ['tracks', 'Треки', IconNote],
  ['albums', 'Альбомы', IconAlbum],
  ['liked', 'Любимое', IconHeart],
  ['more', 'Ещё', IconSettings],
];

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
