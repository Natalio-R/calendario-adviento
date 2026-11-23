/* Sonido: todo sintetizado con WebAudio (sin archivos) */
window.Sound = (() => {
  let ctx = null, master, sfx, music, noiseBuf;
  let muted = false, wanted = false, timer = null, nextT = 0, step = 0, fileEl = null, ducked = false;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(comp);
    const rev = ctx.createConvolver(); rev.buffer = impulse(2.6, 2.4);
    const wet = ctx.createGain(); wet.gain.value = 0.3; rev.connect(wet); wet.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.8; sfx.connect(master); sfx.connect(rev);
    music = ctx.createGain(); music.gain.value = 0; music.connect(master); music.connect(rev);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function impulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function tone(freq, t, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide || dur));
    const peak = o.gain ?? 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || sfx);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  function noise(t, dur, o = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(o.gain ?? 0.2, t + (o.attack ?? 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || sfx);
    src.start(t, Math.random() * 0.5, dur + 0.05);
  }

  function bell(freq, t, gain = 0.12, dest) {
    [[1, 1, 1.8], [2.01, .45, 1.1], [3.02, .25, .7], [4.17, .14, .45], [5.43, .08, .3]]
      .forEach(([m, a, d]) => tone(freq * m, t, d, { gain: gain * a, dest }));
  }
  function mbox(freq, t, gain, dest) {
    tone(freq, t, 1.5, { gain, dest });
    tone(freq * 2, t, .5, { gain: gain * .3, dest });
    tone(freq * 3.98, t, .18, { gain: gain * .12, dest });
  }
  function jingle(t) {
    for (let i = 0; i < 16; i++) {
      const tt = t + i * .028 + Math.random() * .02;
      noise(tt, .07, { type: 'highpass', f: 6000, gain: .06 });
      tone(3800 + Math.random() * 3000, tt, .09, { gain: .012 });
    }
  }
  const now = () => ctx.currentTime + 0.01;

  const fx = {
    tap() { mbox(mtof(84), now(), .05); },
    open() { const t = now(); [72, 76, 79, 84, 88].forEach((m, i) => bell(mtof(m), t + i * .07, .07)); jingle(t); },
    nope() { const t = now(); tone(392, t, .16, { type: 'triangle', gain: .16 }); tone(294, t + .15, .28, { type: 'triangle', gain: .16 }); },
    key() { const t = now(); noise(t, .03, { type: 'highpass', f: 2200 + Math.random() * 1800, gain: .18 }); tone(140 + Math.random() * 60, t, .04, { type: 'square', gain: .02 }); },
    ding() { bell(mtof(96), now(), .05); },
    paper() { noise(now(), .4, { type: 'bandpass', f: 900, to: 3000, q: .6, gain: .12, attack: .05 }); },
    scratch() { noise(now(), .06, { type: 'bandpass', f: 2500 + Math.random() * 2000, q: .8, gain: .12 }); },
    stamp() { const t = now(); tone(110, t, .35, { to: 40, gain: .55 }); noise(t, .14, { type: 'lowpass', f: 900, gain: .5 }); },
    pop() { tone(420, now(), .12, { to: 1100, glide: .06, gain: .12 }); },
    whoosh() { noise(now(), .55, { type: 'bandpass', f: 300, to: 2400, q: .8, gain: .18, attack: .15 }); },
    tear() { const t = now(); for (let i = 0; i < 9; i++) noise(t + i * .025 + Math.random() * .01, .05, { type: 'highpass', f: 1500, gain: .22 }); },
    good() { const t = now(); bell(mtof(84), t, .09); bell(mtof(91), t + .09, .09); },
    bad() { tone(220, now(), .35, { type: 'sawtooth', to: 150, gain: .05 }); },
    tada() {
      const t = now();
      [72, 76, 79, 84].forEach(m => bell(mtof(m), t, .05));
      [72, 76, 79, 84, 88, 91].forEach((m, i) => bell(mtof(m), t + .15 + i * .06, .05));
      jingle(t + .1);
    },
    twinkle() { const t = now(); [0, 4, 7, 12, 16, 19].forEach((s, i) => bell(mtof(84 + s), t + i * .05 + Math.random() * .03, .035)); },
    wipe() { noise(now(), .09, { type: 'bandpass', f: 600 + Math.random() * 400, q: 2, gain: .05 }); },
    boom() { const t = now(); noise(t, 1.2, { type: 'lowpass', f: 400, to: 80, gain: .35, attack: .01 }); for (let i = 0; i < 14; i++) noise(t + .1 + Math.random() * .7, .04, { type: 'highpass', f: 3000, gain: .07 }); },
    launch() { noise(now(), .7, { type: 'bandpass', f: 600, to: 3000, q: 4, gain: .07, attack: .2 }); },
    jingle() { jingle(now()); },
    clink() { const t = now(); bell(mtof(98), t, .03); bell(mtof(103), t + .05, .02); noise(t, .04, { type: 'highpass', f: 5000, gain: .08 }); },
    sleigh() { const t = now(); for (let i = 0; i < 5; i++) jingle(t + i * .55); },
    swell() { const t = now(); [60, 67, 72, 76].forEach((m, i) => tone(mtof(m), t + i * .12, 2.6, { type: 'triangle', gain: .025, attack: .6 })); },
  };

  /* Caja de música generativa (I–vi–IV–V…) */
  const PROG = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [52, 55, 59], [53, 57, 60], [55, 59, 62]];
  const PAT = [0, 1, 2, 3, 2, 1, 2, 1];
  const E = 0.34;
  function tick() {
    while (nextT < ctx.currentTime + 0.5) {
      const ch = PROG[Math.floor(step / 8) % PROG.length], s = step % 8, p = PAT[s];
      const m = (p === 3 ? ch[0] + 12 : ch[p]) + 12;
      mbox(mtof(m), nextT + (Math.random() - .5) * .012, .05, music);
      if (s === 0) {
        tone(mtof(ch[0] - 12), nextT, E * 8, { gain: .07, attack: .05, dest: music });
        ch.forEach(n => tone(mtof(n), nextT, E * 7, { type: 'triangle', gain: .012, attack: .4, dest: music }));
      }
      if (s % 2 === 1 && Math.random() < .28) mbox(mtof(ch[Math.floor(Math.random() * 3)] + 24), nextT + E * .5, .028, music);
      nextT += E; step++;
    }
  }
  const musicLevel = () => (ducked ? .1 : .55);

  function startMusic() {
    wanted = true;
    if (!ctx || muted) return;
    if (window.CONFIG && CONFIG.musica) {
      if (!fileEl) { fileEl = new Audio(CONFIG.musica); fileEl.loop = true; }
      fileEl.volume = ducked ? .08 : .45;
      fileEl.play().catch(() => {});
      return;
    }
    if (timer) return;
    nextT = ctx.currentTime + 0.1;
    timer = setInterval(tick, 120);
    music.gain.setTargetAtTime(musicLevel(), ctx.currentTime, .8);
  }
  function stopMusic() { clearInterval(timer); timer = null; if (fileEl) fileEl.pause(); }

  function setMuted(m) {
    muted = m;
    if (ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, .05);
    if (m) stopMusic(); else if (wanted) startMusic();
  }
  function duck(on) {
    ducked = on;
    if (ctx) music.gain.setTargetAtTime(musicLevel(), ctx.currentTime, .3);
    if (fileEl) fileEl.volume = on ? .08 : .45;
  }

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) { ctx.suspend(); if (fileEl) fileEl.pause(); }
    else { ctx.resume(); if (wanted && !muted && fileEl) fileEl.play().catch(() => {}); }
  });

  const api = { init, setMuted, duck, music: startMusic, get muted() { return muted; } };
  Object.keys(fx).forEach(k => {
    api[k] = (...a) => { if (!ctx || muted) return; try { fx[k](...a); } catch (e) { /* silencio */ } };
  });
  return api;
})();
