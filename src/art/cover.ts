/* Обложки: настоящие из тегов и сгенерированные «тушью» для треков без картинки.
   Сгенерированная обложка зависит только от трека, поэтому у песни она всегда одна. */
import { db, type Track } from '../db/db';
import { hashString } from '../domain/names';

const urls = new Map<string, Promise<string>>();

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

let fontsReady: Promise<unknown> | null = null;
function ensureFonts() {
  fontsReady ??= Promise.all([
    document.fonts.load('400 80px "Pirata One"'),
    document.fonts.load('400 80px "Ruslan Display"', 'Ж'),
    document.fonts.load('400 20px "JetBrains Mono"'),
  ]).catch(() => {});
  return fontsReady;
}

/** Острая «tribal»-звезда: лезвия разной длины, слегка закрученные. */
function blades(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, n: number, twist: number, rnd: () => number) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.15;
    const len = r * (i % 2 ? 0.45 + rnd() * 0.2 : 0.85 + rnd() * 0.3);
    const w = 0.16 + rnd() * 0.08;
    const inner = r * 0.12;
    ctx.moveTo(cx + inner * Math.cos(a - w), cy + inner * Math.sin(a - w));
    ctx.quadraticCurveTo(
      cx + len * 0.55 * Math.cos(a - w * 0.4),
      cy + len * 0.55 * Math.sin(a - w * 0.4),
      cx + len * Math.cos(a + twist),
      cy + len * Math.sin(a + twist),
    );
    ctx.quadraticCurveTo(
      cx + len * 0.5 * Math.cos(a + w * 0.9),
      cy + len * 0.5 * Math.sin(a + w * 0.9),
      cx + inner * Math.cos(a + w),
      cy + inner * Math.sin(a + w),
    );
  }
  ctx.closePath();
  ctx.fill();
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  const w = h * 0.07;
  const arm = h * 0.32;
  const bar = h * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x + w, y - h / 2 + h * 0.12);
  ctx.lineTo(x + w, y - h / 2 + bar - w);
  ctx.lineTo(x + arm * 0.8, y - h / 2 + bar - w);
  ctx.lineTo(x + arm, y - h / 2 + bar);
  ctx.lineTo(x + arm * 0.8, y - h / 2 + bar + w);
  ctx.lineTo(x + w, y - h / 2 + bar + w);
  ctx.lineTo(x + w, y + h / 2 - h * 0.12);
  ctx.lineTo(x, y + h / 2);
  ctx.lineTo(x - w, y + h / 2 - h * 0.12);
  ctx.lineTo(x - w, y - h / 2 + bar + w);
  ctx.lineTo(x - arm * 0.8, y - h / 2 + bar + w);
  ctx.lineTo(x - arm, y - h / 2 + bar);
  ctx.lineTo(x - arm * 0.8, y - h / 2 + bar - w);
  ctx.lineTo(x - w, y - h / 2 + bar - w);
  ctx.lineTo(x - w, y - h / 2 + h * 0.12);
  ctx.closePath();
  ctx.fill();
}

function grain(ctx: CanvasRenderingContext2D, size: number, amount: number, rnd: () => number) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * amount;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Рисует обложку-заглушку. Размер — сторона квадрата в пикселях. */
export async function drawGenerated(t: Pick<Track, 'id' | 'title' | 'artist'>, size = 512): Promise<HTMLCanvasElement> {
  await ensureFonts();
  const seed = hashString(t.title + '|' + t.artist);
  const rnd = rng(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const u = size / 100;

  // ночь и одно пятно света, как от фонаря за окном
  ctx.fillStyle = '#0b0b0c';
  ctx.fillRect(0, 0, size, size);
  const lx = (20 + rnd() * 60) * u;
  const ly = (10 + rnd() * 40) * u;
  const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 75 * u);
  g.addColorStop(0, 'rgba(232,230,227,.22)');
  g.addColorStop(0.5, 'rgba(232,230,227,.05)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // огромная готическая буквица на фоне
  const letter = (t.title.trim()[0] || '†').toUpperCase();
  ctx.save();
  ctx.font = `${120 * u}px "Pirata One", "Ruslan Display", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(232,230,227,.06)';
  ctx.translate(50 * u + (rnd() - 0.5) * 20 * u, 52 * u);
  ctx.rotate((rnd() - 0.5) * 0.3);
  ctx.fillText(letter, 0, 0);
  ctx.strokeStyle = 'rgba(232,230,227,.12)';
  ctx.lineWidth = 0.35 * u;
  ctx.strokeText(letter, 0, 0);
  ctx.restore();

  // царапины тушью
  ctx.strokeStyle = 'rgba(232,230,227,.1)';
  for (let i = 0; i < 14; i++) {
    ctx.lineWidth = (0.15 + rnd() * 0.4) * u;
    const x = rnd() * size;
    const y = rnd() * size;
    const a = -0.9 + rnd() * 0.25;
    const l = (8 + rnd() * 30) * u;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }

  // главный орнамент — лезвия
  const ox = (35 + rnd() * 30) * u;
  const oy = (35 + rnd() * 25) * u;
  ctx.save();
  ctx.shadowColor = 'rgba(232,230,227,.35)';
  ctx.shadowBlur = 4 * u;
  ctx.fillStyle = 'rgba(232,230,227,.82)';
  blades(ctx, ox, oy, (20 + rnd() * 12) * u, 6 + Math.floor(rnd() * 3) * 2, (rnd() - 0.5) * 0.5, rnd);
  ctx.fillStyle = '#0b0b0c';
  ctx.beginPath();
  ctx.arc(ox, oy, 3.2 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // красная капля — не на каждой обложке
  if (rnd() < 0.55) {
    ctx.save();
    ctx.fillStyle = 'rgba(122,20,24,.85)';
    ctx.shadowColor = 'rgba(163,36,42,.6)';
    ctx.shadowBlur = 6 * u;
    const rx = ox + (rnd() - 0.5) * 30 * u;
    const ry = oy + (12 + rnd() * 14) * u;
    ctx.beginPath();
    ctx.ellipse(rx, ry, 2.2 * u, 3.4 * u, 0, 0, Math.PI * 2);
    ctx.moveTo(rx - 2 * u, ry - 1.5 * u);
    ctx.quadraticCurveTo(rx, ry - 8 * u, rx, ry - 8 * u);
    ctx.quadraticCurveTo(rx, ry - 8 * u, rx + 2 * u, ry - 1.5 * u);
    ctx.fill();
    ctx.restore();
  }

  // маленькие кресты
  ctx.fillStyle = 'rgba(232,230,227,.55)';
  const nc = 1 + Math.floor(rnd() * 3);
  for (let i = 0; i < nc; i++) cross(ctx, (10 + rnd() * 80) * u, (10 + rnd() * 50) * u, (5 + rnd() * 7) * u);

  // подпись внизу
  const pad = 7 * u;
  const grad = ctx.createLinearGradient(0, 62 * u, 0, size);
  grad.addColorStop(0, 'rgba(11,11,12,0)');
  grad.addColorStop(1, 'rgba(11,11,12,.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 62 * u, size, 38 * u);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8e6e3';
  ctx.shadowColor = 'rgba(232,230,227,.4)';
  ctx.shadowBlur = 3 * u;
  let fs = 12 * u;
  const title = t.title || 'без названия';
  ctx.font = `${fs}px "Pirata One", "Ruslan Display", serif`;
  while (ctx.measureText(title).width > size - pad * 2 && fs > 6 * u) {
    fs -= 0.5 * u;
    ctx.font = `${fs}px "Pirata One", "Ruslan Display", serif`;
  }
  ctx.fillText(title, pad, size - pad - 6 * u, size - pad * 2);
  ctx.shadowBlur = 0;
  if (t.artist) {
    ctx.font = `${3.4 * u}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(232,230,227,.55)';
    ctx.fillText(t.artist.toUpperCase().split('').join(' '), pad, size - pad, size - pad * 2);
  }

  // рамка
  ctx.strokeStyle = 'rgba(232,230,227,.14)';
  ctx.lineWidth = 0.4 * u;
  ctx.strokeRect(3 * u, 3 * u, size - 6 * u, size - 6 * u);

  grain(ctx, size, 26, rnd);
  return c;
}

function toBlob(c: HTMLCanvasElement, q = 0.88): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), 'image/jpeg', q));
}

/** URL обложки для интерфейса (кэшируется на время сессии). */
export function coverUrl(t: Track): Promise<string> {
  const key = t.id + (t.hasCover ? '' : '|g|' + t.title + '|' + t.artist);
  let p = urls.get(key);
  if (!p) {
    p = (async () => {
      if (t.hasCover) {
        const row = await db.covers.get(t.id);
        if (row) return URL.createObjectURL(row.blob);
      }
      return URL.createObjectURL(await toBlob(await drawGenerated(t, 512)));
    })();
    urls.set(key, p);
  }
  return p;
}

/**
 * Обложка для экрана блокировки: data:URL 512×512. Android сам красит фон плашки под картинку,
 * так что в монохромном режиме она и выглядит монохромной.
 */
export async function artworkDataUrl(t: Track, mono: boolean): Promise<string> {
  const url = await coverUrl(t);
  const img = new Image();
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d')!;
  if (mono) ctx.filter = 'grayscale(1) contrast(1.12) brightness(.92)';
  // как object-fit: cover
  const k = Math.max(512 / img.naturalWidth, 512 / img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
  return c.toDataURL('image/jpeg', 0.85);
}
