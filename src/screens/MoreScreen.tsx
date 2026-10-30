import { useEffect, useState } from 'react';
import type { Track } from '../db/db';
import { clearLibrary, requestPersistence } from '../db/db';
import { formatBytes } from '../domain/names';
import { refreshArtwork, stop } from '../player/player';
import { settings, useStore } from '../store';
import { Flourish, ThornDivider } from '../components/art';

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button className="setting" onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span>
        <span className="setting-label">{label}</span>
        {hint && <span className="setting-hint">{hint}</span>}
      </span>
      <span className={`switch ${on ? 'on' : ''}`} />
    </button>
  );
}

export function MoreScreen({ tracks, notify }: { tracks: Track[]; notify: (t: string) => void }) {
  const s = useStore(settings);
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState(false);
  const bytes = tracks.reduce((n, t) => n + t.size, 0);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage({ used: e.usage ?? 0, quota: e.quota ?? 0 }));
    navigator.storage?.persisted?.().then(setPersisted);
  }, [tracks.length]);

  return (
    <div className="screen">
      <header className="title-head">
        <Flourish className="flourish l" />
        <h1 className="gothic-title">Ещё</h1>
        <Flourish className="flourish r" />
        <div className="title-sub mono">настройки</div>
      </header>

      <div className="section-title">
        <span>вид</span>
      </div>
      <div className="card">
        <Toggle
          on={s.monoCovers}
          onChange={(v) => {
            settings.set({ monoCovers: v });
            refreshArtwork();
          }}
          label="Чёрно-белые обложки"
          hint="в плеере и на экране блокировки — плашка Android тоже станет монохромной"
        />
      </div>

      <div className="section-title">
        <span>хранилище</span>
      </div>
      <div className="card">
        <div className="setting static">
          <span>
            <span className="setting-label">Музыка в плеере</span>
            <span className="setting-hint">
              {formatBytes(bytes)}
              {usage && usage.quota > 0 && ` · свободно ещё примерно ${formatBytes(Math.max(0, usage.quota - usage.used))}`}
            </span>
          </span>
        </div>
        <button
          className="setting"
          onClick={async () => {
            const ok = await requestPersistence();
            setPersisted(ok);
            notify(ok ? 'музыка под защитой' : 'браузер пока не разрешил — установи приложение на главный экран');
          }}
        >
          <span>
            <span className="setting-label">Защита от очистки</span>
            <span className="setting-hint">
              {persisted
                ? 'включена — браузер не удалит музыку, даже если на телефоне кончится место'
                : 'выключена — при нехватке места браузер может стереть музыку. Нажми, чтобы попросить'}
            </span>
          </span>
          <span className={`pill ${persisted ? 'on' : ''}`}>{persisted ? 'вкл' : 'выкл'}</span>
        </button>
        <button
          className={`setting danger ${confirm ? 'confirm' : ''}`}
          disabled={!tracks.length}
          onClick={async () => {
            if (!confirm) return setConfirm(true);
            stop();
            await clearLibrary();
            setConfirm(false);
            notify('библиотека очищена');
          }}
        >
          <span>
            <span className="setting-label">{confirm ? 'Точно? Нажми ещё раз' : 'Очистить библиотеку'}</span>
            <span className="setting-hint">удалит все треки из плеера. Файлы на телефоне останутся</span>
          </span>
        </button>
      </div>

      <div className="section-title">
        <span>на телефоне</span>
      </div>
      <div className="card prose">
        <p>
          <b>Установить:</b> в Chrome меню ⋮ → «Установить приложение». После этого плеер открывается как обычное
          приложение и работает без интернета.
        </p>
        <p>
          <b>Музыка в фоне:</b> можно выключить экран или свернуть плеер — музыка продолжит играть. Если на Xiaomi,
          Huawei или Samsung она обрывается, сними для Chrome ограничения батареи в настройках телефона.
        </p>
        <p>
          <b>Экран блокировки:</b> там будут обложка, название и кнопки. Саму плашку рисует Android, её вид
          поменять нельзя — но она подстраивается под обложку.
        </p>
      </div>

      <ThornDivider />
      <div className="colophon mono">requiem · v1.0 · всё хранится только на этом устройстве</div>
    </div>
  );
}
