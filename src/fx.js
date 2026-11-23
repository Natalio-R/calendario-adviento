/* Capa 2D por encima de todo: confeti de papel, chispas, corazones, polvo de rasca y fuegos.
   Se dibuja solo cuando hay partículas vivas. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const cv = document.getElementById('fx'), x = cv.getContext('2d');
const COLORS = ['#f0b22e', '#e5392b', '#f3f4f8', '#1e6a4e', '#2f4fb0', '#e87a8e'];
let W = 0, H = 0, parts = [], raf = 0;

function resize() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize); resize();

function loop() {
  x.clearRect(0, 0, W, H);
  if (parts.length > 1400) parts.splice(0, parts.length - 1400);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vx *= .985; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life -= p.dec;
    if (p.k === 3) {
      if (p.vy >= -1.2) { parts.splice(i, 1); explode(p); continue; }
      if (Math.random() < .6) parts.push({ k: 1, x: p.x, y: p.y, vx: Math.random() - .5, vy: 1, g: .02, r: 1.2, c: '#ffe7ae', life: .6, dec: .03 });
    }
    if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }
    x.globalAlpha = Math.min(1, p.life * 1.5);
    if (p.k === 0) {                       // confeti de papel recortado
      p.rot += p.vr;
      const sc = Math.abs(Math.cos(p.rot * 1.7));
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c;
      if (p.tri) { x.beginPath(); x.moveTo(0, -p.h / 2 * sc); x.lineTo(p.w / 2, p.h / 2 * sc); x.lineTo(-p.w / 2, p.h / 2 * sc); x.fill(); }
      else x.fillRect(-p.w / 2, -p.h / 2 * sc, p.w, p.h * sc);
      x.restore();
    } else if (p.k === 1 || p.k === 3) {
      const r = p.k === 3 ? 2.2 : p.r;
      x.globalCompositeOperation = 'lighter'; x.fillStyle = p.c;
      x.beginPath(); x.arc(p.x, p.y, r, 0, 6.283); x.fill();
      x.globalAlpha *= .25; x.beginPath(); x.arc(p.x, p.y, r * 3.5, 0, 6.283); x.fill();
      x.globalCompositeOperation = 'source-over';
    } else if (p.k === 2) {
      const r = p.r;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.fillStyle = p.c;
      x.beginPath(); x.moveTo(0, r * .35);
      x.bezierCurveTo(-r, -r * .3, -r * .45, -r * 1.1, 0, -r * .45);
      x.bezierCurveTo(r * .45, -r * 1.1, r, -r * .3, 0, r * .35);
      x.fill(); x.restore();
    } else if (p.k === 4) {
      x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r);
    }
  }
  x.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) x.clearRect(0, 0, W, H);
}
const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

function explode(p) {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)], heart = Math.random() < .35;
  for (let i = 0; i < 80; i++) {
    let vx, vy;
    if (heart) {
      const a = i / 80 * 6.283;
      vx = 16 * Math.pow(Math.sin(a), 3) * .3;
      vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * .3;
    } else { const a = Math.random() * 6.283, sp = Math.random() * 6; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; }
    parts.push({ k: 1, x: p.x, y: p.y, vx, vy, g: .05, r: 1.2 + Math.random() * 1.8, c: heart ? '#ff7a9c' : c, life: 1, dec: .01 + Math.random() * .008 });
  }
  window.Sound && Sound.boom();
}

function burst(cx, cy, kind = 'confetti', n = 80) {
  if (reduce) n = Math.ceil(n / 4);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, sp = Math.random();
    if (kind === 'confetti') parts.push({ k: 0, tri: Math.random() < .35, x: cx, y: cy, vx: Math.cos(a) * sp * 9, vy: Math.sin(a) * sp * 9 - 6, g: .22, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, w: 6 + Math.random() * 6, h: 9 + Math.random() * 7, c: COLORS[i % COLORS.length], life: 1, dec: .006 + Math.random() * .006 });
    else if (kind === 'sparkle') parts.push({ k: 1, x: cx, y: cy, vx: Math.cos(a) * sp * 5, vy: Math.sin(a) * sp * 5 - 1, g: .03, r: 1 + Math.random() * 2.4, c: Math.random() < .7 ? '#ffd98a' : '#fff', life: 1, dec: .012 + Math.random() * .015 });
    else if (kind === 'hearts') parts.push({ k: 2, x: cx + (Math.random() - .5) * 60, y: cy, vx: (Math.random() - .5) * 2.4, vy: -2 - Math.random() * 3, g: -.015, r: 7 + Math.random() * 9, c: Math.random() < .5 ? '#e5392b' : '#e87a8e', life: 1, dec: .008 + Math.random() * .006, rot: (Math.random() - .5) * .6 });
    else if (kind === 'dust') parts.push({ k: 4, x: cx + (Math.random() - .5) * 16, y: cy + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 2, vy: -Math.random() * 1.2, g: .16, r: 1 + Math.random() * 2, c: Math.random() < .5 ? '#c3c7d3' : '#f4f5f9', life: 1, dec: .02 + Math.random() * .02 });
  }
  kick();
}
function launch() {
  parts.push({ k: 3, x: W * (.15 + Math.random() * .7), y: H + 10, vx: (Math.random() - .5) * 1.5, vy: -Math.sqrt(2 * .12 * H * (.45 + Math.random() * .35)), g: .12, c: '#ffe7ae', life: 9, dec: 0 });
  window.Sound && Sound.launch();
  kick();
}
function fireworks(ms = 4000) {
  launch();
  const iv = setInterval(launch, reduce ? 900 : 360);
  setTimeout(() => clearInterval(iv), ms);
}

window.FX = { reduce, fine, burst, fireworks, emit() {}, shootingStar() {} };
