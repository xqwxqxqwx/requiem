// Генерирует иконки плеера: терновое сердце с крестом, SVG и PNG нужных размеров.
// Запуск: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const out = 'public/icons';
mkdirSync(out, { recursive: true });

const f = (n) => n.toFixed(2);

/** Точка классической кривой сердца, вписанной в квадрат 100×100. */
function heartPt(t, k) {
  const x = 16 * Math.sin(t) ** 3;
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return [50 + k * x, 50 + k * (y - 2.75)];
}

function heartPath(k, steps = 120) {
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const [x, y] = heartPt((i / steps) * Math.PI * 2, k);
    d += (i ? 'L' : 'M') + f(x) + ' ' + f(y);
  }
  return d + 'Z';
}

/** Шипы по контуру сердца, чередуются длинные и короткие, слегка закручены. */
function heartThorns(k, count) {
  let d = '';
  for (let i = 0; i < count; i++) {
    const t = ((i + 0.5) / count) * Math.PI * 2;
    if (Math.abs(t - Math.PI) < 0.12) continue; // не колем острый низ — он и так остриё
    const [x, y] = heartPt(t, k);
    const [x1, y1] = heartPt(t - 0.035, k);
    const [x2, y2] = heartPt(t + 0.035, k);
    let nx = y2 - y1;
    let ny = -(x2 - x1);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    if (nx * (x - 50) + ny * (y - 50) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const long = i % 2 === 0;
    const L = long ? 8 : 4.5;
    const tw = long ? 0.35 : -0.3; // закрутка вдоль касательной
    const tx = (x2 - x1) / len;
    const ty = (y2 - y1) / len;
    const tipX = x + nx * L + tx * L * tw;
    const tipY = y + ny * L + ty * L * tw;
    d += `M${f(x1)} ${f(y1)}L${f(tipX)} ${f(tipY)}L${f(x2)} ${f(y2)}Z`;
  }
  return d;
}

const cross = 'M50 34 51.8 40v5.5h5.4L62 48l-4.8 2.2h-5.4V62L50 68l-1.8-6V50.2h-5.4L38 48l4.8-2.5h5.4V40Z';

function mark({ bg, pad = 0, mono = false }) {
  const s = (100 - pad * 2) / 100;
  const ink = mono ? '#ffffff' : '#e8e6e3';
  const g = `
    <g transform="translate(${pad} ${pad}) scale(${s})">
      <path d="${heartPath(2.0)}" fill="none" stroke="${ink}" stroke-width="1.6" opacity=".9"/>
      <path d="${heartThorns(2.0, 30)}" fill="${ink}" opacity=".85"/>
      ${mono ? '' : `<path d="${heartPath(1.48)}" fill="url(#blood)" filter="url(#glowRed)"/>`}
      <path d="${heartPath(1.48)}" fill="none" stroke="${ink}" stroke-width=".6" opacity="${mono ? 0.6 : 0.35}"/>
      <path d="${cross}" fill="${ink}" ${mono ? '' : 'filter="url(#glow)"'}/>
    </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="1.8" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowRed" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="light" cx="50%" cy="42%" r="60%">
      <stop offset="0" stop-color="#26262a"/>
      <stop offset="1" stop-color="#0b0b0c"/>
    </radialGradient>
    <radialGradient id="blood" cx="45%" cy="38%" r="70%">
      <stop offset="0" stop-color="#a3242a"/>
      <stop offset="1" stop-color="#4a0b0e"/>
    </radialGradient>
  </defs>
  ${bg ? '<rect width="100" height="100" fill="url(#light)"/>' : ''}
  ${g}
</svg>`;
}

const icon = mark({ bg: true, pad: 6 });
const maskable = mark({ bg: true, pad: 16 }); // безопасная зона для Android
writeFileSync(`${out}/icon.svg`, icon);
writeFileSync(`${out}/icon-mark.svg`, mark({ bg: false }));

const png = (svg, size, name) => sharp(Buffer.from(svg), { density: 72 * (size / 100) }).resize(size, size).png().toFile(`${out}/${name}`);
await png(icon, 192, 'icon-192.png');
await png(icon, 512, 'icon-512.png');
await png(maskable, 512, 'icon-maskable-512.png');
await png(mark({ bg: false, pad: 16, mono: true }), 512, 'icon-mono-512.png'); // тематические иконки Android 13+
await png(mark({ bg: true, pad: 10 }), 180, 'apple-touch-icon.png');
console.log('icons ok');
