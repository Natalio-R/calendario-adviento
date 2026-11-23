import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/special-elite/400.css';
import '@fontsource/la-belle-aurore/400.css';
import './styles.css';
import './config.js';
import './audio.js';
import './fx.js';
import './days.js';
import { createStage } from './stage.js';

const C = window.CONFIG, D = window.DAYS;
const $ = s => document.querySelector(s);
const wait = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
const motesDeep = o => typeof o === 'string' ? conMotes(o) : Array.isArray(o) ? o.map(motesDeep) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, motesDeep(v)])) : o;
const fmt = (s, v) => conMotes(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const REDUCE = FX.reduce, FINE = FX.fine;
const haptic = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* nada */ } };

/* ---------- estado y fechas ---------- */
const KEY = 'adviento:' + norm(C.nombre) + ':' + C.anio;
const qs = new URLSearchParams(location.search);
// solo en local (npm run dev / movil): en la web publicada nadie puede saltarse las fechas con la URL
const DEV = import.meta.env.DEV && !!C.claveSecreta && qs.get('modo') === C.claveSecreta;
const FAKE = DEV && qs.get('fecha') ? new Date(qs.get('fecha') + 'T12:00:00') : null;
const now = () => (FAKE ? new Date(FAKE) : new Date());
const DEF = { entered: false, opened: [], done: [], vales: {}, muted: false, adorno: null };
const load = () => { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...DEF }; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ } };
let S = load();

const unlockAt = d => new Date(C.anio, 11, d);      // el 0 cae en el 30 de noviembre
const openable = d => (DEV && !FAKE) || now() >= unlockAt(d);
const daysUntil = d => Math.max(1, Math.ceil((unlockAt(d) - now()) / 864e5));
const maxOpened = () => (S.opened.length ? Math.max(...S.opened) : -1);
const litCount = () => S.opened.filter(d => d >= 1).length;
const dateLabel = d => d === 24 ? '24 de diciembre' : d === 0 ? '30 de noviembre' : `${d} de diciembre`;
const stateOf = d => (S.opened.includes(d) ? 'opened' : openable(d) ? 'available' : 'locked');
function today() {
  const n = now();
  if (n < unlockAt(0)) return -1;
  if (n < unlockAt(1)) return 0;
  if (n.getFullYear() === C.anio && n.getMonth() === 11) return Math.min(n.getDate(), 25);
  return 25;
}

/* ---------- iconos dibujados (un solo trazo, 1.75) ---------- */
const ICON = {
  ticket: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8.5V6.8C3 6.4 3.4 6 3.8 6h16.4c.4 0 .8.4.8.8v1.7a2.5 2.5 0 0 0 0 5v1.7c0 .4-.4.8-.8.8H3.8c-.4 0-.8-.4-.8-.8v-1.7a2.5 2.5 0 0 0 0-5Z"/><path d="M14.5 6v2M14.5 11v2M14.5 16v2"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path class="w1" d="M15.5 9.2a4 4 0 0 1 0 5.6"/><path class="w2" d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8"/><path class="x" d="m16 9.5 5 5m0-5-5 5"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6 8.5 12l6 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
  door: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20V8.5a6 6 0 0 1 12 0V20z"/><path d="M14.5 13.5h.01"/></svg>',
};
document.querySelectorAll('[data-icon]').forEach(el => { el.insertAdjacentHTML('afterbegin', ICON[el.dataset.icon]); });

/* ---------- escenario ---------- */
let stage = null;
$('#tName').textContent = C.nombre;
document.title = `El pueblo de ${C.nombre}`;

const strip = $('#strip');
strip.innerHTML = Array.from({ length: 25 }, (_, i) => `<li><button class="tab" data-d="${i}"><span>${i}</span></button></li>`).join('');

function refresh(animate) {
  const t = today(), st = {};
  for (let d = 0; d <= 24; d++) st[d] = stateOf(d);
  if (stage) stage.setStates(st, t, litCount());
  strip.querySelectorAll('.tab').forEach(b => {
    const d = +b.dataset.d, s = st[d];
    b.dataset.state = s; b.classList.toggle('today', d === t);
    b.setAttribute('aria-label', `Día ${d}, ${s === 'opened' ? 'abierto' : s === 'available' ? 'listo para abrir' : 'aún cerrado'}${d === t ? ', hoy' : ''}`);
  });
  const n = litCount();
  $('#progN').textContent = n; $('#progBar').style.transform = `scaleX(${n / 24})`;
  const vales = Object.values(S.vales), b = $('#btnVales');
  b.hidden = vales.length === 0; b.dataset.n = vales.filter(v => !v.usado).length;
  $('#btnSound').classList.toggle('off', S.muted); $('#btnSound').setAttribute('aria-pressed', String(!S.muted));
  dock(animate);
}

/* Panel inferior: describe lo que la cámara está mirando y ofrece la acción */
function dock() {
  const f = stage ? stage.focused : null, t = today();
  const info = $('#fbInfo'), act = $('#fbOpen'), back = $('#fbBack');
  if (f == null) {
    back.hidden = true;
    if (t >= 0 && t <= 24) {
      const s = stateOf(t);
      info.innerHTML = s === 'opened' ? `<b>Día ${t}</b><span>Ya abierto · vuelve cuando quieras</span>` : `<b>Hoy toca el ${t}</b><span>${dateLabel(t)}</span>`;
      act.hidden = false; act.dataset.d = t; act.querySelector('span').textContent = s === 'opened' ? `Volver al ${t}` : `Abrir el ${t}`;
      act.disabled = false;
    } else if (t === -1) {
      const k = daysUntil(0);
      info.innerHTML = `<b>${k === 1 ? 'Mañana empieza' : `Faltan ${k} días`}</b><span>La primera puerta se abre el 30 de noviembre</span>`;
      act.hidden = !DEV; act.dataset.d = 0; act.querySelector('span').textContent = 'Abrir el 0'; act.disabled = false;
    } else {
      info.innerHTML = `<b>Feliz Navidad</b><span>Todas tus puertas siguen aquí</span>`;
      act.hidden = true;
    }
  } else {
    back.hidden = false;
    const s = stateOf(f), lockedTxt = (() => { const k = daysUntil(f); return k === 1 ? 'Se abre mañana' : `Se abre en ${k} días`; })();
    info.innerHTML = `<b>${f === 24 ? 'Nochebuena' : `Día ${f}`}</b><span>${s === 'opened' ? 'Abierto · ' + esc(D[f]?.titulo || '') : s === 'available' ? `${dateLabel(f)} · lista para abrir` : lockedTxt}</span>`;
    act.hidden = false; act.dataset.d = f;
    act.querySelector('span').textContent = s === 'opened' ? 'Otra vez' : s === 'available' ? 'Abrir' : 'Aún no';
    act.classList.toggle('locked', s === 'locked');
  }
  strip.querySelectorAll('.tab').forEach(b => b.classList.toggle('focus', +b.dataset.d === f));
}

function scrollStripTo(d, smooth = true) {
  const b = strip.querySelector(`[data-d="${d}"]`); if (!b) return;
  const li = b.parentElement, box = strip.getBoundingClientRect(), r = li.getBoundingClientRect();
  strip.scrollTo({ left: strip.scrollLeft + r.left - box.left - box.width / 2 + r.width / 2, behavior: smooth && !REDUCE ? 'smooth' : 'auto' });
}

let toastT;
function toast(msg, ms = 3400) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- foco, apertura, cierre ---------- */
let busy = false, current = null, cleanup = null;   // current: día con la hoja abierta (0 es un día válido)

async function focusDay(d) {
  if (!stage || busy || current != null) return;
  Sound.tap(); haptic(8);
  scrollStripTo(d);
  const p = stage.focus(d, 1250);
  dock();
  await p;
}
async function toOverview() {
  if (!stage || busy || current != null) return;
  Sound.tap();
  const p = stage.overview(1300);
  dock();
  await p;
}

function tease(d) {
  stage.tease(d);
  Sound.nope(); setTimeout(() => Sound.clink(), 200);
  haptic([25, 40, 25]);
  const n = daysUntil(d);
  toast(fmt(pick(C.burlas), { faltan: n === 1 ? '1 día' : n + ' días', dia: d, nombre: C.nombre }));
}

async function openDay(d) {
  Sound.init();
  if (!stage || busy || current != null) return;
  if (stage.focused !== d) { await focusDay(d); }
  if (!openable(d)) return tease(d);
  busy = true; haptic(12);
  const first = !S.opened.includes(d);
  Sound.open();
  if (d === 24 && first) { FX.fireworks(4800); await wait(REDUCE ? 300 : 1800); }
  const veil = $('#veil');
  const doorP = stage.openDoor(d);
  setTimeout(() => { veil.classList.add('on'); Sound.whoosh(); }, REDUCE ? 0 : 700);
  await doorP;
  await wait(REDUCE ? 50 : 200);
  if (first) { S.opened.push(d); freshDays.add(d); save(); }
  openSheet(d);
  busy = false;
}

function markDone(d) {
  if (!S.done.includes(d)) S.done.push(d);
  const day = D[d] || {};
  if (day.vale && !S.vales[d]) { S.vales[d] = { usado: false }; setTimeout(() => toast('Guardado en «Mis vales»'), 1400); }
  save(); refresh();
}

const card = $('#card'), sheet = $('#sheet');
function shakeCard() { card.classList.remove('shake-x'); void card.offsetWidth; card.classList.add('shake-x'); haptic(30); }

function openSheet(d) {
  const day = motesDeep(D[d] || { tipo: 'carta', titulo: 'Muy pronto…', texto: 'Esta puerta todavía está en obras. Vuelve más tarde.' });
  current = d;
  $('#cardDay').textContent = dateLabel(d);
  $('#cardNum').textContent = d;
  $('#cardTitle').textContent = day.titulo || '';
  const body = $('#cardBody'); body.innerHTML = ''; body.className = 't-' + day.tipo;
  $('#cardScroll').scrollTop = 0;
  card.style.transform = '';
  sheet.hidden = false; document.body.classList.add('noscroll');
  // tras cruzar la puerta la cámara retrocede: detrás de la hoja queda el pueblo, no la luz
  stage.focus(d, REDUCE ? 1 : 900);
  setTimeout(() => { if (current === d) stage.pause(true); }, REDUCE ? 50 : 1000);
  const api = {
    day: d, seen: S.done.includes(d), adorno: S.adorno, reduce: REDUCE,
    done: () => markDone(d), toast, shake: shakeCard, haptic,
    saveAdorno(url) { S.adorno = url; save(); stage.setAdorno(url); },
  };
  try { cleanup = (Days[day.tipo] || Days.carta)(day, body, api) || null; }
  catch (e) { console.error(e); body.textContent = 'Esta puerta se ha atascado. Avísame.'; }
  requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('show')));
  setTimeout(() => $('#veil').classList.remove('on'), 120);
}

async function closeSheet() {
  if (current == null) return;
  const d = current; current = null;
  if (cleanup) { try { cleanup(); } catch (e) { /* nada */ } cleanup = null; }
  stage.pause(false);
  sheet.classList.remove('show'); card.style.transform = ''; sheet.querySelector('.sheet-bg').style.opacity = '';
  $('#veil').classList.remove('on');
  Sound.whoosh();
  stage.closeDoor(d);
  const back = stage.focus(d, REDUCE ? 1 : 1100);
  await wait(REDUCE ? 50 : 360);
  sheet.hidden = true; document.body.classList.remove('noscroll');
  if (freshDays.has(d)) stage.prepareIntro([d]);
  refresh();
  await back;
  if (freshDays.has(d)) {
    freshDays.delete(d);
    if (d === maxOpened()) await stage.growPath(d);
    stage.powerOn(d, true);
    Sound.twinkle(); haptic(15);
    const p = stage.screenOf(d); if (p) FX.burst(p[0], p[1], 'sparkle', 60);
    if (litCount() === 24 && d >= 1) { FX.fireworks(5200); toast(`Has encendido el pueblo entero, ${C.nombre}`, 5200); }
  }
}
const freshDays = new Set();

/* ---------- hoja arrastrable en móvil ---------- */
function draggable(handle, panel, bg, onClose) {
  const isSheet = () => matchMedia('(max-width: 720px)').matches;
  let st = null;
  handle.addEventListener('pointerdown', e => {
    if (!isSheet() || st || e.target.closest('button')) return;
    st = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0, h: panel.offsetHeight };
    handle.setPointerCapture(e.pointerId);
    panel.style.transition = 'none'; bg.style.transition = 'none';
  });
  handle.addEventListener('pointermove', e => {
    if (!st || e.pointerId !== st.id) return;
    let dy = e.clientY - st.y0;
    if (dy < 0) dy = -Math.pow(-dy, .6);
    st.dy = dy;
    panel.style.transform = `translateY(${dy}px)`;
    bg.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / st.h));
  });
  const end = e => {
    if (!st || e.pointerId !== st.id) return;
    const { dy, t0, h } = st, v = dy / (performance.now() - t0);
    st = null;
    panel.style.transition = ''; bg.style.transition = '';
    if (dy > h * .3 || (v > .11 && dy > 12)) { bg.style.opacity = ''; onClose(); }
    else { panel.style.transform = ''; bg.style.opacity = ''; }
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}
draggable($('#cardGrab'), card, sheet.querySelector('.sheet-bg'), closeSheet);
$('#cardClose').addEventListener('click', closeSheet);

/* ---------- inclinación 3D de las piezas de papel (solo ratón) ---------- */
let tiltEl = null, tgt = { rx: 0, ry: 0 }, cur = { rx: 0, ry: 0 };
if (FINE && !REDUCE) {
  card.addEventListener('pointermove', e => {
    const el = e.buttons ? null : e.target.closest('[data-tilt]');
    if (tiltEl && tiltEl !== el) releaseTilt();
    if (!el) return;
    tiltEl = el;
    const b = el.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    tgt = { rx: (.5 - py) * 9, ry: (px - .5) * 11 };
    el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    el.classList.add('tilting');
  });
  card.addEventListener('pointerleave', releaseTilt);
  card.addEventListener('pointerdown', releaseTilt);
  (function tiltLoop() {
    requestAnimationFrame(tiltLoop);
    if (!tiltEl) return;
    cur.rx += (tgt.rx - cur.rx) * .14; cur.ry += (tgt.ry - cur.ry) * .14;
    tiltEl.style.transform = `perspective(900px) rotateX(${cur.rx.toFixed(2)}deg) rotateY(${cur.ry.toFixed(2)}deg)`;
    if (!tiltEl.classList.contains('tilting') && Math.abs(cur.rx) < .02 && Math.abs(cur.ry) < .02) { tiltEl.style.transform = ''; tiltEl = null; cur = { rx: 0, ry: 0 }; }
  })();
}
function releaseTilt() { tgt = { rx: 0, ry: 0 }; if (tiltEl) tiltEl.classList.remove('tilting'); }

/* ---------- pestaña de la puerta: se tira con el dedo y la puerta gira con él ---------- */
const doorTab = $('#doorTab');
let tabDay = null, tabDrag = null;
function placeDoorTab() {
  requestAnimationFrame(placeDoorTab);
  const f = stage ? stage.focused : null, show = f != null && f !== 24 && current == null && !busy && document.body.classList.contains('in');
  if (!show) { if (!doorTab.hidden) doorTab.hidden = true; tabDay = null; return; }
  const a = stage.doorAnchor(f);
  if (!a) { doorTab.hidden = true; return; }
  tabDay = f;
  doorTab.dataset.state = stateOf(f);
  if (doorTab.hidden) doorTab.hidden = false;
  if (!tabDrag) doorTab.style.transform = `translate(${a[0]}px, ${a[1]}px)`;
}
doorTab.addEventListener('pointerdown', e => {
  if (tabDay == null || busy) return;
  Sound.init();
  const tr = []; tr.push([performance.now(), e.clientX]);
  tabDrag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, d: tabDay, f: 0, tr, base: doorTab.style.transform };
  doorTab.setPointerCapture(e.pointerId); doorTab.classList.add('held');
});
doorTab.addEventListener('pointermove', e => {
  if (!tabDrag || e.pointerId !== tabDrag.id) return;
  const dx = Math.max(0, e.clientX - tabDrag.x0), locked = !openable(tabDrag.d);
  tabDrag.tr.push([performance.now(), e.clientX]); if (tabDrag.tr.length > 6) tabDrag.tr.shift();
  const f = locked ? Math.min(.06, dx / 600) : Math.min(1, dx / 130);
  tabDrag.f = f;
  stage.setDoor(tabDrag.d, f, true);
  doorTab.style.transform = tabDrag.base + ` translate(${locked ? Math.min(dx, 14) : dx}px, 0)`;
  if (locked && dx > 12 && !tabDrag.rattled) { tabDrag.rattled = true; Sound.clink(); haptic(15); }
});
const tabEnd = e => {
  if (!tabDrag || e.pointerId !== tabDrag.id) return;
  const { d, f, tr, x0 } = tabDrag, a = tr[0], b = tr[tr.length - 1], v = (b[1] - a[1]) / Math.max(1, b[0] - a[0]);
  const moved = Math.abs(b[1] - x0) > 6;
  tabDrag = null; doorTab.classList.remove('held');
  if (!openable(d)) { stage.setDoor(d, 0); tease(d); return; }
  if (!moved || f > .38 || v > .45) openDay(d);
  else stage.setDoor(d, 0);
};
doorTab.addEventListener('pointerup', tabEnd); doorTab.addEventListener('pointercancel', tabEnd);
doorTab.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && tabDay != null) { e.preventDefault(); openDay(tabDay); } });

/* ---------- controles ---------- */
$('#fbOpen').addEventListener('click', e => openDay(+e.currentTarget.dataset.d));
$('#fbBack').addEventListener('click', toOverview);
strip.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) focusDay(+b.dataset.d); });
$('#btnSound').addEventListener('click', () => { Sound.init(); S.muted = !S.muted; Sound.setMuted(S.muted); save(); refresh(); });
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (current != null) closeSheet(); else if (!wallet.hidden) closeWallet(); else if (stage && stage.focused != null) toOverview(); }
});

/* ---------- Mis vales ---------- */
const wallet = $('#wallet'), wcard = wallet.querySelector('.wallet-card');
function renderWallet() {
  const ids = Object.keys(S.vales).map(Number).sort((a, b) => a - b);
  $('#walletList').innerHTML = ids.map(d => {
    const v = S.vales[d], day = D[d] || {};
    return `<li class="wv${v.usado ? ' used' : ''}" data-d="${d}"><span class="wv-num">${d}</span>
      <div><b>${esc(day.vale)}</b><small>${v.usado ? `Canjeado el ${esc(v.fecha)}` : `Día ${d} · sin caducidad`}</small></div>
      <button class="wv-btn"${v.usado ? ' disabled' : ''}>${v.usado ? 'Canjeado' : 'Canjear'}</button><span class="wv-stamp">CANJEADO</span></li>`;
  }).join('') || '<li class="empty">Aún no tienes vales. Sigue abriendo puertas.</li>';
}
$('#walletList').addEventListener('click', e => {
  const btn = e.target.closest('.wv-btn'); if (!btn) return;
  const li = btn.closest('.wv'), d = +li.dataset.d;
  if (!btn.classList.contains('confirm')) {
    btn.classList.add('confirm'); btn.textContent = '¿Seguro?'; Sound.tap();
    setTimeout(() => { if (btn.isConnected && !li.classList.contains('used')) { btn.classList.remove('confirm'); btn.textContent = 'Canjear'; } }, 3000);
    return;
  }
  S.vales[d] = { usado: true, fecha: now().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) };
  save(); refresh();
  li.classList.add('used'); btn.textContent = 'Canjeado'; btn.disabled = true;
  Sound.stamp(); haptic(20);
  li.querySelector('small').textContent = `Canjeado el ${S.vales[d].fecha}`;
  toast('Vale canjeado. Me toca cumplir.');
});
function openWallet() {
  Sound.tap(); renderWallet(); wcard.style.transform = '';
  wallet.hidden = false; document.body.classList.add('noscroll');
  requestAnimationFrame(() => requestAnimationFrame(() => wallet.classList.add('show')));
}
async function closeWallet() {
  if (wallet.hidden || !wallet.classList.contains('show')) return;
  wallet.classList.remove('show'); wcard.style.transform = '';
  await wait(REDUCE ? 50 : 320);
  wallet.hidden = true; if (current == null) document.body.classList.remove('noscroll');
}
$('#btnVales').addEventListener('click', openWallet);
$('#walletClose').addEventListener('click', closeWallet);
wallet.querySelector('.sheet-bg').addEventListener('click', closeWallet);
draggable(wallet.querySelector('.grab'), wcard, wallet.querySelector('.sheet-bg'), closeWallet);

/* ---------- modo pruebas ---------- */
if (DEV) {
  $('#dev').hidden = false;
  $('#devInfo').textContent = FAKE ? `Fecha simulada: ${FAKE.toLocaleDateString('es-ES')}` : 'Todo desbloqueado';
  $('#devReset').addEventListener('click', () => { try { localStorage.removeItem(KEY); } catch (e) { /* nada */ } location.reload(); });
  $('#devAll').addEventListener('click', () => { for (let d = 0; d <= 24; d++) if (!S.opened.includes(d)) S.opened.push(d); save(); refresh(); stage.growPath(24); for (let d = 0; d <= 24; d++) stage.powerOn(d, false); });
}

/* ---------- inclinación del móvil / ratón → paralaje del escenario ---------- */
function askMotion() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') DOE.requestPermission().catch(() => {});
  const DME = window.DeviceMotionEvent;
  if (DME && typeof DME.requestPermission === 'function') DME.requestPermission().catch(() => {});
}
// agitar el móvil agita la bola de nieve
let lastShake = 0;
let lastG = null;
addEventListener('devicemotion', e => {
  // sin gravedad si el móvil la da; si no, el tirón entre dos lecturas con gravedad
  const a = e.acceleration, g = e.accelerationIncludingGravity, now = performance.now();
  let m = a && a.x != null ? Math.hypot(a.x, a.y, a.z) : 0;
  if (g && g.x != null) { if (lastG) m = Math.max(m, Math.hypot(g.x - lastG.x, g.y - lastG.y, g.z - lastG.z) * .8); lastG = { x: g.x, y: g.y, z: g.z }; }
  if (stage && m > 9 && now - lastShake > 200) { lastShake = now; stage.shake(Math.min(1.6, m / 12)); haptic(8); }
});
addEventListener('deviceorientation', e => { if (stage && e.gamma != null) stage.setTilt(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, ((e.beta || 45) - 45) / 30))); });
if (FINE) addEventListener('pointermove', e => { if (stage && e.pointerType === 'mouse') stage.setTilt((e.clientX / innerWidth - .5) * 2, (e.clientY / innerHeight - .5) * 2); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (stage && current == null) stage.pause(document.hidden); });

/* ---------- telón: pregunta, cordón y apertura ---------- */
async function raiseCurtain() {
  const ui = $('#curtainUI');
  if (ui.classList.contains('going')) return;
  ui.classList.add('going');
  Sound.init(); askMotion();
  Sound.setMuted(S.muted); Sound.music(); Sound.swell(); Sound.jingle();
  haptic([10, 30, 10]);
  const list = S.opened.slice().sort((a, b) => a - b);
  stage.prepareIntro(list);
  // el título sube a la tramoya y después se recoge el telón
  stage.titleOut(REDUCE ? 1 : 1000);
  await wait(REDUCE ? 0 : 380);
  const curtainP = stage.curtainTo(1, 1900);
  // primero la bola entera flotando en la noche; después la cámara baja al pueblo
  stage.reveal(REDUCE ? 1 : 2400);
  await wait(REDUCE ? 0 : 1500);
  stage.shake(.8);
  const camP = stage.overview(REDUCE ? 1 : 2900);
  document.body.classList.add('in');
  stage.setInteractive(true);
  await wait(REDUCE ? 0 : 1300);
  // las casas ya abiertas se encienden en ola (retrasos que se acortan)
  list.forEach((d, i) => setTimeout(() => stage.powerOn(d, false), REDUCE ? 0 : Math.round(900 * Math.sqrt(i / Math.max(1, list.length - 1)))));
  if (list.length) Sound.twinkle();
  stage.growPath(maxOpened(), REDUCE ? 1 : Math.min(2400, 600 + Math.max(0, maxOpened()) * 110));
  await Promise.all([curtainP, camP]);
  ui.hidden = true;
  const t = today();
  if (t >= 0 && t <= 24) { scrollStripTo(t, false); stage.pulse(t); if (stateOf(t) === 'available') toast(`Hoy toca la puerta ${t}`); }
  if (!S.girado) { S.girado = true; save(); setTimeout(() => toast('Gira el pueblo con el dedo. Agita el móvil y nevará', 4200), 3200); }
  dock();
}

/* ---------- taco de calendario: tres hojas que se pasan con el dedo ---------- */
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function tearCalendar(root) {
  const now = new Date(), v = { d: now.getDate(), m: now.getMonth() + 1, y: now.getFullYear() };
  const lim = { d: [1, 31], m: [1, 12], y: [C.anio - 25, C.anio] };
  const days = () => new Date(v.y, v.m, 0).getDate();
  const label = k => k === 'm' ? MESES[v.m - 1] : String(v[k]);
  const els = {};
  root.querySelectorAll('.tear').forEach(t => { els[t.dataset.k] = { t, body: t.querySelector('.tear-body'), val: t.querySelector('.tear-v') }; });
  const paint = k => {
    const e = els[k]; e.val.textContent = label(k);
    e.body.setAttribute('aria-valuenow', v[k]);
    e.body.setAttribute('aria-valuetext', k === 'm' ? MESES_L[v.m - 1] : String(v[k]));
  };
  // la hoja de antes sale volando por la anilla (hacia arriba si avanzas, hacia abajo si retrocedes)
  const flip = (k, old, dir) => {
    if (REDUCE) return;
    const leaf = document.createElement('b'); leaf.className = 'tear-leaf ' + (dir > 0 ? 'up' : 'down'); leaf.textContent = old;
    els[k].body.appendChild(leaf); leaf.addEventListener('animationend', () => leaf.remove());
  };
  const step = (k, dir) => {
    const old = label(k), [a, b] = k === 'd' ? [1, days()] : lim[k];
    const n = v[k] + dir; if (n < a || n > b) { els[k].body.classList.remove('edge'); void els[k].body.offsetWidth; els[k].body.classList.add('edge'); return false; }
    v[k] = n;
    if (k !== 'd' && v.d > days()) { const od = label('d'); v.d = days(); flip('d', od, -1); paint('d'); }
    flip(k, old, dir); paint(k);
    Sound.tap(); haptic(4);
    return true;
  };
  Object.entries(els).forEach(([k, { body }]) => {
    paint(k);
    let st = null;
    body.addEventListener('pointerdown', e => { Sound.init(); st = { id: e.pointerId, y: e.clientY, acc: 0 }; body.setPointerCapture(e.pointerId); body.classList.add('held'); });
    body.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      st.acc += st.y - e.clientY; st.y = e.clientY;
      while (Math.abs(st.acc) >= 26) { const dir = Math.sign(st.acc); st.acc -= dir * 26; step(k, dir); }
      body.style.setProperty('--tilt', (st.acc / 26) * -12 + 'deg');
    });
    const end = e => {
      if (!st || e.pointerId !== st.id) return;
      st = null; body.classList.remove('held'); body.style.removeProperty('--tilt');
    };
    body.addEventListener('pointerup', end); body.addEventListener('pointercancel', end);
    body.addEventListener('wheel', e => { e.preventDefault(); step(k, e.deltaY < 0 ? 1 : -1); }, { passive: false });
    body.addEventListener('keydown', e => {
      const dir = e.key === 'ArrowUp' ? 1 : e.key === 'ArrowDown' ? -1 : e.key === 'PageUp' ? 5 : e.key === 'PageDown' ? -5 : 0;
      if (dir) { e.preventDefault(); for (let i = 0; i < Math.abs(dir); i++) step(k, Math.sign(dir)); }
    });
  });
  return { get: () => ({ ...v }) };
}

function curtainGate() {
  const form = $('#playbill'), cord = $('#cord');
  $('#gateQ').textContent = C.pregunta;
  if (!S.entered) { form.hidden = false; }
  else cord.hidden = false;

  const date = tearCalendar(form.querySelector('.datepick'));
  const [cy, cm, cd] = String(C.conocimos || '').split('-').map(Number);
  let fails = 0;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    Sound.init(); askMotion();
    const v = date.get();
    if (v.y === cy && v.m === cm && v.d === cd) {
      S.entered = true; save();
      form.classList.add('bye');
      Sound.tada(); haptic([15, 30, 15]);
      FX.burst(innerWidth / 2, innerHeight * .55, 'hearts', 26); FX.burst(innerWidth / 2, innerHeight * .55, 'confetti', 110);
      await wait(REDUCE ? 50 : 600);
      raiseCurtain();
    } else {
      fails++;
      Sound.nope(); haptic([30, 40, 30]);
      form.classList.remove('shake-x'); void form.offsetWidth; form.classList.add('shake-x');
      const near = conMotes(v.y !== cy ? pick(['¿Seguro que estabas allí?', 'Ni el año, {picar}.', 'Respuesta de impostora.'])
        : v.m !== cm ? 'El año sí. El mes, ni de cerca.' : 'Casi, {picar}. Te bailan los días.');
      $('#gateMsg').textContent = fails >= 3 ? near + ' Pista: ' + C.pistaLogin : near;
    }
  });

  // Cordón: sigue al dedo 1:1; se suelta por distancia o por tirón
  let st = null;
  const knot = cord.querySelector('.knot');
  cord.addEventListener('pointerdown', e => { Sound.init(); st = { id: e.pointerId, y0: e.clientY, t0: performance.now(), dy: 0 }; cord.setPointerCapture(e.pointerId); knot.style.transition = 'none'; });
  cord.addEventListener('pointermove', e => {
    if (!st || e.pointerId !== st.id) return;
    let dy = e.clientY - st.y0; dy = dy < 0 ? -Math.pow(-dy, .5) : dy > 120 ? 120 + Math.pow(dy - 120, .6) : dy;
    st.dy = dy; knot.style.transform = `translateY(${dy}px)`;
  });
  const end = e => {
    if (!st || e.pointerId !== st.id) return;
    const { dy, t0 } = st, v = dy / (performance.now() - t0); st = null;
    knot.style.transition = ''; knot.style.transform = '';
    if (dy > 70 || (v > .35 && dy > 16) || Math.abs(dy) < 4) raiseCurtain();
  };
  cord.addEventListener('pointerup', end); cord.addEventListener('pointercancel', end);
  cord.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); raiseCurtain(); } });
}

/* ---------- arranque ---------- */
async function boot() {
  try { await Promise.race([Promise.all([document.fonts.load('800 64px "Bricolage Grotesque Variable"'), document.fonts.load('italic 400 64px "Instrument Serif"')]), wait(1800)]); } catch (e) { /* nada */ }
  stage = createStage($('#stage'), { reduce: REDUCE, name: C.nombre });
  stage.start();
  const insets = () => stage.setInsets($('#top').offsetHeight + 4, $('#dock').offsetHeight + 6);
  insets(); addEventListener('resize', insets);
  stage.introPose();
  stage.setLitInstant(0);
  stage.setAdorno(S.adorno);
  stage.onPick(d => {
    if (current != null || busy) return;
    if (d == null) { if (stage.focused != null) toOverview(); return; }
    if (stage.focused === d) openDay(d); else focusDay(d);
  });
  refresh();
  Sound.setMuted(S.muted);
  document.body.classList.add('ready');
  placeDoorTab();
  if (DEV && qs.has('saltar')) {
    S.entered = true;
    await raiseCurtain();
    const n = +qs.get('abrir');
    if (qs.has('abrir') && n >= 0 && n <= 24) { await focusDay(n); openDay(n); }
  } else curtainGate();
}
boot();
