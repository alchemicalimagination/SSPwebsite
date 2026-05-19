// Scripts are at bottom of body — DOM + CDN libs are ready

gsap.registerPlugin(ScrollTrigger);

// ── SMOOTH SCROLL ──────────────────────────────────────
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ── FLOWER SCROLL ANIMATION ────────────────────────────
const flowerCanvas = document.getElementById('flower-canvas');
const flowerCtx    = flowerCanvas.getContext('2d');
const FRAME_COUNT  = 121;
const frames       = [];
let   loadedCount  = 0;
let   flowerFrame  = 0;

function padNum(n) { return String(n).padStart(3, '0'); }

function resizeFlower() {
  const dpr = window.devicePixelRatio || 1;
  flowerCanvas.width  = window.innerWidth  * dpr;
  flowerCanvas.height = window.innerHeight * dpr;
  flowerCtx.scale(dpr, dpr);
  flowerCtx.fillStyle = '#f5f3f0';
  flowerCtx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  renderFlower(flowerFrame);
}

function renderFlower(index) {
  const img = frames[index];
  if (!img || !img.complete) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth  * scale;
  const h = img.naturalHeight * scale;
  flowerCtx.imageSmoothingEnabled = true;
  flowerCtx.imageSmoothingQuality = 'high';
  flowerCtx.clearRect(0, 0, W, H);
  flowerCtx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  renderASCII();
}

// ── ASCII OVERLAY ───────────────────────────────────────
const asciiCanvas = document.getElementById('ascii-overlay');
const asciiCtx    = asciiCanvas.getContext('2d');
const CELL        = 11;
const CHAR        = '·';  // single char — opacity carries all the grain

function resizeASCII() {
  asciiCanvas.width  = window.innerWidth;
  asciiCanvas.height = window.innerHeight;
}
resizeASCII();
window.addEventListener('resize', resizeASCII);

// scroll progress 0→1 for fade-out
let asciiScrollProgress = 0;
lenis.on('scroll', ({ scroll }) => {
  asciiScrollProgress = Math.min(scroll / (window.innerHeight * 1.2), 1);
});

function renderASCII() {
  const W        = window.innerWidth;
  const H        = window.innerHeight;
  const dpr      = window.devicePixelRatio || 1;
  const flicker  = (Math.sin(Date.now() * 0.003) * 0.04);  // subtle breathe
  const fadeOut  = 1 - asciiScrollProgress;                 // fades as you scroll
  let   imgData;
  try { imgData = flowerCtx.getImageData(0, 0, flowerCanvas.width, flowerCanvas.height); }
  catch(e) { return; }

  asciiCtx.clearRect(0, 0, W, H);
  asciiCtx.font         = `${CELL}px "Courier New", monospace`;
  asciiCtx.textAlign    = 'left';
  asciiCtx.textBaseline = 'top';

  for (let y = 0; y < H; y += CELL) {
    for (let x = 0; x < W; x += CELL) {
      const px  = Math.min(Math.floor(x * dpr), flowerCanvas.width  - 1);
      const py  = Math.min(Math.floor(y * dpr), flowerCanvas.height - 1);
      const i   = (py * flowerCanvas.width + px) * 4;
      const r   = imgData.data[i];
      const g   = imgData.data[i + 1];
      const b   = imgData.data[i + 2];
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const inv = 1 - lum;
      if (inv < 0.15) continue;  // skip very bright areas
      const opacity = Math.max(0, (inv * 0.65 + flicker) * fadeOut);
      // use actual pixel colour tinted toward white
      const tr = Math.round(r + (255 - r) * 0.5);
      const tg = Math.round(g + (255 - g) * 0.5);
      const tb = Math.round(b + (255 - b) * 0.5);
      asciiCtx.fillStyle = `rgba(${tr},${tg},${tb},${opacity.toFixed(2)})`;
      asciiCtx.fillText(CHAR, x, y);
    }
  }
}

for (let i = 1; i <= FRAME_COUNT; i++) {
  const img = new Image();
  img.src = `./flower%20sequence/ezgif-8a7cfed939556aa3-jpg/ezgif-frame-${padNum(i)}.jpg`;
  img.onload = () => { loadedCount++; if (loadedCount === 1) renderFlower(0); };
  frames.push(img);
}

lenis.on('scroll', ({ scroll }) => {
  // Complete animation over first 6 viewport heights of scroll
  const targetScroll = window.innerHeight * 2;
  const progress     = (scroll / targetScroll) % 1;
  const idx          = Math.floor(progress * FRAME_COUNT);
  if (idx !== flowerFrame) { flowerFrame = idx; renderFlower(idx); }
});

window.addEventListener('resize', resizeFlower);
resizeFlower();

// ── VERTICAL MARQUEES ──────────────────────────────────
gsap.fromTo('.left-marquee-track', { y: '-50%' }, { y: '0%', duration: 22, ease: 'none', repeat: -1 });

// ── THREE.JS SCENE ─────────────────────────────────────
try {
  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f3f0);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 3;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xf5f3f0, 1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2;

  document.getElementById('model-wrap').appendChild(renderer.domElement);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 3));
  const dir = new THREE.DirectionalLight(0xffffff, 2);
  dir.position.set(5, 10, 7.5);
  scene.add(dir);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xeeeeee, 1.5));

  let model = null;
  let isFloating = true;
  let scrollY = 0;

  // Load model (placeholder — replace with your asset)
  const loader = new THREE.GLTFLoader();
  loader.load('./assets/model.glb',
    (gltf) => {
      model = gltf.scene;
      model.traverse(n => {
        if (n.isMesh && n.material) {
          n.material.metalness = 0.3;
          n.material.roughness = 0.4;
        }
      });
      const box    = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size   = box.getSize(new THREE.Vector3());
      camera.position.z = Math.max(size.x, size.y, size.z) * 1.5;
      model.scale.set(0, 0, 0);
      scene.add(model);
      gsap.to(model.scale, { x: 1, y: 1, z: 1, duration: 1, ease: 'power2.out' });
    },
    undefined,
    () => {} // no model yet — plain background shows
  );

  lenis.on('scroll', e => { scrollY = e.scroll; });

  // Model floats until card section
  const scanEl = document.getElementById('s-scan');
  if (scanEl) {
    ScrollTrigger.create({
      trigger: '#s-scan',
      start: 'top 80%',
      onEnter:     () => { isFloating = false; },
      onLeaveBack: () => { isFloating = true;  }
    });
  }

  // Animate
  (function tick() {
    requestAnimationFrame(tick);
    if (model) {
      if (isFloating) model.position.y = Math.sin(Date.now() * 0.0015) * 0.18;
      const scanTop  = scanEl ? scanEl.offsetTop : 1;
      const progress = Math.min(scrollY / scanTop, 1);
      if (progress < 1) {
        model.rotation.x  = progress * Math.PI * 2;
        model.rotation.y += 0.0003;
      }
    }
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

} catch(e) {
  console.warn('Three.js init failed:', e);
}

// ── CARD ANIMATION: reveal internals → collapse to square (scroll-scrubbed) ──
const card01 = document.getElementById('pcard-01');

gsap.set('#pcard-01', { overflow: 'hidden' });
// Start fully empty — all content and dividers hidden
gsap.set('#pcard-01 .num-next',    { x: 120, opacity: 0 });
gsap.set('#pcard-01 .label-next',  { x: 40,  opacity: 0 });
gsap.set(['#pcard-01 .num-current', '#pcard-01 .label-current', '#pcard-01 .pc-bc-wrap', '#pcard-01 .pc-purchased', '#pcard-01 .pm'], { opacity: 0, x: -30 });
gsap.set(['#pcard-01 .pc-tag', '#pcard-01 .pc-ing'], { opacity: 0, x: 30 });
gsap.set('#pcard-01 .pc-mid', { opacity: 0 });
gsap.set('#pcard-01 .pc-top', { borderBottomColor: 'transparent' });
gsap.set('#pcard-01 .pc-bot', { borderTopColor: 'transparent' });

// PHASE 1: elements slide in as card enters viewport (before pin)
const cardRevealTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan',
    start: 'top 80%',
    end: 'top top',
    scrub: 1.2
  }
});
cardRevealTl
  .to('#pcard-01 .pc-top', { borderBottomColor: 'rgba(0,0,0,0.1)', duration: 0.3 }, 0)
  .to('#pcard-01 .pc-bot', { borderTopColor: 'rgba(0,0,0,0.12)',   duration: 0.3 }, 0)
  .to('#pcard-01 .num-current',   { opacity: 1, x: 0, duration: 0.5 }, 0.1)
  .to('#pcard-01 .label-current', { opacity: 1, x: 0, duration: 0.5 }, 0.2)
  .to('#pcard-01 .pc-tag',        { opacity: 1, x: 0, duration: 0.5 }, 0.25)
  .to('#pcard-01 .pc-mid',       { opacity: 1,        duration: 0.5 }, 0.4)
  .to('#pcard-01 .pc-bc-wrap',   { opacity: 1, x: 0, duration: 0.5 }, 0.5)
  .to('#pcard-01 .pc-purchased', { opacity: 1, x: 0, duration: 0.5 }, 0.6)
  .to('#pcard-01 .pm',           { opacity: 1, x: 0, stagger: 0.05, duration: 0.4 }, 0.7)
  .to('#pcard-01 .pc-ing',       { opacity: 1, x: 0, duration: 0.5 }, 1.0);

// PHASE 2: card collapses to small square (pinned)
const cardCollapseTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan',
    start: 'top top',
    end: `+=${window.innerHeight}`,
    scrub: 1.5,
    pin: true
  }
});
cardCollapseTl
  .to(['#pcard-01 .pc-tag',
       '#pcard-01 .pc-mid', '#pcard-01 .pc-bc-wrap', '#pcard-01 .pc-purchased',
       '#pcard-01 .pm', '#pcard-01 .pc-ing'],
    { opacity: 0, duration: 0.6 }, 0)
  .to('#pcard-01 .pc-top', { borderBottomColor: 'transparent', duration: 0.3 }, 0)
  .to('#pcard-01 .pc-bot', { borderTopColor:    'transparent', duration: 0.3 }, 0)
  .to('#pcard-01', { width: 110, height: 110, minHeight: 110, ease: 'power2.inOut', duration: 1 }, 0.5)
  // PHASE 3: #01+INTELLIGENT INVENTORY slide out left, #02+CLIENT ARCHIVE slide in right
  .to('#pcard-01 .num-current',   { x: -60, opacity: 0, duration: 0.5 }, 1.8)
  .to('#pcard-01 .label-current', { x: -40, opacity: 0, duration: 0.5 }, 1.8)
  .to('#pcard-01 .num-next',      { x: 0,   opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.0)
  .to('#pcard-01 .label-next',    { x: 0,   opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.0);

// ── CARDS #02 #03 #04 — same 3-phase animation ──────────
function setupCardAnimation(cardId, sectionId, hasNext, pinExtra = 0) {
  const c = `#${cardId}`;
  const s = sectionId;

  gsap.set(c, { overflow: 'hidden' });
  if (hasNext) gsap.set(`${c} .num-next`, { x: 120, opacity: 0 });
  if (hasNext) gsap.set(`${c} .label-next`, { x: 40, opacity: 0 });
  gsap.set([`${c} .num-current`, `${c} .label-current`, `${c} .pc-bc-wrap`, `${c} .pc-purchased`, `${c} .pm`], { opacity: 0, x: -30 });
  gsap.set([`${c} .pc-tag`, `${c} .pc-ing`], { opacity: 0, x: 30 });
  gsap.set(`${c} .pc-mid`, { opacity: 0 });
  gsap.set(`${c} .pc-top`, { borderBottomColor: 'transparent' });
  gsap.set(`${c} .pc-bot`, { borderTopColor: 'transparent' });

  const revealTl = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 80%', end: 'top top', scrub: 1.2 } });
  revealTl
    .to(`${c} .pc-top`, { borderBottomColor: 'rgba(0,0,0,0.1)', duration: 0.3 }, 0)
    .to(`${c} .pc-bot`, { borderTopColor: 'rgba(0,0,0,0.12)',   duration: 0.3 }, 0)
    .to(`${c} .num-current`,   { opacity: 1, x: 0, duration: 0.5 }, 0.1)
    .to(`${c} .label-current`, { opacity: 1, x: 0, duration: 0.5 }, 0.2)
    .to(`${c} .pc-tag`,        { opacity: 1, x: 0, duration: 0.5 }, 0.25)
    .to(`${c} .pc-mid`,       { opacity: 1,        duration: 0.5 }, 0.4)
    .to(`${c} .pc-bc-wrap`,   { opacity: 1, x: 0, duration: 0.5 }, 0.5)
    .to(`${c} .pc-purchased`, { opacity: 1, x: 0, duration: 0.5 }, 0.6)
    .to(`${c} .pm`,           { opacity: 1, x: 0, stagger: 0.05, duration: 0.4 }, 0.7)
    .to(`${c} .pc-ing`,       { opacity: 1, x: 0, duration: 0.5 }, 1.0);

  const collapseST = {
    trigger: s, start: 'top top',
    end: `+=${window.innerHeight + pinExtra}`,
    scrub: 1.5, pin: true
  };
  if (pinExtra > 0) {
    collapseST.onUpdate = (self) => {
      const p = Math.max(0, (self.progress - 0.5) * 2);
      gsap.set('#footer', { yPercent: 100 - p * 100 });
    };
  }
  const collapseTl = gsap.timeline({ scrollTrigger: collapseST });
  collapseTl
    .to([`${c} .pc-tag`, `${c} .pc-mid`,
         `${c} .pc-bc-wrap`, `${c} .pc-purchased`, `${c} .pm`, `${c} .pc-ing`], { opacity: 0, duration: 0.6 }, 0)
    .to(`${c} .pc-top`, { borderBottomColor: 'transparent', duration: 0.3 }, 0)
    .to(`${c} .pc-bot`, { borderTopColor:    'transparent', duration: 0.3 }, 0)
    .to(c, { width: 110, height: 110, minHeight: 110, ease: 'power2.inOut', duration: 1 }, 0.5);

  if (hasNext) {
    collapseTl
      .to(`${c} .num-current`,   { x: -60, opacity: 0, duration: 0.5 }, 1.8)
      .to(`${c} .label-current`, { x: -40, opacity: 0, duration: 0.5 }, 1.8)
      .to(`${c} .num-next`,      { x: 0,   opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.0)
      .to(`${c} .label-next`,    { x: 0,   opacity: 1, duration: 0.5, ease: 'power2.out' }, 2.0);
  }

  // For pcard-04: pad timeline so card animation fills first half,
  // leaving second half idle while footer slides up
  if (pinExtra > 0) {
    collapseTl.to({}, { duration: 1.5 });
  }
}

setupCardAnimation('pcard-02', '#s-scan-02', true);
setupCardAnimation('pcard-03', '#s-scan-03', true);
setupCardAnimation('pcard-04', '#s-scan-04', false, window.innerHeight);

// ── START YOUR FREE TRIAL — hero only ──────────────────
ScrollTrigger.create({
  trigger: '#s-hero',
  start: 'bottom top',
  onEnter:     () => gsap.to('.ui-works', { opacity: 0, pointerEvents: 'none', duration: 0.3 }),
  onLeaveBack: () => gsap.to('.ui-works', { opacity: 1, pointerEvents: 'auto', duration: 0.3 })
});

// ── BODY PANEL: text slides up, panel stays fixed ─────
document.querySelectorAll('.two-col p, .three-col p, .studio-cols p').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 90%' },
    opacity: 0, y: 40, duration: 0.9, ease: 'power3.out'
  });
});

// ── RECEIPT: thermal typewriter animation ───────────────────────

// Audio — shared context, unlocked on first user gesture
let _audioCtx = null;
function getAudioCtx() {
  const Ctor = window.AudioContext || (/** @type {any} */ (window)).webkitAudioContext;
  if (!_audioCtx || _audioCtx.state === 'closed') _audioCtx = new Ctor();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
['click','touchstart','keydown'].forEach(ev =>
  document.addEventListener(ev, () => { try { getAudioCtx(); } catch(e){} }, { once: true, passive: true })
);
function playCharSound() {
  try {
    const ctx  = getAudioCtx();
    const dur  = 0.013;
    const n    = Math.floor(ctx.sampleRate * dur);
    const buf  = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * 0.18;
    const src  = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 4800; filt.Q.value = 1.1;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    src.start(); src.stop(ctx.currentTime + dur);
  } catch (e) {}
}

const receiptEl = document.getElementById('receipt-lines');
const printed   = new Set();
let   typeQueue = Promise.resolve();

function typeLine(text) {
  typeQueue = typeQueue.then(() => new Promise(resolve => {
    const p = document.createElement('p');
    receiptEl.appendChild(p);
    if (!text.trim()) { p.textContent = ' '; setTimeout(resolve, 60); return; }
    let i = 0;
    (function tick() {
      if (i < text.length) { p.textContent += text[i++]; playCharSound(); setTimeout(tick, 30); }
      else setTimeout(resolve, 80);
    })();
  }));
}

const receiptItems = [
  { section: '#s-scan',    lines: ['INVENTORY PREC. x1', '  REF: SHH-0001'] },
  { section: '#s-scan-02', lines: [' ', 'CLIENT ARCHIVE  x1', '  REF: SHH-0002'] },
  { section: '#s-scan-03', lines: [' ', 'ADMIN INTEL.    x1', '  REF: SHH-0003'] },
  { section: '#s-scan-04', lines: [' ', 'SALON MGMT.     x1', '  REF: SHH-0004'] },
];

// Drive receipt checks off Lenis — avoids GSAP ScrollTrigger init-firing issue
lenis.on('scroll', () => {
  receiptItems.forEach(({ section, lines }, idx) => {
    if (printed.has(idx)) return;
    const el = document.querySelector(section);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.65) {
      printed.add(idx);
      lines.forEach(line => typeLine(line));
      if (idx === receiptItems.length - 1) {
        typeLine(' ');
        typeLine('TOTAL:');
        typeLine('  * SPECIAL PROJECT!');
        typeLine(' ');
        typeLine('**********************');
        typeLine('Thanks for your visit!');
        typeLine('----------------------');
      }
    }
  });
});

// ── FOOTER — slides up over pinned #04 square ──────────
gsap.set('#footer', { yPercent: 100 });
gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan-04',
    start: `top+=${window.innerHeight} top`,
    end:   `top+=${window.innerHeight * 2} top`,
    scrub: 1
  }
}).to('#footer', { yPercent: 0, ease: 'none' });

// ── SCROLL REVEAL ANIMATIONS ───────────────────────────
// Simple opacity reveals — no clipPath hiding content

gsap.from('.hero-title', { opacity: 0, y: 50, duration: 1.2, ease: 'power4.out' });
gsap.from(['.hero-brand', '.hero-for', '.hero-body', '.scroll-cta'], {
  opacity: 0, y: 20, duration: 0.9, stagger: 0.1, delay: 0.3, ease: 'power3.out'
});

// Prod-nav: appear one by one on scroll-down, disappear one by one on scroll-up
const navTl = gsap.timeline({ paused: true });
navTl.from('.prod-nav a', {
  opacity: 0, y: 24, duration: 0.6, stagger: 0.5, ease: 'power3.out'
});
ScrollTrigger.create({
  trigger: '#s-studio',
  start: 'top 65%',
  onEnter:     () => navTl.play(),
  onLeaveBack: () => navTl.reverse()
});

const reveals = [
  { sel: '.studio-claim', trigger: '#s-studio' },
  { sel: '.studio-cols',  trigger: '#s-studio' },
];
reveals.forEach(({ sel, trigger }) => {
  gsap.from(sel, {
    scrollTrigger: { trigger, start: 'top 80%' },
    opacity: 0, y: 30, duration: 0.9, ease: 'power3.out'
  });
});


document.querySelectorAll('.d-title, .d-title--01').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 90%' },
    opacity: 0, y: 40, duration: 1, ease: 'power3.out'
  });
});

document.querySelectorAll('.d-badge, .d-hot, .d-icons, .circle-badge, .d-sub, .d-icons-row').forEach(el => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 95%' },
    opacity: 0, y: 16, duration: 0.7, ease: 'power3.out'
  });
});
