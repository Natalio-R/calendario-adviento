/* La bola de nieve: escena Three.js.
   Un pueblo de juguete con volumen real sobre una isla nevada, dentro de una esfera de cristal
   que descansa en una peana lacada. Se gira con el dedo (órbita con inercia), las casas se
   enfocan con una grúa que esquiva obstáculos y la puerta se abre siguiendo al dedo. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PAL = {
  night: '#161b45', indigo2: '#232a66', indigo3: '#323b85', indigo4: '#454ea0',
  snow: '#f3f4f8', snow2: '#e3e7f3', ink: '#11142e',
  vermilion: '#e5392b', pine: '#1e6a4e', pine2: '#164e3a', gold: '#f0b22e', candle: '#ffcf6b',
};
const WALLS = ['#e5392b', '#1e6a4e', '#d99a2b', '#2f4fb0', '#7a2e5c', '#e87a8e', '#1f7a7a', '#f3f4f8', '#e8b53a', '#b8452f', '#5b3fa0', '#2a8a5c'];
const ROOFS = ['#11142e', '#2a2f6b', '#8f1d2c', '#0f3d2e'];
const DOORS = ['#11142e', '#8f1d2c', '#0f3d2e', '#2a2f6b', '#5a2a1a'];
const BULB = ['#ff6b5b', '#ffd166', '#7ef0b8', '#86c8ff', '#ff9ecb'];

const RNG = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
export const EASE = {
  io: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 4),
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* Mundo: isla de radio ISL dentro de una esfera (centro GC, radio GR) sobre una peana */
const ISL = 6.2, GR = 7.2, GC = 2.0;
const R0 = 4.85, R1 = 2.3, TURNS = 1.0, A0 = .3;
const hill = (x, z) => { const r = Math.hypot(x, z); return 1.6 * Math.exp(-(r * r) / 11.5) + .07 * Math.sin(x * 1.3 + .5) * Math.cos(z * 1.1) - .4 * sstep(ISL - .7, ISL, r); };
const street = s => { const a = A0 + s * TURNS * Math.PI * 2, r = lerp(R0, R1, s), x = r * Math.sin(a), z = r * Math.cos(a); return V(x, hill(x, z), z); };

export function createStage(canvas, { reduce = false, fontFamily = 'Bricolage Grotesque Variable', name = 'Andrius' } = {}) {
  /* ---------- render ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0e2a');
  const camera = new THREE.PerspectiveCamera(35, 1, 0.08, 260);
  scene.add(camera);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // red de seguridad: un píxel NaN/infinito (algunas GPU móviles) se convertiría en bloques negros al pasar por el bloom
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      float ok(float v){ return v >= 0. && v < 1e4 ? v : 0.; }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); gl_FragColor = vec4(ok(c.r), ok(c.g), ok(c.b), 1.); }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.55, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  /* ---------- luces ---------- */
  scene.add(new THREE.HemisphereLight('#c9d4ff', '#3a4088', 1.0));
  const moon = new THREE.DirectionalLight('#e6ecff', 1.9);
  moon.position.set(-6, 13, 8);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -8.5, right: 8.5, top: 8.5, bottom: -8.5, near: 1, far: 45 });
  moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.02;
  moon.target.position.set(0, 1, 0);
  scene.add(moon, moon.target);
  const treeLight = new THREE.PointLight('#ffb35c', 0, 9, 1.6);
  const doorLight = new THREE.PointLight('#ffc070', 0, 3.2, 1.8);
  scene.add(treeLight, doorLight);
  let shadowFrames = 4;
  const dirtyShadows = (n = 2) => { shadowFrames = Math.max(shadowFrames, n); };

  /* ---------- texturas ---------- */
  const canvasTex = (w, h, draw, srgb = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  };
  const radial = stops => canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, w); }, false);
  const puffTex = radial([[0, 'rgba(255,255,255,.9)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  const poolTex = radial([[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
  const paperTex = (() => {      // grano para el título troquelado
    const t = canvasTex(256, 256, (g) => {
      const img = g.createImageData(256, 256);
      for (let i = 0; i < img.data.length; i += 4) { const v = 228 + Math.random() * 27; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 1.6);
    return t;
  })();
  function labelTexture(text, w = 512, h = 96, color = PAL.ink, bg = PAL.snow) {
    return canvasTex(w, h, g => {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `800 ${Math.round(h * .62)}px "${fontFamily}"`;
      try { g.fontStretch = 'condensed'; g.letterSpacing = '6px'; } catch (e) { /* nada */ }
      g.fillText(text, w / 2, h * .56);
    });
  }
  const medalTex = new Map();
  function medalTexture(d, st) {
    const key = d + st;
    if (!medalTex.has(key)) {
      const [bg, ring, fg] = st === 'opened' ? [PAL.snow, PAL.vermilion, PAL.vermilion] : st === 'available' ? [PAL.gold, PAL.ink, PAL.ink] : [PAL.indigo3, '#5d67b8', '#c8cdf0'];
      medalTex.set(key, canvasTex(128, 128, g => {
        g.shadowColor = 'rgba(5,7,25,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
        g.fillStyle = bg; g.beginPath(); g.arc(64, 60, 50, 0, Math.PI * 2); g.fill();
        g.shadowColor = 'transparent';
        g.lineWidth = 4; g.strokeStyle = ring; g.beginPath(); g.arc(64, 60, 43, 0, Math.PI * 2); g.stroke();
        g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `800 ${String(d).length > 1 ? 54 : 62}px "${fontFamily}"`;
        try { g.fontStretch = 'condensed'; } catch (e) { /* nada */ }
        g.fillText(String(d), 64, 64);
      }));
    }
    return medalTex.get(key);
  }

  /* ---------- materiales ---------- */
  const mats = new Map();
  const toy = (color, rough = .78) => { const k = color + rough; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 })); return mats.get(k); };
  const sparkle = { value: 0 };
  const snowMat = new THREE.MeshStandardMaterial({ color: '#eef1fa', roughness: .9 });
  snowMat.onBeforeCompile = sh => {      // destellos de escarcha que dependen del ángulo de mirada
    sh.uniforms.uT = sparkle;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'uniform float uT; varying vec3 vWP;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      vec3 cell = floor(vWP * 26.);
      float hs = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float tw = step(.988, hs) * pow(max(0., sin(uT * 1.7 + hs * 90. + dot(normalize(cameraPosition - vWP), vec3(3.1, 1.7, 2.3)) * 4.)), 10.);
      gl_FragColor.rgb += vec3(1., .96, .88) * tw * 1.6;`);
  };
  const inkMat = toy(PAL.ink, .6);
  const goldMat = new THREE.MeshStandardMaterial({ color: PAL.gold, metalness: .9, roughness: .28, envMap: envTex, envMapIntensity: .55 });
  const roadMat = new THREE.MeshStandardMaterial({ color: '#c3cbe3', roughness: .96, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const C_LOCKED = new THREE.Color('#2b3274'), C_AVAIL = new THREE.Color(PAL.candle).multiplyScalar(.95), C_OPEN = new THREE.Color(PAL.candle).multiplyScalar(1.8);
  const interiorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.candle).multiplyScalar(1.15), side: THREE.BackSide, toneMapped: false }); interiorMat.userData.noShadow = true;
  const glowMat = () => { const m = new THREE.MeshBasicMaterial({ color: C_LOCKED.clone(), toneMapped: false }); m.userData.noShadow = true; return m; };

  /* ---------- geometría ---------- */
  const rbox = (w, h, d, r = .03) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (r, h, s = 16, r2 = r) => new THREE.CylinderGeometry(r, r2, h, s);
  const plane = (w, h) => new THREE.PlaneGeometry(w, h);
  function prism(w, rh, dep) {       // hastial triangular
    const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rh); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: dep, bevelEnabled: false }); g.translate(0, 0, -dep / 2);
    return g;
  }
  // Fusiona piezas estáticas por material: pocas llamadas de dibujo aunque cada casa tenga decenas de piezas
  function kit() {
    const parts = new Map(), o = new THREE.Object3D();
    return {
      add(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
        o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix();
        const g = geo.index ? geo.toNonIndexed() : geo.clone();
        g.applyMatrix4(o.matrix);
        for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
        if (!parts.has(mat)) parts.set(mat, []);
        parts.get(mat).push(g);
        geo.dispose();
      },
      merged() { const out = [...parts].map(([mat, list]) => { const g = mergeGeometries(list); list.forEach(x => x.dispose()); return [g, mat]; }); parts.clear(); return out; },
      flush(group, day) {
        for (const [mat, list] of parts) {
          const m = new THREE.Mesh(mergeGeometries(list), mat);
          m.castShadow = !mat.userData.noShadow; m.receiveShadow = !mat.userData.noShadow;
          if (day != null) { m.userData.day = day; pickables.push(m); }
          group.add(m); list.forEach(g => g.dispose());
        }
        parts.clear();
      },
    };
  }

  /* ---------- piezas ---------- */
  const houses = {};
  const pickables = [];
  let world = null, curve = null, uAt = [], tube = null, tubeSegs = 0, spark = null;

  function addDoor(g, x, F, dw, dh, mat, d) {
    const pivot = new THREE.Group(); pivot.position.set(x - dw / 2, 0, F + .012);
    const panel = new THREE.Mesh(rbox(dw, dh, .035, .012), mat); panel.position.set(dw / 2, dh / 2, 0); panel.castShadow = true;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(.016, 10, 8), goldMat); knob.position.set(dw - .04, dh * .45, .025);
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(.045, .015, 8, 20), toy(PAL.pine, .7)); wreath.position.set(dw / 2, dh * .7, .03);
    const bow = new THREE.Mesh(rbox(.05, .026, .016, .006), toy(PAL.vermilion, .6)); bow.position.set(dw / 2, dh * .7 - .045, .045);
    pivot.add(panel, knob, wreath, bow);
    panel.userData.day = d; pickables.push(panel);
    g.add(pivot);
    return { pivot, x, dw, dh, F };
  }
  function doorFrame(K, x, F, dw, dh, glow) {
    K.add(plane(dw - .01, dh - .005), glow, x, dh / 2, F + .002);
    K.add(box(dw + .07, .045, .04), inkMat, x, dh + .022, F + .012);
    [-1, 1].forEach(sd => K.add(box(.035, dh, .04), inkMat, x + sd * (dw / 2 + .017), dh / 2, F + .012));
    K.add(rbox(dw + .16, .05, .16, .02), snowMat, x, .025, F + .07);
  }
  function addLock(g, x, y, z) {
    const lock = new THREE.Group();
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(.04, .009, 8, 20, Math.PI), inkMat); shackle.position.y = .035;
    const body = new THREE.Mesh(rbox(.11, .09, .03, .01), goldMat);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(.012, 12), inkMat); hole.position.set(0, -.005, .016);
    lock.add(shackle, body, hole); lock.position.y = -.07;
    const holder = new THREE.Group(); holder.position.set(x, y, z); holder.add(lock); holder.visible = false;
    g.add(holder);
    return holder;
  }
  function addRipple(g) {
    const r = new THREE.Mesh(new THREE.RingGeometry(.94, 1, 72), new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.candle).multiplyScalar(2), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.y = .06; r.visible = false;
    g.add(r);
    return r;
  }
  function addPool(g, F, w = 1.5) {
    const p = new THREE.Mesh(plane(w, w * .8), new THREE.MeshBasicMaterial({ map: poolTex, color: new THREE.Color(PAL.candle).multiplyScalar(.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    p.rotation.x = -Math.PI / 2; p.position.set(0, .03, F + w * .36); p.renderOrder = 2;
    g.add(p);
    return p;
  }
  function addBulbs(g, lines, per, droop = .035) {
    const pts = [];
    lines.forEach(([P, Q]) => { for (let k = 0; k <= per; k++) { const t = k / per; pts.push(V(lerp(P[0], Q[0], t), lerp(P[1], Q[1], t) - Math.sin(t * Math.PI) * droop, lerp(P[2], Q[2], t))); } });
    const im = new THREE.InstancedMesh(new THREE.SphereGeometry(.022, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), pts.length);
    const m = new THREE.Matrix4(), col = new THREE.Color();
    pts.forEach((p, i) => { m.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, m); im.setColorAt(i, col.set(BULB[i % BULB.length]).multiplyScalar(2.2)); });
    im.visible = false; im.userData.base = pts.map((_, i) => BULB[i % BULB.length]);
    g.add(im);
    return im;
  }
  function addSmoke(g, x, y, z) {
    const out = [];
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: '#dfe5f5', transparent: true, opacity: 0, depthWrite: false }));
      s.position.set(x, y, z); s.userData.y0 = y; s.userData.phase = i / 3; s.scale.setScalar(.2);
      g.add(s); out.push(s);
    }
    return out;
  }
  function addMedal(g, y) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: medalTexture(1, 'locked'), transparent: true, depthWrite: false, fog: false }));
    s.position.set(0, y, 0); s.renderOrder = 5;
    g.add(s);
    return s;
  }

  function house(d, rnd) {
    const g = new THREE.Group(), K = kit();
    const w = .8 + rnd() * .16, dep = .68 + rnd() * .1, h = .5 + rnd() * .16, rh = .34 + rnd() * .12, F = dep / 2;
    const wall = toy(WALLS[Math.floor(rnd() * WALLS.length)]), roof = toy(ROOFS[Math.floor(rnd() * ROOFS.length)], .66), doorM = toy(DOORS[Math.floor(rnd() * DOORS.length)], .6);
    const glow = glowMat();
    K.add(rbox(w + .18, .72, dep + .18, .06), snowMat, 0, -.34, 0);
    K.add(rbox(w, h, dep, .03), wall, 0, h / 2, 0);
    K.add(prism(w, rh, dep), wall, 0, h - .002, 0);
    // tejado a dos aguas con una capa de nieve encima de cada faldón
    const a = w / 2 + .1, rise = rh + .1 * rh / (w / 2), al = Math.atan2(rise, a), L = Math.hypot(a, rise) + .05;
    [-1, 1].forEach(sd => {
      const cx = sd * a / 2, cy = h + rise / 2 - .005, nx = sd * Math.sin(al), ny = Math.cos(al);
      K.add(rbox(L, .06, dep + .18, .02), roof, cx, cy, 0, 0, 0, -sd * al);
      K.add(rbox(L - .03, .06, dep + .12, .028), snowMat, cx + nx * .055, cy + ny * .055, 0, 0, 0, -sd * al);
    });
    K.add(cyl(.05, dep + .14, 12), snowMat, 0, h + rise + .045, 0, Math.PI / 2, 0, 0);
    // chimenea
    const chx = (rnd() < .5 ? -1 : 1) * a * .45, chTop = h + rise * (1 - Math.abs(chx) / a) + .24;
    K.add(rbox(.14, .42, .14, .015), toy('#5a2a1a', .85), chx, chTop - .21, -dep * .18);
    K.add(rbox(.2, .06, .2, .025), snowMat, chx, chTop + .02, -dep * .18);
    // ventanas
    const ww = .15, wh = .19, wy = h * .56, wx = w / 2 - .17;
    [-1, 1].forEach(sd => {
      const x = sd * wx;
      K.add(plane(ww, wh), glow, x, wy, F + .003);
      K.add(box(.016, wh, .014), inkMat, x, wy, F + .008); K.add(box(ww, .016, .014), inkMat, x, wy, F + .008);
      K.add(rbox(ww + .07, .035, .07, .012), snowMat, x, wy - wh / 2 - .015, F + .03);
      K.add(plane(ww, wh), glow, sd * (w / 2 + .003), wy, 0, 0, sd * Math.PI / 2, 0);
      K.add(box(.014, wh, .016), inkMat, sd * (w / 2 + .006), wy, 0);
    });
    K.add(new THREE.CircleGeometry(.07, 24), glow, 0, h + rh * .36, F + .003);
    K.add(new THREE.TorusGeometry(.075, .014, 8, 24), inkMat, 0, h + rh * .36, F + .006);
    const dw = .22, dh = .34;
    doorFrame(K, 0, F, dw, dh, glow);
    K.add(box(w - .05, h - .03, dep - .05), interiorMat, 0, h / 2, 0);
    K.flush(g, d);
    const door = addDoor(g, 0, F, dw, dh, doorM, d);
    const z = F + .1, bulbs = addBulbs(g, [[[-a, h + .01, z], [0, h + rise + .06, z]], [[0, h + rise + .06, z], [a, h + .01, z]]], 6, .02);
    return { g, w, dep, h: h + rise + .1, F, glowMat: glow, door, bulbs, smoke: addSmoke(g, chx, chTop + .12, -dep * .18), lock: addLock(g, 0, dh * .62, F + .07), ripple: addRipple(g), pool: addPool(g, F), medal: addMedal(g, h + rise + .5), doorH: dh };
  }

  function bookshop(d) {
    const g = new THREE.Group(), K = kit(), w = 1.2, h = .86, dep = .84, F = dep / 2, glow = glowMat();
    K.add(rbox(w + .18, .72, dep + .18, .06), snowMat, 0, -.34, 0);
    K.add(rbox(w, h, dep, .03), toy(PAL.pine), 0, h / 2, 0);
    K.add(rbox(w + .12, .08, dep + .12, .02), toy('#2a2f6b', .66), 0, h + .04, 0);
    K.add(rbox(w + .06, .09, dep + .06, .04), snowMat, 0, h + .12, 0);
    [[-.32, .1], [.12, -.15], [.38, .12]].forEach(([x, z]) => K.add(new THREE.SphereGeometry(.16, 14, 10), snowMat, x, h + .15, z, 0, 0, 0, 1, .38, 1));
    // escaparate: libros recortados contra la luz
    const sx = -.2, sw = .64, sh = .42, sy = .4;
    K.add(plane(sw, sh), glow, sx, sy, F + .003);
    const BK = ['#e5392b', '#f0b22e', '#2f4fb0', '#f3f4f8', '#7a2e5c', '#e87a8e'];
    [sy - sh / 2 + .04, sy + .03].forEach((base, s) => {
      let x = sx - sw / 2 + .04, i = s * 3;
      while (x < sx + sw / 2 - .06) { const bw = .022 + ((i * 37) % 10) / 400, bh = .11 + ((i * 53) % 7) / 100; K.add(box(bw, bh, .02), toy(BK[i % BK.length], .7), x + bw / 2, base + bh / 2, F + .012); x += bw + .007; i++; }
      K.add(box(sw - .04, .012, .03), inkMat, sx, base - .006, F + .012);
    });
    [[sx, sy + sh / 2 + .015, sw + .05, .03], [sx, sy - sh / 2 - .015, sw + .05, .03]].forEach(([x, y, bw, bh]) => K.add(box(bw, bh, .04), inkMat, x, y, F + .015));
    [-1, 1].forEach(sd => K.add(box(.03, sh, .04), inkMat, sx + sd * (sw / 2 + .01), sy, F + .015));
    K.add(rbox(sw + .1, .035, .08, .012), snowMat, sx, sy - sh / 2 - .04, F + .04);
    // toldo de rayas con festón
    const stripes = canvasTex(256, 64, (c, W, H) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? PAL.snow : PAL.vermilion; c.fillRect(i * W / 8, 0, W / 8, H); } });
    const awn = new THREE.Mesh(box(sw + .12, .014, .24), new THREE.MeshStandardMaterial({ map: stripes, roughness: .8 }));
    awn.position.set(sx, sy + sh / 2 + .1, F + .11); awn.rotation.x = .45; awn.castShadow = true; g.add(awn);
    for (let i = 0; i < 8; i++) K.add(new THREE.CircleGeometry(.04, 12, Math.PI, Math.PI), toy(i % 2 ? PAL.snow : PAL.vermilion, .8), sx - (sw + .12) / 2 + (i + .5) * (sw + .12) / 8, sy + sh / 2 + .045, F + .215);
    // rótulo
    K.add(rbox(.78, .15, .05, .015), inkMat, -.12, h - .1, F + .02);
    const sign = new THREE.Mesh(plane(.72, .12), new THREE.MeshStandardMaterial({ map: labelTexture('LIBRERÍA', 512, 86, PAL.ink, PAL.gold), roughness: .7 }));
    sign.position.set(-.12, h - .1, F + .047); g.add(sign);
    const dw = .22, dh = .4, dx = .38;
    doorFrame(K, dx, F, dw, dh, glow);
    K.add(box(w - .05, h - .03, dep - .05), interiorMat, 0, h / 2, 0);
    // ventanas laterales
    [-1, 1].forEach(sd => { K.add(plane(.2, .24), glow, sd * (w / 2 + .003), .5, 0, 0, sd * Math.PI / 2, 0); K.add(box(.014, .24, .016), inkMat, sd * (w / 2 + .006), .5, 0); });
    K.flush(g, d);
    const door = addDoor(g, dx, F, dw, dh, toy('#5a2a1a', .6), d);
    const z = F + .08, bulbs = addBulbs(g, [[[-w / 2 - .05, h + .02, z], [w / 2 + .05, h + .02, z]]], 12, .04);
    return { g, w, dep, h: h + .25, F, glowMat: glow, door, bulbs, smoke: [], lock: addLock(g, dx, dh * .62, F + .07), ripple: addRipple(g), pool: addPool(g, F, 1.8), medal: addMedal(g, h + .62), doorH: dh };
  }

  function castle(d) {
    const g = new THREE.Group(), K = kit(), stone = toy('#ece6f7', .85), cone = toy('#5b3fa0', .6), glow = glowMat();
    const w = 1.0, h = .82, dep = .8, F = dep / 2;
    K.add(rbox(1.7, .72, 1.2, .06), snowMat, 0, -.34, 0);
    K.add(rbox(w, h, dep, .03), stone, 0, h / 2, 0);
    for (let i = 0; i < 5; i++) [F - .06, -F + .06].forEach(z => K.add(rbox(.12, .11, .12, .015), stone, -.4 + i * .2, h + .05, z));
    K.add(rbox(w - .1, .05, dep - .2, .02), snowMat, 0, h + .02, 0);
    const flags = [];
    const tower = (x, z, r, th, cr, ch) => {
      K.add(cyl(r, th, 24), stone, x, th / 2, z);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; K.add(rbox(.07, .08, .07, .01), stone, x + Math.sin(a) * r * .9, th + .04, z + Math.cos(a) * r * .9); }
      K.add(cyl(.001, ch, 24, cr), cone, x, th + .05 + ch / 2, z);
      K.add(new THREE.TorusGeometry(r * 1.02, .045, 8, 28), snowMat, x, th + .07, z, Math.PI / 2, 0, 0);
      K.add(box(.012, .26, .012), inkMat, x, th + .05 + ch + .12, z);
      const f = new THREE.Mesh(plane(.16, .1), new THREE.MeshStandardMaterial({ color: '#ff7aa8', roughness: .8, side: THREE.DoubleSide }));
      f.geometry.translate(.08, 0, 0); f.position.set(x + .006, th + .05 + ch + .2, z); g.add(f); flags.push(f);
      K.add(plane(.09, .17), glow, x, th * .66, z + r + .003);
    };
    tower(0, -.15, .24, 1.55, .32, .72);
    tower(-.6, .18, .19, 1.2, .26, .55);
    tower(.6, .18, .19, 1.2, .26, .55);
    [-1, 1].forEach(sd => { K.add(plane(.1, .18), glow, sd * .26, .56, F + .003); K.add(box(.12, .02, .03), snowMat, sd * .26, .46, F + .015); });
    const dw = .26, dh = .42;
    doorFrame(K, 0, F, dw, dh, glow);
    K.add(box(w - .05, h - .03, dep - .05), interiorMat, 0, h / 2, 0);
    K.flush(g, d);
    const door = addDoor(g, 0, F, dw, dh, toy('#5a2a1a', .6), d);
    const z = F + .06, bulbs = addBulbs(g, [[[-w / 2, h + .12, z], [w / 2, h + .12, z]]], 10, .05);
    return { g, w: 1.6, dep: 1.1, h: 2.5, F, glowMat: glow, door, bulbs, smoke: [], flags, lock: addLock(g, 0, dh * .62, F + .07), ripple: addRipple(g), pool: addPool(g, F, 1.9), medal: addMedal(g, 2.75), doorH: dh };
  }

  function bigTree(d) {
    const g = new THREE.Group(), K = kit(), tiers = [];
    K.add(cyl(.16, .5, 12, .2), toy('#4a2e22', .9), 0, .25, 0);
    for (let k = 0; k < 6; k++) {
      const yb = .3 + k * .47, rad = 1.3 - k * .19, th = .95 - k * .06;
      const geo = new THREE.ConeGeometry(rad, th, 28, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) < 0 && Math.hypot(p.getX(i), p.getZ(i)) > .01) p.setY(i, p.getY(i) + Math.sin(Math.atan2(p.getX(i), p.getZ(i)) * 9 + k) * .045);
      geo.computeVertexNormals();
      K.add(geo, toy(k % 2 ? PAL.pine : PAL.pine2, .82), 0, yb + th / 2, 0, 0, k * .4, 0);
      K.add(new THREE.ConeGeometry(rad * .5, th * .5, 28, 1), snowMat, 0, yb + th - th * .25 + .02, 0, 0, k, 0, 1.06, 1, 1.06);
      tiers.push({ yb, rad, th });
    }
    // regalos a los pies
    [[.0, 1.38, '#e5392b', .26], [1.2, 1.42, '#2f4fb0', .22], [2.5, 1.36, '#f0b22e', .3], [3.9, 1.44, '#7a2e5c', .2], [5.1, 1.38, '#1f7a7a', .24]].forEach(([a, r, c, s]) => {
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      K.add(rbox(s, s * .8, s, .02), toy(c, .6), x, s * .4, z, 0, a, 0);
      K.add(box(s + .01, s * .8 + .01, .04), goldMat, x, s * .4, z, 0, a, 0);
      K.add(box(.04, s * .8 + .01, s + .01), goldMat, x, s * .4, z, 0, a, 0);
    });
    K.flush(g, d);
    // 24 bolas que se encienden con el progreso
    const spots = [];
    [6, 5, 5, 4, 3, 1].forEach((c, k) => {
      const { yb, rad, th } = tiers[k];
      for (let i = 0; i < c; i++) {
        const q = c === 1 ? .4 : .14 + ((i * 7 + k * 3) % 5) * .07, a = i / c * Math.PI * 2 + k * .9, r = rad * (1 - q) + .04;
        spots.push(V(Math.sin(a) * r, yb + q * th, Math.cos(a) * r));
      }
    });
    const order = spots.map((_, i) => i).sort((a, b) => ((a * 7919) % 24) - ((b * 7919) % 24));
    const baubles = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, 16, 12), new THREE.MeshStandardMaterial({ roughness: .25, metalness: .3, envMap: envTex, envMapIntensity: .4 }), 24);
    const m = new THREE.Matrix4();
    order.forEach((si, n) => { m.makeTranslation(spots[si].x, spots[si].y, spots[si].z); baubles.setMatrixAt(n, m); baubles.setColorAt(n, new THREE.Color('#2e3456')); });
    baubles.castShadow = true;
    g.add(baubles);
    // guirnalda en espiral: crece con los días abiertos
    const GN = 72, garland = new THREE.InstancedMesh(new THREE.SphereGeometry(.024, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), GN);
    for (let i = 0; i < GN; i++) {
      const u = i / (GN - 1), y = .45 + u * 2.95, a = u * Math.PI * 2 * 5.5;
      const k = clamp(Math.floor((y - .3) / .47), 0, 5), T = tiers[k], q = clamp((y - T.yb) / T.th, 0, 1), r = T.rad * (1 - q) + .05;
      m.makeTranslation(Math.sin(a) * r, y, Math.cos(a) * r); garland.setMatrixAt(i, m); garland.setColorAt(i, new THREE.Color('#ffe2a8').multiplyScalar(2.4));
    }
    garland.count = 0; g.add(garland);
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? .11 : .26, a = Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? starShape.lineTo(x, y) : starShape.moveTo(x, y); }
    starShape.closePath();
    const starMat = new THREE.MeshStandardMaterial({ color: PAL.gold, metalness: .9, roughness: .25, envMap: envTex, envMapIntensity: .6, emissive: '#000000', toneMapped: false });
    const sg = new THREE.ExtrudeGeometry(starShape, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }); sg.center();
    const star = new THREE.Mesh(sg, starMat);
    star.position.set(0, .3 + 5 * .47 + .65 + .18, 0); star.castShadow = true; star.userData.day = d; pickables.push(star);
    g.add(star);
    const adorno = new THREE.Mesh(new THREE.CircleGeometry(.13, 32), new THREE.MeshStandardMaterial({ roughness: .5, transparent: true }));
    adorno.position.set(0, .3 + .47 + .3, (1.3 - .19) * .7 + .06); adorno.rotation.x = -.6; adorno.visible = false; g.add(adorno);
    return { g, w: 2.6, dep: 2.6, h: 3.6, F: 0, tree: true, baubles, garland, star, starMat, adorno, glowMat: null, door: null, bulbs: null, smoke: [], lock: addLock(g, 0, .32, .24), ripple: addRipple(g), pool: null, medal: addMedal(g, 4.1), doorH: .3 };
  }

  /* ---------- atrezo instanciado (abetos, farolas): cada pieza puede hundirse en la nieve ---------- */
  const props = [];
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _sv = V(), _pv = V(), _yax = V(0, 1, 0);
  function placeProp(it) {
    _pv.set(it.x, it.y + it.sinkCur, it.z); _q.setFromAxisAngle(_yax, it.yaw); _sv.setScalar(it.s); _m4.compose(_pv, _q, _sv);
    it.meshes.forEach(m => { m.setMatrixAt(it.i, _m4); m.instanceMatrix.needsUpdate = true; });
  }
  function instanced(parts, items) {
    const meshes = parts.map(([geo, mat]) => { const m = new THREE.InstancedMesh(geo, mat, items.length); m.castShadow = !mat.userData.noShadow; m.receiveShadow = true; m.frustumCulled = false; world.add(m); return m; });
    items.forEach((it, i) => { Object.assign(it, { meshes, i, sinkCur: 0, sinkTgt: 0 }); props.push(it); placeProp(it); });
  }

  /* ---------- mundo ---------- */
  let layout = { portrait: false };
  function terrainGeo() {
    const NR = 60, NS = 180, pos = [], idx = [];
    for (let i = 0; i <= NR + 1; i++) {
      const r = i <= NR ? ISL * i / NR : ISL + .02;
      for (let j = 0; j <= NS; j++) {
        const a = j / NS * Math.PI * 2, x = r * Math.sin(a), z = r * Math.cos(a);
        pos.push(x, i <= NR ? hill(x, z) : -.95, z);
      }
    }
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function roadGeo(samples, width) {
    const pos = [], idx = [];
    samples.forEach((p, i) => {
      const q = samples[Math.min(samples.length - 1, i + 1)], o = samples[Math.max(0, i - 1)];
      const tx = q.x - o.x, tz = q.z - o.z, l = Math.hypot(tx, tz) || 1, nx = tz / l, nz = -tx / l;
      [-1, 1].forEach(sd => { const x = p.x + nx * sd * width / 2, z = p.z + nz * sd * width / 2; pos.push(x, hill(x, z) + .014, z); });
      if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
    return g;
  }
  function globeBase() {
    const grp = new THREE.Group();
    const prof = [[0, -3.0], [7.0, -3.0], [7.22, -2.9], [7.12, -2.62], [6.92, -2.48], [6.92, -1.58], [6.62, -1.42], [6.82, -1.25], [6.78, -1.0], [6.56, -.9], [6.3, -.88]].map(([r, y]) => new THREE.Vector2(r, y));
    const lacquer = new THREE.MeshPhysicalMaterial({ color: '#7a1424', roughness: .38, clearcoat: 1, clearcoatRoughness: .12, envMap: envTex, envMapIntensity: .35 });
    const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 160), lacquer); base.receiveShadow = true;
    grp.add(base);
    [[6.62, -.93, .06], [6.95, -1.58, .045], [6.95, -2.48, .045], [7.14, -2.95, .05]].forEach(([r, y, t]) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, t, 12, 180), goldMat); ring.rotation.x = Math.PI / 2; ring.position.y = y; grp.add(ring);
    });
    // banda grabada alrededor de la peana
    const text = `EL PUEBLO DE ${String(name).toUpperCase()}   ·   VEINTICUATRO PUERTAS   ·   NAVIDAD 2026   ·   `;
    const alpha = canvasTex(4096, 160, (g, W, H) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.textBaseline = 'middle';
      g.font = `800 92px "${fontFamily}"`; try { g.fontStretch = 'condensed'; g.letterSpacing = '14px'; } catch (e) { /* nada */ }
      const tw = g.measureText(text).width; let x = 0; while (x < W) { g.fillText(text, x, H / 2 + 4); x += tw; }
    }, false);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(6.935, 6.935, .62, 180, 1, true), new THREE.MeshStandardMaterial({ color: PAL.gold, metalness: .9, roughness: .3, envMap: envTex, envMapIntensity: .6, alphaMap: alpha, alphaTest: .5 }));
    band.position.y = -2.03; grp.add(band);
    return grp;
  }
  function glassGlobe() {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { op: { value: 1 } },
      vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float op; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 Vd = normalize(cameraPosition - vW), N = normalize(vN);
          float f = pow(clamp(1. - dot(N, Vd), 0., 1.), 2.4);
          vec3 R = reflect(-Vd, N);
          float s1 = pow(max(dot(R, normalize(vec3(-.55, .62, .58))), 0.), 900.) * 1.6 * smoothstep(.15, .5, f);
          float s2 = pow(max(dot(R, normalize(vec3(.75, .3, .6))), 0.), 22.) * .18;
          float s3 = smoothstep(.992, 1., dot(R, normalize(vec3(-.2, .9, .4)))) * .35 * smoothstep(.2, .6, f);
          vec3 c = vec3(.5, .62, 1.) * f * .5 + vec3(1., .98, .94) * (s1 + s3) + vec3(1., .82, .55) * s2;
          gl_FragColor = vec4(c * op, 1.); }`,
    });
    const g = new THREE.Mesh(new THREE.SphereGeometry(GR, 96, 64), m);
    g.position.y = GC; g.renderOrder = 10;
    return g;
  }
  function skyDome() {
    const grp = new THREE.Group();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `varying vec3 vP; void main(){ float h = vP.y;
        vec3 zen = vec3(.018, .022, .075), hor = vec3(.075, .085, .24), low = vec3(.03, .035, .1);
        vec3 c = h > 0. ? mix(hor, zen, smoothstep(0., .65, h)) : mix(hor, low, smoothstep(0., .4, -h));
        gl_FragColor = vec4(c, 1.); }`,
    }));
    grp.add(sky);
    // aurora: cortinas verticales muy tenues en dos sectores del cielo
    const aur = new THREE.Mesh(new THREE.CylinderGeometry(150, 150, 70, 128, 1, true), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { t: auroraT },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform float t; varying vec2 vUv;
        void main(){ float x = vUv.x * 6.2831;
          float n = sin(x * 7. + t * .12 + sin(x * 3. - t * .07) * 2.) * .5 + .5;
          n *= sin(x * 13. - t * .09 + sin(x * 5.) * 1.5) * .5 + .5;
          float streak = .55 + .45 * sin(vUv.x * 900. + sin(vUv.x * 40.) * 4.);
          float band = smoothstep(.0, .45, vUv.y) * (1. - smoothstep(.55, 1., vUv.y));
          float sector = smoothstep(.1, .3, sin(x + 1.1)) + smoothstep(.4, .7, sin(x * 2. - 2.)) * .6;
          vec3 col = mix(vec3(.1, .95, .62), vec3(.55, .3, .95), smoothstep(.35, .9, vUv.y));
          gl_FragColor = vec4(col * pow(max(n, 0.), 2.5) * band * streak * sector * .28, 1.); }`,
    }));
    aur.position.y = 38; grp.add(aur);
    // estrellas
    const n = 900, pos = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, y = Math.abs(u) * .95 + .02, r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(a) * r * 170; pos[i * 3 + 1] = (y - .12) * 170; pos[i * 3 + 2] = Math.sin(a) * r * 170; rnd[i] = Math.random();
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sgeo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    stars = new THREE.Points(sgeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, uniforms: { t: { value: 0 }, pr: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float rnd; uniform float t, pr; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mv;
          vA = .3 + .7 * abs(sin(t * (.5 + rnd) + rnd * 20.)); gl_PointSize = (1. + rnd * rnd * 3.) * pr; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(1., .94, .82, vA * (1. - smoothstep(.0, .5, d))); }`,
    }));
    grp.add(stars);
    // luna con halo
    const moonTex = canvasTex(256, 256, (g) => {
      const h = g.createRadialGradient(128, 128, 30, 128, 128, 128); h.addColorStop(0, 'rgba(255,240,210,.5)'); h.addColorStop(.35, 'rgba(200,210,255,.12)'); h.addColorStop(1, 'rgba(200,210,255,0)');
      g.fillStyle = h; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#fff6e2'; g.beginPath(); g.arc(128, 128, 34, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(200,190,170,.35)'; [[118, 120, 8], [140, 134, 6], [124, 142, 4]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
    });
    const moonS = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, color: new THREE.Color(1.25, 1.2, 1.1), transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    moonS.position.copy(V(-6, 13, 8).normalize().multiplyScalar(150)); moonS.scale.setScalar(46);
    grp.add(moonS);
    return grp;
  }
  const auroraT = { value: 0 };

  function build() {
    pickables.length = 0;
    world = new THREE.Group(); scene.add(world);
    const rnd = RNG(20261224), rndD = RNG(777);
    world.add(skyDome());
    const terr = new THREE.Mesh(terrainGeo(), snowMat); terr.receiveShadow = true; world.add(terr);
    world.add(globeBase());
    glass = glassGlobe(); world.add(glass);

    // reparto por longitud de arco: misma distancia de paseo entre puerta y puerta
    const N = 600, cumL = [0];
    for (let i = 1; i <= N; i++) cumL.push(cumL[i - 1] + street(i / N).distanceTo(street((i - 1) / N)));
    const sAt = f => { const L = f * cumL[N]; let i = 1; while (i < N && cumL[i] < L) i++; const a = cumL[i - 1], b = cumL[i]; return (i - 1 + (L - a) / Math.max(1e-6, b - a)) / N; };
    const fOf = [];
    for (let k = 0; k <= 24; k++) {
      let rec, p, yaw;
      if (k === 24) {
        rec = bigTree(k); p = V(0, hill(0, 0) - .05, 0);
        const e = street(1); yaw = Math.atan2(e.x, e.z);
      } else {
        const f = .03 + (k - .5) / 23 * .95; fOf[k] = f;
        const s = sAt(f), c = street(s), q = street(Math.min(1, s + .003)), o = street(Math.max(0, s - .003));
        const tx = q.x - o.x, tz = q.z - o.z, l = Math.hypot(tx, tz) || 1;
        let nx = tz / l, nz = -tx / l; if (nx * c.x + nz * c.z < 0) { nx = -nx; nz = -nz; }     // normal hacia fuera
        const side = k % 2 ? 1 : -1;
        rec = k === 12 ? bookshop(k) : k === 18 ? castle(k) : house(k, rnd);
        const off = .36 + rec.dep / 2 + (rndD() - .5) * .04;
        p = V(c.x + nx * off * side, 0, c.z + nz * off * side);
        yaw = Math.atan2(-nx * side, -nz * side);
        // la casa se asienta en el punto más alto de su planta: la puerta nunca queda enterrada
        const fx = Math.sin(yaw), fz = Math.cos(yaw), hw = rec.w / 2, hd = rec.dep / 2;
        let top = -9;
        [[0, 0], [hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd], [0, hd + .1]].forEach(([u, v]) => { top = Math.max(top, hill(p.x + fz * u + fx * v, p.z - fx * u + fz * v)); });
        p.y = top - .02;
      }
      rec.d = k; rec.base = p; rec.yaw = yaw;
      rec.g.position.copy(p); rec.g.rotation.y = yaw;
      rec.sinkCur = 0; rec.sinkTgt = 0; rec.glowCur = 0; rec.glowTgt = 0; rec.state = 'locked'; rec.doorCur = 0; rec.doorTgt = 0;
      world.add(rec.g); houses[k] = rec;
      rec.g.updateMatrixWorld(true);
      if (rec.pool) { const w = rec.g.localToWorld(rec.pool.position.clone()); rec.pool.position.y = Math.max(.03, hill(w.x, w.z) - p.y + .04); }
      pickables.push(rec.medal);
      rec.medal.userData.day = k;
    }

    // camino de nieve pisada y el hilo de oro que lo recorre
    const samples = []; for (let i = 0; i <= 320; i++) samples.push(street(-.025 + i / 320 * 1.025));
    const e = street(1); for (let i = 1; i <= 8; i++) { const r = lerp(R1, 1.45, i / 8), a = Math.atan2(e.x, e.z); samples.push(V(r * Math.sin(a), hill(r * Math.sin(a), r * Math.cos(a)), r * Math.cos(a))); }
    const road = new THREE.Mesh(roadGeo(samples, .5), roadMat); road.receiveShadow = true; world.add(road);
    const ctrl = samples.map(p => V(p.x, hill(p.x, p.z) + .06, p.z));
    curve = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
    const cl = [0]; for (let i = 1; i < ctrl.length; i++) cl.push(cl[i - 1] + ctrl[i].distanceTo(ctrl[i - 1]));
    const total = cl[cl.length - 1], uS = s => { const i = Math.round((s + .025) / 1.025 * 320); return cl[clamp(i, 0, ctrl.length - 1)] / total; };
    uAt = []; for (let k = 0; k <= 23; k++) uAt[k] = uS(sAt(fOf[k])); uAt[24] = 1;
    tubeSegs = 1400;
    const tubeGeo = new THREE.TubeGeometry(curve, tubeSegs, .035, 6, false);
    tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.candle).multiplyScalar(2.4), toneMapped: false }));
    tubeGeo.setDrawRange(0, 0); world.add(tube);
    spark = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d6').multiplyScalar(4), toneMapped: false }));
    spark.visible = false; world.add(spark);

    // farolas en el arcén, entre casa y casa
    const lamps = [];
    for (let k = 2; k <= 22; k += 3) {
      const s = sAt((fOf[k] + fOf[k + 1]) / 2), c = street(s), side = k % 2 ? 1 : -1, l = Math.hypot(c.x, c.z);
      const x = c.x + c.x / l * .31 * side, z = c.z + c.z / l * .31 * side;
      lamps.push({ x, y: hill(x, z), z, s: 1, yaw: 0, r: .12, h: 1.05 });
    }
    const LK = kit();
    LK.add(cyl(.022, .78, 8), inkMat, 0, .39, 0); LK.add(cyl(.07, .04, 8, .05), inkMat, 0, .8, 0);
    LK.add(box(.09, .11, .09), lampGlow, 0, .87, 0); LK.add(new THREE.ConeGeometry(.085, .08, 4), inkMat, 0, .965, 0, 0, Math.PI / 4, 0);
    LK.add(new THREE.SphereGeometry(.05, 10, 8), snowMat, 0, 1.0, 0, 0, 0, 0, 1.2, .55, 1.2);
    instanced(LK.merged(), lamps);

    // bosque: nunca encima de una casa, del camino ni delante de una puerta
    const pines = [], recs = Object.values(houses);
    for (let i = 0; i < 260; i++) {
      const r = 1.6 + Math.sqrt(rnd()) * (ISL - 1.9), a = rnd() * Math.PI * 2, x = r * Math.sin(a), z = r * Math.cos(a);
      if (recs.some(h => Math.hypot(h.base.x - x, h.base.z - z) < Math.max(h.w, h.dep) * .55 + .4)) continue;
      if (samples.some(p => Math.hypot(p.x - x, p.z - z) < .58)) continue;
      if (recs.some(h => { const dx = x - h.base.x, dz = z - h.base.z, v = dx * Math.sin(h.yaw) + dz * Math.cos(h.yaw), u = dx * Math.cos(h.yaw) - dz * Math.sin(h.yaw); return v > 0 && v < 2.6 && Math.abs(u) < .55 + v * .3; })) continue;
      const sc = .6 + rnd() * .55 * (r / ISL + .4);
      pines.push({ x, y: hill(x, z) - .03, z, s: sc, yaw: rnd() * 6.28, r: .42 * sc, h: 1.05 * sc });
    }
    const PK = kit();
    PK.add(cyl(.05, .22, 6), toy('#3a2a22', .9), 0, .1, 0);
    for (let k = 0; k < 3; k++) {
      const yb = .16 + k * .25, r = .42 - k * .1, th = .5;
      PK.add(new THREE.ConeGeometry(r, th, 9), toy(k % 2 ? PAL.pine : PAL.pine2, .85), 0, yb + th / 2, 0, 0, k * 1.1, 0);
      PK.add(new THREE.ConeGeometry(r * .5, th * .5, 9), snowMat, 0, yb + th * .76 + .01, 0, 0, k * 1.1, 0, 1.05, 1, 1.05);
    }
    instanced(PK.merged(), pines);
    // muñeco de nieve al principio del camino
    { const p = street(-.035), x = p.x * 1.16, z = p.z * 1.16, SK = kit();
      SK.add(new THREE.SphereGeometry(.2, 18, 14), snowMat, 0, .16, 0); SK.add(new THREE.SphereGeometry(.14, 18, 14), snowMat, 0, .45, 0); SK.add(new THREE.SphereGeometry(.1, 18, 14), snowMat, 0, .66, 0);
      SK.add(new THREE.ConeGeometry(.022, .12, 8), toy('#ff8a2a', .6), 0, .66, .1, Math.PI / 2, 0, 0);
      SK.add(new THREE.TorusGeometry(.1, .03, 8, 18), toy(PAL.vermilion, .8), 0, .57, 0, Math.PI / 2, 0, 0);
      SK.add(cyl(.07, .1, 14), inkMat, 0, .8, 0); SK.add(cyl(.11, .015, 18), inkMat, 0, .75, 0);
      instanced(SK.merged(), [{ x, y: hill(x, z), z, s: 1, yaw: Math.atan2(x, z), r: .25, h: .9 }]); }

    snow = snowPoints(); world.add(snow);
    motes = motePoints(); world.add(motes);
    applyStates(true);
    setLit(litLen);
    dirtyShadows(4);
  }
  const lampGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(PAL.candle).multiplyScalar(1.7), toneMapped: false }); lampGlow.userData.noShadow = true;
  let glass = null;

  /* ---------- nieve dentro de la bola, luciérnagas ---------- */
  let snow = null, motes = null, stars = null;
  const swirl = { a: 0, v: 0, ft: 0 };
  function snowPoints() {
    const n = reduce ? 700 : 2600, pos = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) { const r = Math.sqrt(Math.random()) * 6.9, a = Math.random() * Math.PI * 2; pos[i * 3] = r * Math.sin(a); pos[i * 3 + 1] = Math.random() * 10; pos[i * 3 + 2] = r * Math.cos(a); rnd[i] = Math.random(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { t: { value: 0 }, pr: { value: renderer.getPixelRatio() }, sw: { value: 0 }, ft: { value: 0 }, storm: { value: 0 }, C: { value: GC }, R: { value: GR - .2 } },
      vertexShader: `attribute float rnd; uniform float t, pr, sw, ft, storm, C, R; varying float vA;
        void main(){ vec3 p = position; float sp = .16 + rnd * .28;
          p.y = -.8 + mod(p.y - ft * sp + rnd * 40., 10.4);
          float a = sw * (.5 + rnd) * (1.2 - p.y * .05);
          p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
          p.x += sin(t * (.4 + rnd) + rnd * 30.) * .16; p.z += cos(t * (.3 + rnd) + rnd * 20.) * .12;
          float inside = step(length(p - vec3(0., C, 0.)), R) * step(rnd, .45 + .55 * storm);   // en calma nieva poco; al agitar, ventisca
          vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
          gl_PointSize = inside * min((1.4 + rnd * 3.) * (1. + storm * .5) * pr * (22. / -mv.z), 7. * pr);
          vA = inside * (.55 + rnd * .45) * smoothstep(.5, 2.2, -mv.z); }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(.96, .97, 1.), vA * (1. - smoothstep(.1, .5, d))); }`,
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 8;
    return p;
  }
  const MOTES = 120;
  const moteData = Array.from({ length: MOTES }, () => ({ life: 0 }));
  function motePoints() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
    g.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(MOTES), 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { pr: { value: renderer.getPixelRatio() } },
      vertexShader: `attribute float alpha; uniform float pr; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mv; gl_PointSize = min(7. * pr * (16. / -mv.z), 16. * pr); vA = alpha; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1.6, 1.2, .55, vA * (1. - smoothstep(0., .5, d))); }`,
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false;
    return p;
  }

  /* ---------- telón (pegado a la cámara) ---------- */
  const curtain = { group: new THREE.Group(), left: null, right: null, valance: null, open: 0 };
  camera.add(curtain.group);
  // luz propia del telón, pegada a la cámara; se apaga al recogerse (sigue en escena: sin recompilar)
  const stageKey = new THREE.DirectionalLight('#fff3e2', 1.5), stageKeyT = new THREE.Object3D();
  stageKey.position.set(-.45, .7, .6); stageKeyT.position.set(0, 0, -1); stageKey.target = stageKeyT;
  camera.add(stageKey, stageKeyT);
  const velvet = new THREE.MeshPhysicalMaterial({ color: PAL.vermilion, roughness: .9, sheen: .6, sheenRoughness: .6, sheenColor: new THREE.Color('#b8483a'), side: THREE.DoubleSide });
  function foldedPlane(w, h, folds, amp, segs = 120) {
    const g = new THREE.PlaneGeometry(w, h, segs, 1), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = (p.getX(i) / w) + .5; p.setZ(i, Math.sin(u * folds * Math.PI * 2) * amp + Math.sin(u * folds * 4.7) * amp * .25); }
    g.computeVertexNormals();
    return g;
  }
  function buildCurtain() {
    [curtain.left, curtain.right, curtain.valance, curtain.trim].forEach(m => { if (m) { curtain.group.remove(m); m.geometry.dispose(); } });
    const dist = .9, vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(35 / 2)) * 1.04, vw = vh * camera.aspect * 1.02;
    curtain.vw = vw; curtain.vh = vh;
    const pw = vw * .58, folds = Math.max(6, Math.round(pw / vh * 14));
    curtain.left = new THREE.Mesh(foldedPlane(pw, vh * 1.06, folds, vh * .012), velvet);
    curtain.right = new THREE.Mesh(foldedPlane(pw, vh * 1.06, folds, vh * .012), velvet);
    curtain.valance = new THREE.Mesh(foldedPlane(vw * 1.08, vh * .12, Math.round(folds * 1.6), vh * .006), velvet);
    curtain.trim = new THREE.Mesh(new THREE.PlaneGeometry(vw * 1.08, vh * .008), new THREE.MeshStandardMaterial({ color: PAL.gold, metalness: 0, roughness: .75, map: paperTex }));
    curtain.group.position.z = -dist;
    curtain.group.add(curtain.left, curtain.right, curtain.valance, curtain.trim);
    buildTitle();
    placeCurtain();
  }
  /* Título troquelado: papel con grosor (capas de canto) y sombra proyectada sobre el terciopelo */
  const title = { group: null, out: 0 };
  function cutText(text, font, stretch, face, edge, width, { metal = 0, rough = .55 } = {}) {
    const mk = () => { const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = font; try { g.fontStretch = stretch; } catch (e) { /* nada */ } return [c, g]; };
    const [c, g] = mk(), m = g.measureText(text), pad = 70;
    const asc = m.actualBoundingBoxAscent || 180, desc = m.actualBoundingBoxDescent || 40;
    c.width = Math.ceil(m.width + pad * 2); c.height = Math.ceil(asc + desc + pad * 2);
    const draw = (ctx, dx) => { ctx.font = font; try { ctx.fontStretch = stretch; } catch (e) { /* nada */ } ctx.fillText(text, pad + dx, pad + asc); };
    g.fillStyle = '#fff'; draw(g, 0);
    const sc = document.createElement('canvas'); sc.width = c.width; sc.height = c.height;
    const sg = sc.getContext('2d'); sg.shadowColor = '#000'; sg.shadowBlur = 30; sg.shadowOffsetX = c.width; sg.fillStyle = '#000'; draw(sg, -c.width);
    const alpha = new THREE.CanvasTexture(c), shadowTex = new THREE.CanvasTexture(sc);
    const w = width, h = width * c.height / c.width, geo = new THREE.PlaneGeometry(w, h);
    const grp = new THREE.Group();
    const sh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#2a0505', alphaMap: shadowTex, transparent: true, opacity: .6, depthWrite: false }));
    sh.position.set(w * .012, -h * .07, -.006);
    grp.add(sh);
    [.022, .014, .007].forEach((o, i) => {
      const e = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: edge, alphaMap: alpha, alphaTest: .5, roughness: .8 }));
      e.position.set(0, -h * o * .55, -.0012 * (3 - i)); grp.add(e);
    });
    const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: face, alphaMap: alpha, alphaTest: .5, map: paperTex, metalness: metal, roughness: rough }));
    grp.add(f);
    grp.userData.h = h; grp.userData.w = w;
    return grp;
  }
  function buildTitle() {
    if (title.group) { curtain.group.remove(title.group); title.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    const { vw, vh } = curtain, tg = new THREE.Group(), maxW = Math.min(vw * .84, vh * 1.05);
    const t1 = cutText('EL PUEBLO DE', `800 220px "${fontFamily}"`, 'condensed', PAL.gold, '#7a4f06', maxW, { metal: .2, rough: .62 });
    const t2 = cutText(name, 'italic 400 300px "Instrument Serif"', 'normal', PAL.snow, '#8f96b8', maxW * .95);
    t1.position.set(0, vh * .09, 0);
    t2.position.set(maxW * .03, vh * .09 - t1.userData.h * .58, .008); t2.rotation.z = -.07;
    const top = vh / 2, y1 = vh * .09 + t1.userData.h * .32;
    [-.36, .36].forEach(f => {
      const len = top - y1 + .02;
      const th = new THREE.Mesh(new THREE.PlaneGeometry(vw * .0022, len), new THREE.MeshStandardMaterial({ color: PAL.gold, metalness: 0, roughness: .8 }));
      th.position.set(f * t1.userData.w, y1 + len / 2, -.002); tg.add(th);
    });
    tg.add(t1, t2);
    tg.position.z = .03;
    curtain.group.add(tg); title.group = tg;
  }
  function placeCurtain() {
    if (!curtain.left) return;
    const s0 = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.tan(THREE.MathUtils.degToRad(35 / 2));
    curtain.group.scale.setScalar(s0);
    curtain.group.position.y = -((curtain.offY || 0) / vh0) * curtain.vh * s0;
    // se recoge hacia los lados y sale de cuadro: después solo queda el mundo, sin marco de teatro
    const { vw, vh } = curtain, pw = vw * .58, o = curtain.open, e = EASE.io(o), gather = lerp(1, .3, Math.min(1, o * 1.4));
    curtain.left.scale.x = curtain.right.scale.x = gather;
    const slide = e * (pw * gather + vw * .04);
    curtain.left.position.set(-vw / 2 + pw * gather / 2 - vw * .005 - slide, 0, -.01);
    curtain.right.position.set(vw / 2 - pw * gather / 2 + vw * .005 + slide, 0, 0);
    curtain.left.rotation.z = -o * .03; curtain.right.rotation.z = o * .03;
    const up = e * vh * .2;
    curtain.valance.position.set(0, vh / 2 - vh * .05 + up, .02);
    curtain.trim.position.set(0, vh / 2 - vh * .11 + up, .03);
    curtain.group.visible = o < .999;
    stageKey.intensity = 1.5 * (1 - Math.min(1, o * 1.6));
  }

  /* ---------- cámara: órbita esférica alrededor de un punto ---------- */
  const cam = { t: V(0, 1, 0), yaw: 0, pitch: .5, dist: 30, fov: 35 };
  const peek = { yaw: 0, pitch: 0 }, orbit = { v: 0, idle: 0, auto: 0 };
  const insets = { top: 0, bottom: 0 };
  let vw0 = 1, vh0 = 1, ov = null;
  const freeFrac = () => Math.max(.35, (vh0 - insets.top - insets.bottom) / vh0);
  const dirOf = (yaw, pitch) => V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  function fitDist(w, h, fov = 35) {
    const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    return Math.max((h / 2) / (t * freeFrac()), (w / 2) / (t * camera.aspect));
  }
  function applyInsets() {
    const off = (insets.bottom - insets.top) / 2;
    camera.setViewOffset(vw0, vh0, 0, off, vw0, vh0);
    curtain.offY = off;
  }
  // Encuadre medido: proyecta puntos y ajusta distancia y altura hasta que caben en el hueco libre
  function fitPose(pts, t0, pitch, fov, xLim) {
    const c2 = new THREE.PerspectiveCamera().copy(camera, false); c2.fov = fov; c2.updateProjectionMatrix();
    const yTop = 1 - 2 * insets.top / vh0 - .03, yBot = -1 + 2 * insets.bottom / vh0 + .03;
    const t = t0.clone(), dir = dirOf(0, pitch), v = V(); let dist = 30;
    for (let i = 0; i < 16; i++) {
      c2.position.copy(t).addScaledVector(dir, dist); c2.lookAt(t); c2.updateMatrixWorld();
      let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (const p of pts) { v.copy(p).project(c2); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      const s = Math.max((x1 - x0) / (2 * xLim), (y1 - y0) / (yTop - yBot));
      t.y += ((y0 + y1) / 2 - (yTop + yBot) / 2) * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * dist * .8 / Math.cos(pitch);
      dist *= s;
    }
    return { t, pitch, dist, fov };
  }
  function overviewPose() {
    const pts = [];
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push(V(Math.sin(a) * (ISL - .3), .1, Math.cos(a) * (ISL - .3))); }
    pts.push(V(0, 5.1, 0));
    return fitPose(pts, V(0, 1.1, 0), layout.portrait ? .6 : .5, 35, layout.portrait ? 1.06 : .9);
  }
  function globePose() {
    const pts = [];
    for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; for (const la of [-.4, 0, .4, .8, 1.2]) pts.push(V(Math.sin(a) * Math.cos(la) * GR, GC + Math.sin(la) * GR, Math.cos(a) * Math.cos(la) * GR)); pts.push(V(Math.sin(a) * 7.2, -3, Math.cos(a) * 7.2)); }
    pts.push(V(0, GC + GR, 0));
    return fitPose(pts, V(0, GC - 1, 0), .12, 35, layout.portrait ? .84 : .7);
  }
  // Grúa que esquiva: prueba varios ángulos y elige el que menos casas tapa (y el árbol nunca)
  function blockers(pos, t, d, extra = 0) {
    const out = []; let tree = false;
    const sx = t.x - pos.x, sz = t.z - pos.z, L2 = sx * sx + sz * sz || 1;
    const yb = t.y - (houses[d].tree ? 1.6 : houses[d].h * .42);
    const hit = (c, rad, top, cone) => {
      const u = clamp(((c.x - pos.x) * sx + (c.z - pos.z) * sz) / L2, 0, 1);
      if (u > .93) return false;
      const dx = pos.x + sx * u - c.x, dz = pos.z + sz * u - c.z;
      return Math.hypot(dx, dz) < rad + (1 - u) * cone && lerp(pos.y, yb, u) < top;
    };
    for (let k = 0; k <= 24; k++) {
      if (k === d) continue;
      const h = houses[k];
      if (hit(h.base, (h.tree ? 1.35 : Math.max(h.w, h.dep) * .62 + .14) + extra, h.base.y + h.h + .15, .3)) { if (h.tree) tree = true; else out.push(k); }
    }
    const pr = props.filter(p => hit(p, p.r + .1 + extra * .4, p.y + p.h + .1, .9));
    return { out, tree, props: pr };
  }
  function focusPose(d) {
    const h = houses[d], portrait = layout.portrait;
    const t = h.tree ? V(0, h.base.y + 1.85, 0) : h.base.clone().add(V(0, h.h * .42, 0));
    const dist = h.tree ? fitDist(3.2, 4.4) : fitDist(h.w * (portrait ? 1.9 : 2.2), h.h * 2.1);
    const yaw0 = h.tree ? cam.yaw : h.yaw;
    let best = null;
    for (const dy of [0, .3, -.3, .6, -.6, .9, -.9, 1.2, -1.2]) {
      const yaw = yaw0 + dy; let pitch = h.tree ? .2 : .3, pos;
      for (let i = 0; i < 8; i++) { pos = t.clone().addScaledVector(dirOf(yaw, pitch), dist); if (pos.y > hill(pos.x, pos.z) + .5) break; pitch += .09; }
      const b = blockers(pos, t, d, h.tree ? .9 : 0), score = Math.abs(dy) * .7 + b.out.length * .45 + (b.tree ? 20 : 0) + (pitch - .3) * 1.5;
      if (!best || score < best.score) best = { score, yaw, pitch, sink: b.out, props: b.props };
    }
    return { t, yaw: best.yaw, pitch: best.pitch, dist, fov: 35, sink: best.sink, props: best.props };
  }
  let camTw = null;
  function flyTo(pose, dur = 1400, easeFn = EASE.io) {
    if (camTw) { tweens.delete(camTw); camTw.res(); camTw = null; }
    orbit.v = 0;
    if (reduce) dur = 1;
    const a = { t: cam.t.clone(), yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, fov: cam.fov };
    let dy = (pose.yaw ?? a.yaw) - a.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const travel = a.t.distanceTo(pose.t), lift = Math.min(.5, travel * .06 + Math.abs(dy) * .12);
    const l0 = Math.log(a.dist), l1 = Math.log(pose.dist);
    const p = tween(dur, q => {
      const e = easeFn(q), arc = Math.sin(Math.PI * e);
      cam.t.lerpVectors(a.t, pose.t, e);
      cam.yaw = a.yaw + dy * e;
      cam.pitch = lerp(a.pitch, pose.pitch, e) + arc * lift * .25;
      cam.dist = Math.exp(lerp(l0, l1, e)) * (1 + arc * lift);
      cam.fov = lerp(a.fov, pose.fov, e);
    });
    camTw = p.tw;
    p.then(() => { if (camTw === p.tw) camTw = null; });
    return p;
  }
  const camPos = V();
  function applyCamera(dt) {
    if (!pd && !camTw) {
      if (Math.abs(orbit.v) > 1e-4) { cam.yaw += orbit.v * dt; orbit.v *= Math.exp(-dt * 3.2); }
      orbit.idle += dt;
      orbit.auto = lerp(orbit.auto, mode === 'overview' && interactive && orbit.idle > 4 && !reduce ? 1 : 0, Math.min(1, dt * .8));
      cam.yaw += orbit.auto * .045 * dt;
      peek.yaw *= Math.exp(-dt * 6); peek.pitch *= Math.exp(-dt * 6);
    }
    const yaw = cam.yaw + peek.yaw + tilt.x * .07, pitch = clamp(cam.pitch + peek.pitch + tilt.y * .035, -.1, 1.4);
    camPos.copy(cam.t).addScaledVector(dirOf(yaw, pitch), cam.dist);
    camera.position.copy(camPos);
    camera.lookAt(cam.t);
    if (Math.abs(camera.fov - cam.fov) > .001) { camera.fov = cam.fov; camera.updateProjectionMatrix(); placeCurtain(); }
  }

  /* ---------- tweens ---------- */
  const tweens = new Set();
  function tween(dur, fn) {
    let tw;
    const p = new Promise(res => { tw = { t0: performance.now(), dur: Math.max(1, dur), fn, res }; tweens.add(tw); });
    p.tw = tw;
    return p;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- estado → luz ---------- */
  let states = {}, today = 0, treeLit = 0;
  function applyStates(instant) {
    for (let k = 0; k <= 24; k++) {
      const h = houses[k]; if (!h) continue;
      const s = states[k] || 'locked';
      h.state = s;
      h.glowTgt = s === 'opened' ? 1 : s === 'available' ? .45 : 0;
      if (h.bulbs) h.bulbs.visible = s === 'opened' && !h.pre;
      h.medal.material.map = medalTexture(k, s); h.medal.material.needsUpdate = true;
      if (instant) h.glowCur = h.pre ? 0 : h.glowTgt;
    }
    const T = houses[24];
    if (T) {
      const lit = Math.min(24, treeLit), col = new THREE.Color();
      for (let n = 0; n < 24; n++) T.baubles.setColorAt(n, n < lit ? col.set(BULB[n % BULB.length]).multiplyScalar(1.15) : col.set('#2e3456'));
      T.baubles.instanceColor.needsUpdate = true;
      T.garland.count = Math.round(72 * lit / 24);
      const on = states[24] === 'opened';
      T.starMat.emissive.set(on ? PAL.gold : '#000000'); T.starMat.emissiveIntensity = on ? 1.8 : 0;
      treeLight.intensity = lit ? 1.5 + lit / 24 * 5 : 0;
    }
    dirtyShadows(30);
  }

  /* ---------- hilo de oro ---------- */
  let litLen = 0;
  function setLit(u) {
    litLen = u;
    if (!tube) return;
    tube.geometry.setDrawRange(0, Math.round(u * tubeSegs) * 6 * 6);
  }
  const uOf = n => (n < 0 ? 0 : uAt[Math.min(24, n)]);

  /* ---------- bucle ---------- */
  const clock = new THREE.Clock();
  let raf = 0, running = true, lastT = 0, moteAcc = 0;
  const tmpC = new THREE.Color(), tmpV = V();
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const t = clock.getElapsedTime(), dt = Math.min(.05, t - lastT); lastT = t;
    const now = performance.now();
    for (const tw of [...tweens]) {
      const p = Math.min(1, (now - tw.t0) / tw.dur);
      tw.fn(p);
      if (p >= 1) { tweens.delete(tw); tw.res(); }
    }
    applyCamera(dt);
    const pxWorld = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / vh0;
    for (let k = 0; k <= 24; k++) {
      const h = houses[k]; if (!h) continue;
      if (Math.abs(h.sinkTgt - h.sinkCur) > .0005) { h.sinkCur += (h.sinkTgt - h.sinkCur) * Math.min(1, dt * 5); h.g.position.y = h.base.y + h.sinkCur; dirtyShadows(1); }
      const gt = h.pre ? 0 : h.glowTgt;
      h.glowCur += (gt - h.glowCur) * Math.min(1, dt * 3);
      if (h.glowMat) {
        const flick = h.state === 'available' ? .82 + .18 * Math.sin(t * 5.3 + k) * Math.sin(t * 2.1 + k * 3) : h.state === 'opened' ? .94 + .06 * Math.sin(t * 7 + k * 1.7) : 1;
        const col = h.glowCur > .5 ? tmpC.copy(C_AVAIL).lerp(C_OPEN, (h.glowCur - .45) / .55) : tmpC.copy(C_LOCKED).lerp(C_AVAIL, h.glowCur / .45);
        h.glowMat.color.copy(col).multiplyScalar(h.flash ? 1 + h.flash : flick);
        h.pool.material.opacity = Math.max(0, h.glowCur - .3) * .75 * flick;
      }
      if (h.door && Math.abs(h.doorTgt - h.doorCur) > .001) { h.doorCur += (h.doorTgt - h.doorCur) * Math.min(1, dt * 5.5); h.door.pivot.rotation.y = -h.doorCur * 1.95; dirtyShadows(1); }
      if (h.bulbs && h.bulbs.visible && Math.random() < .25) {
        const i = Math.floor(Math.random() * h.bulbs.count);
        h.bulbs.setColorAt(i, tmpC.set(h.bulbs.userData.base[i]).multiplyScalar(Math.random() < .3 ? .6 : 2.2));
        h.bulbs.instanceColor.needsUpdate = true;
      }
      const smokeOn = h.state === 'opened' && !h.pre;
      h.smoke.forEach(s => {
        const ph = (t * .2 + s.userData.phase) % 1;
        s.material.opacity = smokeOn ? Math.sin(ph * Math.PI) * .3 : 0;
        s.position.y = s.userData.y0 + ph * .7; s.position.x += Math.sin(t + ph * 6) * .0005;
        s.scale.setScalar(.12 + ph * .38);
      });
      if (h.flags) h.flags.forEach((f, i) => { f.scale.x = .8 + .2 * Math.sin(t * 4 + i * 2); f.rotation.y = Math.sin(t * 3 + i) * .4; });
      if (h.ripple.userData.t0 !== undefined) {
        const p = Math.min(1, (now - h.ripple.userData.t0) / 1300);
        h.ripple.visible = true; h.ripple.scale.setScalar(.2 + EASE.out(p) * (h.tree ? 3 : 1.6)); h.ripple.material.opacity = (1 - p) * .9;
        if (p >= 1) { delete h.ripple.userData.t0; h.ripple.visible = false; }
      }
      // medallas a tamaño constante en pantalla: siempre legibles, cerca o lejos
      const m = h.medal;
      if (mode === 'focus' && k === focusDay) m.visible = false;
      else {
        m.visible = true;
        m.getWorldPosition(tmpV);
        const px = (mode === 'focus' ? 24 : layout.portrait ? 30 : 34) * (h.state === 'available' ? 1 + .07 * Math.sin(t * 4 + k) : 1);
        m.scale.setScalar(tmpV.distanceTo(camera.position) * pxWorld * px);
      }
    }
    if (houses[24]) houses[24].star.rotation.y = t * .6;
    for (const p of props) if (Math.abs(p.sinkTgt - p.sinkCur) > .0005) { p.sinkCur += (p.sinkTgt - p.sinkCur) * Math.min(1, dt * 5); placeProp(p); dirtyShadows(1); }
    // luciérnagas desde las puertas disponibles
    if (motes) {
      moteAcc += dt;
      if (moteAcc > .12 && !reduce) {
        moteAcc = 0;
        for (let k = 0; k <= 23; k++) if (houses[k].state === 'available' && Math.random() < .5) spawnMote(houses[k]);
      }
      const pa = motes.geometry.attributes.position, al = motes.geometry.attributes.alpha;
      moteData.forEach((m, i) => {
        if (m.life <= 0) { al.setX(i, 0); return; }
        m.life -= dt * .4; m.y += dt * .28; m.x += Math.sin(t * 2 + i) * dt * .06;
        pa.setXYZ(i, m.x, m.y, m.z); al.setX(i, Math.sin(Math.max(0, m.life) * Math.PI) * .9);
      });
      pa.needsUpdate = true; al.needsUpdate = true;
    }
    // remolino de nieve al agitar
    swirl.a += swirl.v * dt; swirl.v *= Math.exp(-dt * .9);
    const storm = Math.min(1, Math.abs(swirl.v) / 2.5);
    swirl.ft += dt * (1 - 2.6 * storm);      // al agitar, la nieve sube y gira como en una bola de verdad
    if (snow) { const u = snow.material.uniforms; u.t.value = t; u.sw.value = swirl.a; u.ft.value = swirl.ft; u.storm.value = storm; }
    if (stars) stars.material.uniforms.t.value = t;
    auroraT.value = t; sparkle.value = t;
    if (title.group) { title.group.rotation.z = Math.sin(t * .8) * .012 * (1 - title.out); title.group.position.y = EASE.io(title.out) * curtain.vh * 1.15; title.group.visible = title.out < 1; }
    if (shadowFrames > 0) { renderer.shadowMap.needsUpdate = true; shadowFrames--; }
    composer.render();
  }
  let moteIdx = 0;
  function spawnMote(h) {
    const m = moteData[moteIdx = (moteIdx + 1) % MOTES];
    h.g.localToWorld(tmpV.set(h.door ? h.door.x : 0, .2 + Math.random() * .2, h.F + .15));
    m.life = 1; m.x = tmpV.x + (Math.random() - .5) * .3; m.y = tmpV.y; m.z = tmpV.z + (Math.random() - .5) * .3;
  }

  /* ---------- tamaño ---------- */
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h; vw0 = w; vh0 = h; applyInsets(); camera.updateProjectionMatrix();
    layout.portrait = w / h < .9;
    if (!world) build();
    buildCurtain();
    ov = overviewPose();
    if (mode === 'overview' && !camTw && interactive) Object.assign(cam, { t: ov.t.clone(), dist: ov.dist, pitch: ov.pitch });
    else if (mode === 'focus' && focusDay != null && !camTw) { const f = focusPose(focusDay); Object.assign(cam, { t: f.t, dist: f.dist }); }
  }

  /* ---------- entrada: arrastrar gira la bola, pellizcar acerca, tocar elige ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const ptrs = new Map();
  let pd = null, pinch = null, onPick = () => {}, interactive = false, mode = 'overview', focusDay = null, tilt = { x: 0, y: 0 };
  const zoomLim = () => [ov.dist * .38, ov.dist * 1.2];
  canvas.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    orbit.idle = 0;
    if (ptrs.size === 1) { pd = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false }; orbit.v = 0; }
    else if (ptrs.size === 2 && mode === 'overview' && !camTw) {
      const [a, b] = [...ptrs.values()]; pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), dist0: cam.dist }; if (pd) pd.moved = true;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!interactive) return;
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()], [lo, hi] = zoomLim();
      cam.dist = clamp(pinch.dist0 * pinch.d0 / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y)), lo, hi);
      return;
    }
    if (!pd || e.pointerId !== pd.id) return;
    const now = performance.now(), dx = e.clientX - pd.lx, dy = e.clientY - pd.ly, dtm = Math.max(1, now - pd.lt);
    if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) > 7) pd.moved = true;
    if (!pd.moved) return;
    const k = Math.PI * 1.25 / Math.min(innerWidth, 900);
    if (mode === 'overview' && !camTw) {
      cam.yaw -= dx * k;
      cam.pitch = clamp(cam.pitch + dy * k * .6, .18, 1.2);
      orbit.v = lerp(orbit.v, -dx * k / (dtm / 1000), .5);
      if (Math.abs(dx / dtm) > 2.2) api.shake(.6);
    } else {
      peek.yaw = clamp(peek.yaw - dx * k * .6, -.55, .55);
      peek.pitch = clamp(peek.pitch + dy * k * .3, -.12, .3);
    }
    pd.lx = e.clientX; pd.ly = e.clientY; pd.lt = now;
  });
  const release = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!pd || e.pointerId !== pd.id) return;
    const moved = pd.moved, held = performance.now() - pd.lt; pd = null;
    if (moved) { orbit.v = held > 90 ? 0 : clamp(orbit.v, -5, 5); return; }
    orbit.v = 0;
    if (!interactive || e.type === 'pointercancel') return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables.filter(o => o.visible !== false), false)[0];
    onPick(hit ? hit.object.userData.day : null);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('wheel', e => {
    if (!interactive || mode !== 'overview' || camTw) return;
    e.preventDefault(); orbit.idle = 0;
    const [lo, hi] = zoomLim(); cam.dist = clamp(cam.dist * Math.exp(e.deltaY * .0012), lo, hi);
  }, { passive: false });

  /* ---------- API ---------- */
  const api = {
    renderer, scene, camera,
    start() { resize(); frame(); },
    resize,
    pause(p) { running = !p; if (!p) clock.getDelta(); },
    onPick(fn) { onPick = fn; },
    setInteractive(v) { interactive = v; },
    setTilt(x, y) { tilt = { x, y }; },
    setInsets(top, bottom) {
      insets.top = top; insets.bottom = bottom; applyInsets(); camera.updateProjectionMatrix(); placeCurtain();
      if (!world) return;
      ov = overviewPose();
      if (mode === 'overview' && !camTw && interactive) Object.assign(cam, { t: ov.t.clone(), dist: ov.dist });
    },
    get mode() { return mode; },
    get focused() { return focusDay; },
    setStates(s, t, lit) { states = s; today = t; treeLit = lit; applyStates(false); },
    prepareIntro(list) { list.forEach(d => { houses[d].pre = true; houses[d].glowCur = 0; if (houses[d].bulbs) houses[d].bulbs.visible = false; }); },
    powerOn(d, loud = true) {
      const h = houses[d]; if (!h) return;
      h.pre = false;
      if (h.bulbs) h.bulbs.visible = h.state === 'opened';
      h.ripple.userData.t0 = performance.now();
      if (loud && !reduce) { h.flash = 1.6; tween(900, p => { h.flash = p < 1 ? (1 - p) * 1.6 * (p < .2 && Math.floor(p * 30) % 2 ? .1 : 1) : 0; }).then(() => { h.flash = 0; }); }
    },
    curtainTo(open, dur = 1700) {
      const o0 = curtain.open;
      return tween(reduce ? 1 : dur, p => { curtain.open = lerp(o0, open, p); placeCurtain(); });
    },
    titleOut(dur = 1100) { const o0 = title.out; return tween(reduce ? 1 : dur, p => { title.out = lerp(o0, 1, p); }); },
    doorAnchor(d) {
      const h = houses[d]; if (!h || !h.door) return null;
      const w = h.g.localToWorld(V(h.door.x + h.door.dw / 2 + .04, h.door.dh * .45, h.F + .06)).project(camera), r = canvas.getBoundingClientRect();
      if (w.z > 1) return null;
      return [(w.x + 1) / 2 * r.width + r.left, (1 - w.y) / 2 * r.height + r.top];
    },
    setDoor(d, f, instant) {
      const h = houses[d]; if (!h || !h.door) return;
      h.doorTgt = f;
      if (instant) { h.doorCur = f; h.door.pivot.rotation.y = -f * 1.95; }
      dirtyShadows(3);
    },
    reveal(dur = 2600) { return flyTo({ ...globePose(), yaw: -.12 }, dur, EASE.out); },
    overview(dur = 1500) {
      mode = 'overview'; focusDay = null; orbit.idle = 0;
      for (let k = 0; k <= 24; k++) houses[k].sinkTgt = 0;
      props.forEach(p => { p.sinkTgt = 0; });
      doorLight.intensity = 0;
      ov = overviewPose();
      return flyTo({ ...ov, t: ov.t.clone(), yaw: cam.yaw }, dur);
    },
    focus(d, dur = 1300) {
      mode = 'focus'; focusDay = d;
      const pose = focusPose(d);
      for (let k = 0; k <= 24; k++) houses[k].sinkTgt = pose.sink.includes(k) ? -(houses[k].h + .7) : 0;
      props.forEach(p => { p.sinkTgt = pose.props.includes(p) ? -(p.h + .25) : 0; });
      return flyTo(pose, dur);
    },
    introPose() {     // la bola entera, de lado, para el descubrimiento tras el telón
      const g = globePose();
      Object.assign(cam, { t: g.t.clone(), yaw: -.6, pitch: .02, dist: g.dist * 1.3, fov: 35 });
    },
    async openDoor(d) {
      const h = houses[d];
      if (!h.door) { h.flash = 2; return; }
      h.doorTgt = 1; dirtyShadows(40);
      const dp = h.g.localToWorld(V(h.door.x, h.door.dh * .5, h.F));
      doorLight.position.copy(h.g.localToWorld(V(h.door.x, h.door.dh * .6, h.F + .35)));
      tween(reduce ? 1 : 700, p => { doorLight.intensity = p * 2.5; });
      await wait(reduce ? 0 : 480);
      // travelling a través de la puerta
      const fwd = V(Math.sin(h.yaw), 0, Math.cos(h.yaw));
      await flyTo({ t: dp.clone().addScaledVector(fwd, -1.2), yaw: h.yaw, pitch: .02, dist: 1.45, fov: 52 }, reduce ? 1 : 950, EASE.io);
    },
    closeDoor(d) { const h = houses[d]; if (h && h.door) { h.doorTgt = 0; dirtyShadows(40); } tween(reduce ? 1 : 900, p => { doorLight.intensity = (1 - p) * 2.5; }); },
    tease(d) {
      const h = houses[d]; if (!h) return;
      const lock = h.lock, inner = lock.children[0];
      lock.visible = true;
      const r0 = h.yaw;
      tween(reduce ? 1 : 1500, p => {
        h.g.rotation.y = r0 + Math.sin(p * Math.PI * 9) * .05 * (1 - p);
        inner.position.y = -.07 + (p < .12 ? (1 - p / .12) * .1 : 0);
        lock.rotation.z = Math.sin(p * Math.PI * 7) * .5 * Math.pow(1 - p, 1.4);
        lock.scale.setScalar(p > .85 ? 1 - (p - .85) / .15 : 1);
      }).then(() => { lock.visible = false; lock.scale.setScalar(1); h.g.rotation.y = r0; });
    },
    pulse(d) { const h = houses[d]; if (h) h.ripple.userData.t0 = performance.now(); },
    shake(f = 1) { if (!reduce) swirl.v = clamp(swirl.v + f * 3, -6, 6); },
    growPath(n, dur) {
      const from = litLen, to = uOf(n);
      if (reduce || Math.abs(to - from) < 1e-4) { setLit(to); return Promise.resolve(); }
      dur = dur || Math.max(700, Math.min(2600, Math.abs(to - from) * 5200));
      spark.visible = true;
      return tween(dur, p => {
        const u = lerp(from, to, EASE.io(p)); setLit(u);
        spark.position.copy(curve.getPointAt(clamp(u, 0, 1)));
        spark.scale.setScalar(.8 + Math.sin(p * 40) * .25);
      }).then(() => { spark.visible = false; });
    },
    setLitInstant(n) { setLit(uOf(n)); },
    screenOf(d) {
      const h = houses[d]; if (!h) return null;
      const v = h.g.localToWorld(V(h.door ? h.door.x : 0, h.tree ? 1.6 : h.doorH * .7, h.F + .1)).project(camera);
      const r = canvas.getBoundingClientRect();
      return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top];
    },
    setAdorno(url) {
      if (!url || !houses[24]) return;
      new THREE.TextureLoader().load(url, tex => { tex.colorSpace = THREE.SRGBColorSpace; const a = houses[24].adorno; a.material.map = tex; a.material.needsUpdate = true; a.visible = true; });
    },
  };
  addEventListener('resize', () => resize());
  return api;
}
