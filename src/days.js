/* Cada tipo de día: (day, body, api) => cleanup opcional
   api = { day, seen, reduce, done(), toast(msg), shake(), haptic(p), saveAdorno(url), adorno } */
window.Days = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const br = s => esc(s).replace(/\n/g, '<br>');
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const centerOf = el => { const b = el.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
  const shake = el => { el.classList.remove('shake-x'); void el.offsetWidth; el.classList.add('shake-x'); };
  const EASE_OUT = 'cubic-bezier(.23,1,.32,1)', BACK = 'cubic-bezier(.34,1.56,.64,1)';
  const FALLOS = ['Frío, frío…', 'Mmm, no. Piensa como yo.', 'Ni de lejos, {picar}', 'Casi… (mentira, nada que ver)'];

  /* Velocidad a partir de las últimas muestras del puntero (px/ms) */
  const tracker = () => {
    const s = [];
    return {
      add(x, y) { s.push([performance.now(), x, y]); if (s.length > 6) s.shift(); },
      v() { if (s.length < 2) return [0, 0]; const a = s[0], b = s[s.length - 1], dt = Math.max(1, b[0] - a[0]); return [(b[1] - a[1]) / dt, (b[2] - a[2]) / dt]; },
    };
  };

  function typewrite(el, text, onDone, onLine) {
    let i = 0, stopped = false, finished = false, timer;
    const node = document.createTextNode(''), caret = document.createElement('span');
    const speed = text.length > 900 ? 22 : 32;
    caret.className = 'caret'; el.textContent = ''; el.append(node, caret);
    const end = () => { if (finished) return; finished = true; caret.remove(); onDone && onDone(); };
    function step() {
      if (stopped) return;
      if (i >= text.length) return end();
      const ch = text[i++];
      node.data += ch;
      if (ch.trim()) Sound.key();
      let d = speed * (.6 + Math.random() * .9);
      if (/[.,;:!?…]/.test(ch)) d += speed * 6;
      if (ch === '\n') {
        d += speed * 8;
        if (text[i] === '\n') { Sound.ding(); onLine && onLine(); }
        caret.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      timer = setTimeout(step, d);
    }
    step();
    return {
      skip() { stopped = true; clearTimeout(timer); node.data = text; end(); },
      stop() { stopped = true; clearTimeout(timer); },
    };
  }

  /* ✉️ Carta: sello que se rompe → solapa → la carta sale → se despliega y se escribe sola */
  function carta(day, body, api) {
    body.innerHTML = `
      <div class="env-wrap">
        <div class="envelope" role="button" tabindex="0" aria-label="Abrir carta">
          <div class="env-back"></div>
          <div class="env-paper"><i></i><i></i><i></i></div>
          <div class="env-front"></div>
          <div class="env-flap"></div>
          <div class="env-seal"><span class="half l"></span><span class="half r"></span><b>${esc(CONFIG.nombre[0])}</b></div>
        </div>
        <p class="hint">Toca el sobre para abrirlo</p>
      </div>
      <div class="letter" hidden>
        <div class="typed"></div>
        <div class="sign">${esc(day.firma || CONFIG.firma)}<svg viewBox="0 0 40 36" class="heart" aria-hidden="true"><path d="M20 33C8 24 2 17 2 10.5 2 5.5 6 2 10.5 2c4 0 7 2.5 9.5 6 2.5-3.5 5.5-6 9.5-6C34 2 38 5.5 38 10.5 38 17 32 24 20 33z"/></svg></div>
        <p class="hint skip">Toca la carta para leerla de golpe</p>
      </div>`;
    const wrap = body.querySelector('.env-wrap'), env = body.querySelector('.envelope'), letter = body.querySelector('.letter');
    const typed = letter.querySelector('.typed'), sign = letter.querySelector('.sign');
    let tw = null, gone = false;
    const finish = () => { sign.classList.add('show'); letter.querySelector('.skip')?.remove(); api.done(); };
    const jolt = () => { if (!api.reduce) letter.animate([{ transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 200, easing: EASE_OUT }); };
    function showLetter() { wrap.remove(); letter.hidden = false; letter.classList.add('unfold'); }
    async function start() {
      if (env.classList.contains('s1')) return;
      env.classList.add('s1'); Sound.pop(); api.haptic(10);
      await wait(api.reduce ? 0 : 240); if (gone) return;
      env.classList.add('s2'); Sound.paper();
      await wait(api.reduce ? 0 : 480); if (gone) return;
      env.classList.add('s3');
      await wait(api.reduce ? 0 : 520); if (gone) return;
      env.classList.add('s4');
      await wait(api.reduce ? 0 : 260); if (gone) return;
      showLetter();
      await wait(api.reduce ? 0 : 450); if (gone) return;
      tw = typewrite(typed, day.texto, finish, jolt);
      letter.addEventListener('click', () => tw && tw.skip(), { once: true });
    }
    if (api.seen) { showLetter(); typed.textContent = day.texto; finish(); }
    else {
      env.addEventListener('click', start);
      env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
    }
    return () => { gone = true; tw && tw.stop(); };
  }

  /* 🎟️ Rasca y gana con polvo plateado */
  function rasca(day, body, api) {
    body.innerHTML = `
      <div class="scratch" data-tilt>
        <div class="voucher">
          <div class="v-text">Vale por ${esc(String(day.vale || '').charAt(0).toLowerCase() + String(day.vale || '').slice(1))}</div>
          ${day.detalle ? `<div class="v-detail">${esc(day.detalle)}</div>` : ''}
          <div class="v-foot"><span>Nº ${String(api.day).padStart(3, '0')}</span><span>Caduca: nunca</span></div>
          <div class="v-stamp">VÁLIDO</div>
        </div>
        <canvas></canvas>
      </div>
      <p class="hint">Rasca con el dedo</p>`;
    const box = body.querySelector('.scratch'), cv = box.querySelector('canvas'), v = box.querySelector('.voucher'), hint = body.querySelector('.hint');
    if (api.seen) { cv.remove(); box.classList.add('won'); hint.textContent = 'Guardado en Mis vales'; return; }
    const g = cv.getContext('2d');
    let w = 0, h = 0, down = false, last = null, moves = 0, lastSnd = 0, lastDust = 0, revealed = false;
    function paint() {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = box.clientWidth; h = box.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, '#c3c7d3'); gr.addColorStop(.5, '#eef0f5'); gr.addColorStop(1, '#aeb3c2');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .6})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '18px serif';
      for (let i = 0; i < 12; i++) g.fillText('❄', Math.random() * w, Math.random() * h);
      g.fillStyle = 'rgba(70,76,100,.6)';
      try { g.fontStretch = 'condensed'; } catch (e) { /* nada */ }
      g.font = '800 30px "Bricolage Grotesque Variable", sans-serif'; g.fillText('RASCA AQUÍ', w / 2, h / 2 - 12);
      try { g.fontStretch = 'normal'; } catch (e) { /* nada */ }
      g.font = '500 20px "Bricolage Grotesque Variable", sans-serif'; g.fillText('con cariño (y con uñas)', w / 2, h / 2 + 20);
    }
    requestAnimationFrame(paint);
    const pt = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * w / b.width, (e.clientY - b.top) * h / b.height]; };
    function scratch(p, e) {
      g.globalCompositeOperation = 'destination-out'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = 38;
      g.beginPath(); g.moveTo(...(last || [p[0] - .1, p[1]])); g.lineTo(...p); g.stroke();
      last = p;
      const t = performance.now();
      if (t - lastSnd > 60) { Sound.scratch(); lastSnd = t; }
      if (t - lastDust > 30) { lastDust = t; FX.burst(e.clientX, e.clientY, 'dust', 3); }
      if (++moves % 10 === 0) check();
    }
    function check() {
      const data = g.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, tot = 0;
      for (let i = 3; i < data.length; i += 4 * 23) { tot++; if (data[i] < 128) clear++; }
      if (clear / tot > .5) reveal();
    }
    function reveal() {
      if (revealed) return; revealed = true;
      cv.classList.add('gone'); box.classList.add('won');
      hint.textContent = 'Guardado en Mis vales';
      Sound.tada(); api.haptic([15, 30, 15]);
      const [x, y] = centerOf(v); FX.burst(x, y, 'confetti', 130); FX.burst(x, y, 'sparkle', 40);
      api.done(); setTimeout(() => cv.remove(), 800);
    }
    cv.addEventListener('pointerdown', e => { down = true; last = null; cv.setPointerCapture(e.pointerId); scratch(pt(e), e); });
    cv.addEventListener('pointermove', e => { if (down && !revealed) scratch(pt(e), e); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { down = false; last = null; }));
  }

  /* 📸 Polaroids: se arrastran 1:1 y se lanzan según la velocidad del dedo */
  function fotos(day, body, api) {
    const list = (day.fotos && day.fotos.length) ? day.fotos : [{ src: 'assets/fotos/01.jpg', texto: 'Tu foto aquí' }];
    body.innerHTML = `${day.texto ? `<p class="intro">${br(day.texto)}</p>` : ''}<div class="polaroids"></div><p class="hint"><span class="count"></span> · desliza o toca</p>`;
    const stack = body.querySelector('.polaroids'), count = body.querySelector('.count');
    const cards = list.map(p => {
      const el = document.createElement('figure');
      el.className = 'polaroid';
      el.style.setProperty('--rot', (Math.random() * 10 - 5).toFixed(1) + 'deg');
      const isVid = /\.(mp4|webm|mov)$/i.test(p.src);
      el.innerHTML = (isVid ? `<video src="${esc(p.src)}" muted loop playsinline autoplay></video>` : `<img src="${esc(p.src)}" alt="" draggable="false">`) + `<figcaption>${esc(p.texto || '')}</figcaption>`;
      const m = el.firstElementChild;
      m.addEventListener('error', () => { const ph = document.createElement('div'); ph.className = 'ph'; ph.innerHTML = `Foto<small>${esc(p.src)}</small>`; m.replaceWith(ph); });
      stack.appendChild(el);
      return el;
    });
    let order = cards.map((_, i) => i), seen = 0, busy = false, drag = null;
    function layout() {
      order.forEach((ci, pos) => {
        const c = cards[ci];
        c.style.zIndex = cards.length - pos;
        c.style.setProperty('--dy', Math.min(pos, 3) * 5 + 'px');
        c.style.setProperty('--s', (1 - Math.min(pos, 3) * .035).toFixed(3));
      });
      count.textContent = `${(seen % cards.length) + 1} / ${cards.length}`;
    }
    function fling(el, dir, speed) {
      busy = true;
      const dur = Math.round(Math.max(220, Math.min(420, 420 - speed * 140)));
      el.style.transition = `transform ${dur}ms ${EASE_OUT}, opacity ${dur}ms ${EASE_OUT}`;
      el.style.transform = `translate(${dir * stack.offsetWidth * 1.3}px, -24px) rotate(${dir * 26}deg)`;
      el.style.opacity = '0';
      Sound.whoosh(); api.haptic(8);
      setTimeout(() => {
        el.style.transition = 'none'; el.style.transform = ''; el.style.opacity = '';
        order.push(order.shift()); seen++; layout();
        void el.offsetWidth; el.style.transition = '';
        busy = false;
      }, dur);
    }
    stack.addEventListener('pointerdown', e => {
      if (busy || drag || cards.length < 2) return;
      const el = cards[order[0]], tr = tracker(); tr.add(e.clientX, e.clientY);
      drag = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, tr };
      stack.setPointerCapture(e.pointerId);
      el.style.transition = 'none';
    });
    stack.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dx = e.clientX - drag.x0; const dy = e.clientY - drag.y0;
      drag.tr.add(e.clientX, e.clientY);
      drag.el.style.transform = `translate(${drag.dx}px, ${dy * .35}px) rotate(calc(var(--rot) + ${(drag.dx * .06).toFixed(2)}deg))`;
    });
    const up = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const { el, dx, tr } = drag, [vx] = tr.v(); drag = null;
      el.style.transition = '';
      if (Math.abs(dx) < 6) return fling(el, 1, 0);
      if (Math.abs(dx) > stack.offsetWidth * .35 || Math.abs(vx) > .4) return fling(el, Math.sign(Math.abs(vx) > .4 ? vx : dx), Math.abs(vx));
      el.style.transition = `transform 450ms ${BACK}`; el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 460);
    };
    stack.addEventListener('pointerup', up);
    stack.addEventListener('pointercancel', up);
    layout(); api.done();
  }

  /* ❓ Quiz con progreso y onda desde el punto de toque */
  function quiz(day, body, api) {
    const qs = day.preguntas || []; let i = 0, score = 0;
    function render() {
      if (i >= qs.length) return end();
      const q = qs[i];
      body.innerHTML = `<div class="quiz"><div class="dots" aria-label="Pregunta ${i + 1} de ${qs.length}">${qs.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''}"></i>`).join('')}</div>
        <h3 class="q">${esc(q.p)}</h3>
        <div class="opts">${q.opciones.map((o, k) => `<button class="opt" data-k="${k}" style="--i:${k}">${esc(o)}</button>`).join('')}</div>
        <p class="q-feedback" aria-live="polite"></p><button class="btn q-next" hidden>${i + 1 < qs.length ? 'Siguiente →' : 'Ver resultado'}</button></div>`;
      body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', e => {
        const k = +b.dataset.k, ok = k === q.correcta, r = b.getBoundingClientRect();
        b.style.setProperty('--x', (e.clientX - r.left) + 'px'); b.style.setProperty('--y', (e.clientY - r.top) + 'px');
        body.querySelectorAll('.opt').forEach(o => { o.disabled = true; });
        b.classList.add(ok ? 'right' : 'wrong', 'picked');
        body.querySelector(`[data-k="${q.correcta}"]`).classList.add('right');
        body.querySelector('.q-feedback').textContent = ok ? conMotes(q.si || pick(['¡Bien!', 'Correctísimo.', 'Eso es, {carino}.'])) : conMotes(q.no || pick(['Nop.', 'Ay, {picar}…', 'Fallo gordo']));
        if (ok) { score++; Sound.good(); api.haptic(12); FX.burst(e.clientX, e.clientY, 'sparkle', 40); } else { Sound.bad(); api.shake(); }
        const nb = body.querySelector('.q-next'); nb.hidden = false; nb.onclick = () => { i++; Sound.tap(); render(); };
      }));
    }
    function end() {
      const ratio = qs.length ? score / qs.length : 1, res = day.resultado || {};
      const msg = ratio >= .8 ? res.alto : ratio >= .5 ? res.medio : res.bajo;
      body.innerHTML = `<div class="quiz end"><p class="score"><span>0</span><small>/${qs.length}</small></p><h3 class="q">${esc(msg || '¡Hecho!')}</h3></div>`;
      const sp = body.querySelector('.score span'); let n = 0;
      const iv = setInterval(() => {
        if (n >= score) { clearInterval(iv); return; }
        sp.textContent = ++n; Sound.pop();
        sp.animate([{ transform: 'scale(1.25)' }, { transform: 'none' }], { duration: 260, easing: EASE_OUT });
      }, 190);
      setTimeout(() => { if (ratio >= .5) { Sound.tada(); const [x, y] = centerOf(sp); FX.burst(x, y, 'confetti', 120); } }, 190 * score + 200);
      api.done();
    }
    render();
  }

  /* 📜 Certificado con sello de lacre y onda de tinta */
  function certificado(day, body, api) {
    body.innerHTML = `<div class="cert${api.seen ? ' sealed' : ''}" data-tilt><div class="cert-in">
      <h3 class="c-title">Certificado Oficial</h3>
      <p class="c-small">Por la presente se reconoce a</p>
      <p class="c-name">${esc(day.otorgado || CONFIG.nombre)}</p>
      <p class="c-small">como</p>
      <p class="c-honor">${esc(day.honor)}</p>
      <p class="c-merit">${br(day.merito)}</p>
      <div class="c-foot"><div><span class="c-sig">${esc(CONFIG.firma)}</span><small>Presidente del Comité</small></div><div><span class="c-sig">${api.day} dic ${CONFIG.anio}</span><small>Fecha</small></div></div>
      <p class="c-issuer">Expedido por la ${esc(day.entidad || 'Real Academia de la Navidad')}</p>
      <div class="c-seal"><span>${esc(day.sello || 'OFICIAL')}</span></div>
    </div></div><p class="hint">${api.seen ? 'Documento oficial. Irrevocable.' : 'Toca el certificado para sellarlo'}</p>`;
    if (api.seen) return;
    const c = body.querySelector('.cert');
    c.addEventListener('click', async () => {
      if (c.classList.contains('sealed')) return;
      c.classList.add('sealed');
      await wait(api.reduce ? 0 : 340);
      Sound.stamp(); api.shake();
      const [x, y] = centerOf(c.querySelector('.c-seal')); FX.burst(x, y, 'sparkle', 60);
      body.querySelector('.hint').textContent = 'Documento oficial. Irrevocable.';
      api.done();
    });
  }

  /* 🎵 Vinilo: sale de la funda, el brazo baja y gira */
  function cancion(day, body, api) {
    const n = Object.keys(DAYS).filter(k => DAYS[k].tipo === 'cancion' && +k <= api.day).length;
    body.innerHTML = `<div class="record" style="--c:${esc(day.color || '#8e2c3a')}" data-tilt>
        <div class="vinyl"><div class="disc"><div class="label">${day.portada ? `<img src="${esc(day.portada)}" alt="">` : '♪'}</div></div></div>
        <div class="sleeve"><span>${n}</span><small>Playlist de Adviento</small></div>
        <div class="arm"><i></i></div>
      </div>
      <div class="song"><h3>${esc(day.cancion)}</h3><p class="artist">${esc(day.artista)}</p><p class="why">${br(day.motivo)}</p>
      ${day.enlace ? `<a class="btn" href="${esc(day.enlace)}" target="_blank" rel="noopener">▶ Escuchar</a>` : ''}</div>`;
    const rec = body.querySelector('.record');
    const t = setTimeout(() => { rec.classList.add('out'); Sound.whoosh(); }, api.reduce ? 0 : 420);
    api.done();
    return () => clearTimeout(t);
  }

  /* 🗝️ Pista para un regalo escondido */
  function pista(day, body, api) {
    const resp = (day.respuestas || []).map(norm).filter(Boolean);
    body.innerHTML = `<div class="parchment" data-tilt><p class="riddle">${br(day.acertijo)}</p></div>
      ${resp.length ? `<form class="guess"><input placeholder="¿Dónde crees que está?" autocomplete="off" autocapitalize="off" autocorrect="off" enterkeyhint="go"><button class="btn" type="submit">Probar</button></form>` : `<div class="center"><button class="btn reveal-btn">Revelar</button></div>`}
      <button class="link giveup" hidden>Me rindo</button>
      <div class="found" hidden><p>${br(day.revelado)}</p></div>`;
    const found = body.querySelector('.found'), form = body.querySelector('.guess'), give = body.querySelector('.giveup');
    const show = () => { form?.remove(); give.remove(); body.querySelector('.center')?.remove(); found.hidden = false; };
    if (api.seen) return show();
    const reveal = () => { show(); found.classList.add('pop'); Sound.tada(); api.haptic([15, 30, 15]); const [x, y] = centerOf(found); FX.burst(x, y, 'confetti', 100); api.done(); };
    let fails = 0;
    form?.addEventListener('submit', e => {
      e.preventDefault();
      const inp = form.querySelector('input'), v = norm(inp.value);
      if (!v) return;
      if (resp.some(r => v.includes(r))) return reveal();
      fails++; Sound.nope(); api.haptic([25, 40, 25]); shake(form); inp.value = ''; api.toast(conMotes(pick(FALLOS)));
      if (fails >= 2) give.hidden = false;
    });
    body.querySelector('.reveal-btn')?.addEventListener('click', reveal);
    give.addEventListener('click', reveal);
  }

  /* 🎬 Entrada: el resguardo sigue al dedo y se arranca por distancia o por tirón */
  function entrada(day, body, api) {
    body.innerHTML = `<div class="ticket${api.seen ? ' torn' : ''}" data-tilt>
        <div class="t-main">
          <div class="t-title">${esc(day.vale)}</div>
          <div class="t-grid"><div><small>Sala</small><b>${esc(day.evento || 'Cine')}</b></div><div><small>Fila</small><b>${esc(day.fila || '∞')}</b></div><div><small>Asiento</small><b>${esc(day.asiento || 'A mi lado')}</b></div><div><small>Cuándo</small><b>${esc(day.cuando || 'Tú eliges')}</b></div></div>
          ${day.detalle ? `<p class="t-detail">${esc(day.detalle)}</p>` : ''}
          <div class="t-stamp">VALIDADA</div>
        </div>
        <div class="t-stub"><span>ADMITE 2</span><b>${esc(day.numero || '№' + String(api.day).padStart(4, '0'))}</b><svg class="t-grip" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6l6 6-6 6M13 6l6 6-6 6"/></svg></div>
      </div><p class="hint">${api.seen ? 'Guardada en Mis vales' : 'Arrastra el resguardo hacia la derecha →'}</p>`;
    if (api.seen) return;
    const t = body.querySelector('.ticket'), stub = t.querySelector('.t-stub');
    let st = null, lastSnd = 0;
    stub.addEventListener('pointerdown', e => {
      if (st) return;
      const tr = tracker(); tr.add(e.clientX, 0);
      st = { id: e.pointerId, x0: e.clientX, dx: 0, tr };
      stub.setPointerCapture(e.pointerId); stub.style.transition = 'none';
    });
    stub.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      let dx = e.clientX - st.x0;
      if (dx < 0) dx = -Math.pow(-dx, .6);
      st.dx = dx; st.tr.add(e.clientX, 0);
      stub.style.transform = `translateX(${dx}px) rotate(${Math.max(0, dx) / 7}deg)`;
      const n = performance.now(); if (dx > 8 && n - lastSnd > 70) { Sound.scratch(); lastSnd = n; }
    });
    const up = e => {
      if (!st || e.pointerId !== st.id) return;
      const { dx, tr } = st, [vx] = tr.v(); st = null;
      stub.style.transition = '';
      if (dx > 70 || (vx > .4 && dx > 15)) { stub.style.transform = ''; tear(); }
      else { stub.style.transition = `transform 420ms ${BACK}`; stub.style.transform = ''; setTimeout(() => { stub.style.transition = ''; }, 430); }
    };
    stub.addEventListener('pointerup', up); stub.addEventListener('pointercancel', up);
    function tear() {
      t.classList.add('torn'); Sound.tear(); api.haptic([10, 20, 30]);
      setTimeout(() => { Sound.stamp(); const [x, y] = centerOf(t); FX.burst(x, y, 'confetti', 110); }, 350);
      body.querySelector('.hint').textContent = 'Validada. Guardada en Mis vales';
      api.done();
    }
  }

  /* 🎙️ Nota de voz */
  function audio(day, body, api) {
    body.innerHTML = `${day.texto ? `<p class="intro">${br(day.texto)}</p>` : ''}
      <div class="voice"><button class="v-play" aria-label="Reproducir">▶</button><div class="v-wave">${'<i></i>'.repeat(30)}</div><span class="v-time">0:00</span></div>
      <p class="v-msg" hidden></p>`;
    const a = new Audio(); a.preload = 'metadata'; a.src = day.src || '';
    const voice = body.querySelector('.voice'), btn = body.querySelector('.v-play'), bars = [...body.querySelectorAll('.v-wave i')], time = body.querySelector('.v-time'), msg = body.querySelector('.v-msg');
    const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    bars.forEach((b, i) => { b.style.transform = `scaleY(${(.2 + .6 * Math.abs(Math.sin(i * 1.7))).toFixed(2)})`; });
    let raf, lastJ = 0;
    function anim(t) {
      const p = a.duration ? a.currentTime / a.duration : 0;
      const jitter = !a.paused && t - lastJ > 90; if (jitter) lastJ = t;
      bars.forEach((b, i) => { b.classList.toggle('on', i / bars.length < p); if (jitter) b.style.transform = `scaleY(${(.18 + Math.random() * .8).toFixed(2)})`; });
      time.textContent = fmt(a.currentTime || 0);
      raf = requestAnimationFrame(anim);
    }
    btn.addEventListener('click', () => {
      if (a.paused) a.play().then(() => { Sound.duck(true); btn.textContent = '❚❚'; voice.classList.add('playing'); }).catch(() => {});
      else a.pause();
    });
    a.addEventListener('pause', () => { Sound.duck(false); btn.textContent = '▶'; voice.classList.remove('playing'); });
    a.addEventListener('error', () => { msg.hidden = false; msg.textContent = `Aquí sonará tu nota de voz (${day.src || 'sin archivo'})`; btn.disabled = true; });
    raf = requestAnimationFrame(anim);
    api.done();
    return () => { a.pause(); cancelAnimationFrame(raf); Sound.duck(false); };
  }

  /* 🎁 Regalo: cada toque tiembla más, la luz se escapa por la rendija y estalla */
  function regalo(day, body, api) {
    body.innerHTML = `<div class="gift-wrap"><div class="rays"></div>
        <div class="gift" role="button" tabindex="0" aria-label="Abrir regalo" style="--g:${esc(day.color || '#b8343c')}"><div class="g-leak"></div><div class="g-lid"><i class="bow l"></i><i class="bow r"></i></div><div class="g-box"></div></div>
      </div>
      <p class="hint">${api.seen ? '' : 'Toca el regalo (con energía)'}</p>
      <div class="g-content" hidden><h3>${esc(day.texto)}</h3>${day.detalle ? `<p>${br(day.detalle)}</p>` : ''}${day.imagen ? `<img src="${esc(day.imagen)}" alt="" class="g-img">` : ''}</div>`;
    const wrap = body.querySelector('.gift-wrap'), gift = body.querySelector('.gift'), content = body.querySelector('.g-content');
    let taps = 0;
    function open(instant) {
      wrap.classList.add('opened'); body.querySelector('.hint').textContent = ''; content.hidden = false;
      if (!instant) setTimeout(() => content.scrollIntoView({ behavior: api.reduce ? 'auto' : 'smooth', block: 'center' }), 380);
      if (!instant) { Sound.tada(); api.haptic([20, 30, 40]); const [x, y] = centerOf(gift); FX.burst(x, y, 'confetti', 170); FX.burst(x, y, 'sparkle', 70); }
      api.done();
    }
    if (api.seen) return open(true);
    const hit = () => {
      if (wrap.classList.contains('opened')) return;
      taps++;
      gift.style.setProperty('--amp', (4 + taps * 4) + 'deg');
      gift.classList.remove('wiggle'); void gift.offsetWidth; gift.classList.add('wiggle');
      gift.classList.toggle('leak', taps >= 2);
      Sound.jingle(); api.haptic(10 + taps * 8);
      if (taps >= 3) setTimeout(() => open(false), 260);
    };
    gift.addEventListener('click', hit);
    gift.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hit(); } });
  }

  /* 🎨 Pinta tu adorno (se cuelga en el árbol de la plaza) */
  function pintar(day, body, api) {
    const COLS = ['#c0392b', '#e67e22', '#f4d03f', '#27ae60', '#1abc9c', '#2e86de', '#8e44ad', '#ff9ecb', '#ffffff', '#2b2233'];
    const N = 560;
    body.innerHTML = `${day.texto ? `<p class="intro">${br(day.texto)}</p>` : ''}
      <div class="paint"><canvas width="${N}" height="${N}"></canvas></div>
      <div class="palette">${COLS.map((c, i) => `<button class="sw${i === 0 ? ' on' : ''}" style="--c:${c}" data-c="${c}" aria-label="Color ${i + 1}"></button>`).join('')}</div>
      <div class="sizes">${[4, 10, 22].map((s, i) => `<button class="sz${i === 1 ? ' on' : ''}" data-s="${s}" aria-label="Pincel ${i + 1}"><i style="width:${s / 1.3 + 4}px;height:${s / 1.3 + 4}px"></i></button>`).join('')}</div>
      <div class="paint-actions"><button class="link clear">Borrar</button><button class="btn hang">Colgar en el árbol</button></div>`;
    const cv = body.querySelector('canvas'), g = cv.getContext('2d');
    let color = COLS[0], size = 10, down = false, last = null;
    const clip = () => { g.beginPath(); g.arc(N / 2, N / 2, N / 2 - 2, 0, 6.283); g.clip(); };
    function base() {
      g.clearRect(0, 0, N, N); g.save(); clip();
      const gr = g.createRadialGradient(N * .35, N * .3, 10, N / 2, N / 2, N / 2);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e6e0ee');
      g.fillStyle = gr; g.fillRect(0, 0, N, N); g.restore();
    }
    base();
    if (api.adorno) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0, N, N); im.src = api.adorno; }
    const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * N / b.width, (e.clientY - b.top) * N / b.height]; };
    function stroke(p) {
      g.save(); clip();
      g.strokeStyle = color; g.lineWidth = size * N / 280; g.lineCap = g.lineJoin = 'round';
      g.beginPath(); g.moveTo(...(last || [p[0] - .1, p[1]])); g.lineTo(...p); g.stroke();
      g.restore(); last = p;
    }
    cv.addEventListener('pointerdown', e => { down = true; last = null; cv.setPointerCapture(e.pointerId); stroke(pos(e)); });
    cv.addEventListener('pointermove', e => { if (down) stroke(pos(e)); });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { down = false; last = null; }));
    body.querySelectorAll('.sw').forEach(b => b.addEventListener('click', () => { body.querySelectorAll('.sw').forEach(x => x.classList.remove('on')); b.classList.add('on'); color = b.dataset.c; Sound.tap(); }));
    body.querySelectorAll('.sz').forEach(b => b.addEventListener('click', () => { body.querySelectorAll('.sz').forEach(x => x.classList.remove('on')); b.classList.add('on'); size = +b.dataset.s; Sound.tap(); }));
    body.querySelector('.clear').addEventListener('click', () => { base(); Sound.whoosh(); });
    body.querySelector('.hang').addEventListener('click', () => {
      const t = document.createElement('canvas'); t.width = t.height = 128;
      t.getContext('2d').drawImage(cv, 0, 0, 128, 128);
      api.saveAdorno(t.toDataURL('image/png'));
      Sound.tada(); api.haptic([15, 30, 15]);
      const [x, y] = centerOf(cv); FX.burst(x, y, 'sparkle', 70); FX.burst(x, y, 'confetti', 60);
      if (!api.reduce) cv.animate([{ transform: 'none' }, { transform: 'translateY(-14px) rotate(-6deg)' }, { transform: 'none' }], { duration: 600, easing: EASE_OUT });
      api.toast('Tu adorno ya cuelga del árbol del pueblo');
      api.done();
    });
  }

  /* 🎄 Día 24: carta + gran regalo */
  function final(day, body, api) {
    const a = document.createElement('div'), b = document.createElement('div');
    b.className = 'final-gift'; body.append(a, b);
    let t;
    const c1 = carta(day, a, { ...api, done() { t = setTimeout(() => { regalo(day.regalo || {}, b, api); b.scrollIntoView({ behavior: api.reduce ? 'auto' : 'smooth', block: 'center' }); }, api.seen ? 0 : 700); } });
    return () => { c1 && c1(); clearTimeout(t); };
  }

  return { carta, rasca, fotos, quiz, certificado, cancion, pista, entrada, audio, regalo, pintar, final };
})();
