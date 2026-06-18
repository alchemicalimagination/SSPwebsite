// Scripts are at bottom of body — DOM + CDN libs are ready

gsap.registerPlugin(ScrollTrigger);


// ── FREE TRIAL BUTTON BOUNCE ────────────────────────────
['.footer-talk', '.footer-back'].forEach(sel => {
  document.querySelector(sel)?.addEventListener('click', function () {
    this.classList.remove('bouncing');
    void this.offsetWidth;
    this.classList.add('bouncing');
    this.addEventListener('animationend', () => this.classList.remove('bouncing'), { once: true });
  });
});

// ── SMOOTH SCROLL ──────────────────────────────────────
const lenis = new Lenis({ smoothTouch: true });
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
  flowerCtx.fillStyle = '#3a3448';
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
const CELL  = 7;
const CHARS = '$@B%8&WM#*oahkbdpwmZO0QLCJUYXzcvunxrjft/|()1{}?-_+~<>i!lI;:,". ';

function resizeASCII() {
  asciiCanvas.width  = window.innerWidth;
  asciiCanvas.height = window.innerHeight;
}
resizeASCII();
window.addEventListener('resize', resizeASCII);

function renderASCII() {
  const W   = window.innerWidth;
  const H   = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  let   pixels;
  try { pixels = flowerCtx.getImageData(0, 0, flowerCanvas.width, flowerCanvas.height); }
  catch(e) { return; }

  asciiCtx.clearRect(0, 0, W, H);
  asciiCtx.font         = `${CELL}px "Courier New", monospace`;
  asciiCtx.textAlign    = 'left';
  asciiCtx.textBaseline = 'top';

  for (let y = 0; y < H; y += CELL) {
    for (let x = 0; x < W; x += CELL) {
      const px = Math.min(Math.floor(x * dpr), pixels.width  - 1);
      const py = Math.min(Math.floor(y * dpr), pixels.height - 1);
      const i  = (py * pixels.width + px) * 4;
      const r  = pixels.data[i];
      const g  = pixels.data[i + 1];
      const b  = pixels.data[i + 2];
      const lum     = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const charIdx = Math.floor(lum * (CHARS.length - 1));
      const ch      = CHARS[charIdx];
      if (ch === ' ') continue;
      asciiCtx.fillStyle = `rgba(255,255,255,${(0.4 + lum * 0.6).toFixed(2)})`;
      asciiCtx.fillText(ch, x, y);
    }
  }
}

for (let i = 1; i <= FRAME_COUNT; i++) {
  const img = new Image();
  img.src = `${window._BASE||'./'}flower%20sequence/ezgif-8a7cfed939556aa3-jpg/ezgif-frame-${padNum(i)}.jpg`;
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

// ── CARD ANIMATION ────────────────────────────────────
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
// end card animations

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

// ── CARD INLINE ANIMATIONS ─────────────────────────────
function initScaleAnimation() {
  const valueEl  = document.querySelector('.scale-value');
  const statusEl = document.querySelector('.scale-status');
  const labelEl  = document.querySelector('.scale-label');
  const drop     = document.querySelector('.scale-drop');
  const liquid   = document.querySelector('.scale-liquid');
  const readout  = document.querySelector('.scale-readout');

  if (!valueEl || !drop || !liquid || !labelEl) return;

  // Formula: 3 ingredients added to the same bowl, liquid accumulates
  const steps = [
    { name: 'COLOUR',    unit: 'g',  target: 36.0, fill: 0.33 },
    { name: 'TONER',     unit: 'g',  target: 12.0, fill: 0.66 },
    { name: 'OX 20 VOL', unit: 'ml', target: 60.0, fill: 1.0  },
  ];

  gsap.set(readout, { opacity: 0 });

  let scaleRunning = false, scaleTl = null, scaleDelay = null;

  function scaleStop() {
    scaleRunning = false;
    if (scaleDelay) { scaleDelay.kill(); scaleDelay = null; }
    if (scaleTl)    { scaleTl.kill();    scaleTl    = null; }
    gsap.killTweensOf([drop, liquid, readout]);
    gsap.set(drop,    { y: 0, opacity: 0 });
    gsap.set(liquid,  { scaleY: 0.05, transformOrigin: 'bottom center' });
    gsap.set(readout, { opacity: 0 });
  }

  function runFormula() {
    if (!scaleRunning) return;
    gsap.set(drop, { y: 0, opacity: 0 });
    gsap.set(liquid, { scaleY: 0.05, transformOrigin: 'bottom center' });
    labelEl.textContent        = steps[0].name;
    valueEl.textContent        = '0.0 g';
    statusEl.textContent       = 'MEASURING';
    statusEl.style.color       = 'rgba(255,255,255,0.5)';
    statusEl.style.borderColor = 'rgba(255,255,255,0.3)';

    scaleTl = gsap.timeline();

    scaleTl.to(readout, { opacity: 1, duration: 0.3 });

    steps.forEach((step, i) => {
      const weight = { val: 0.0 };
      if (i > 0) {
        scaleTl.to({}, { duration: 0.65 })
          .call(() => {
            labelEl.textContent = step.name;
            valueEl.textContent = '0.0 ' + step.unit;
          });
      }
      scaleTl.set(drop, { y: 0, opacity: 0 })
        .to(drop, { opacity: 1, duration: 0.06, delay: 0.25 })
        .to(drop, { y: 38, duration: 0.5, ease: 'power2.in' })
        .to(drop, { opacity: 0, duration: 0.06 })
        .to(liquid, { scaleY: step.fill, duration: 0.4, ease: 'power2.out' }, '-=0.06')
        .to(weight, {
          val: step.target, duration: 0.52, ease: 'power1.out',
          onUpdate: () => { valueEl.textContent = weight.val.toFixed(1) + ' ' + step.unit; }
        }, '-=0.3');
    });

    scaleTl.call(() => {
        statusEl.textContent       = 'SAVED';
        statusEl.style.color       = '#a8dadc';
        statusEl.style.borderColor = '#a8dadc';
      });
    // hold final state — no drain, no restart
  }

  ScrollTrigger.create({
    trigger: '#pcard-01 .pc-visual',
    start: 'top 85%', end: 'bottom 15%',
    onEnter:      () => { if (!scaleRunning) { scaleRunning = true; runFormula(); } },
    onEnterBack:  () => { if (!scaleRunning) { scaleRunning = true; runFormula(); } },
    onLeave:      scaleStop,
    onLeaveBack:  scaleStop,
  });
}

function initArchiveAnimation() {
  const card = document.querySelector('.client-card');
  if (!card) return;

  const secTitle  = card.querySelector('.cc-sec-title');
  const swatches  = card.querySelectorAll('.cc-swatch');
  const rows      = card.querySelectorAll('.cc-detail-row');
  const tagline   = card.querySelector('.cc-tagline');
  const ccSection = card.querySelector('.cc-section');
  const ccDetails = card.querySelector('.cc-details');
  const slideEls  = [ccSection, ccDetails, tagline];

  // Same client, 3 different profile sections — header stays fixed
  const views = [
    {
      title: 'FORMULA HISTORY',
      sw:   ['#EED6A5', '#D4A373', '#B5838D'],
      rows: [
        { label: 'BASE',       value: '7N + 8GG (1:1)', badge: false },
        { label: 'DEV',        value: '20 VOL',          badge: false },
        { label: 'ALLERGY',    value: 'PPD FREE',         badge: true  },
      ],
      tag: 'SAVED 2 MINS AGO'
    },
    {
      title: 'PURCHASE HISTORY',
      sw:   ['#B0C4D8', '#8AAFC4', '#6492AE'],
      rows: [
        { label: 'LAST VISIT',  value: '14 DAYS AGO', badge: false },
        { label: 'TOTAL SPEND', value: '£2,840',       badge: false },
        { label: 'VISITS / YR', value: '12',           badge: false },
      ],
      tag: 'CLIENT SINCE JAN 2022'
    },
    {
      title: 'LOYALTY STATUS',
      sw:   ['#D4AF37', '#C49A22', '#A67C10'],
      rows: [
        { label: 'TIER',        value: 'GOLD MEMBER', badge: false },
        { label: 'POINTS',      value: '2,840 PTS',   badge: false },
        { label: 'NEXT REWARD', value: '£20 OFF',      badge: false },
      ],
      tag: 'REWARD UNLOCKED'
    }
  ];
  let idx = 0;

  function setView(v) {
    secTitle.textContent = v.title;
    swatches.forEach((s, i) => { s.style.background = v.sw[i]; });
    rows.forEach((row, i) => {
      row.querySelector('span:first-child').textContent = v.rows[i].label;
      const val = row.querySelector('span:last-child');
      val.textContent = v.rows[i].value;
      val.className   = v.rows[i].badge ? 'cc-badge-ppd' : '';
    });
    tagline.textContent = v.tag;
  }

  setView(views[0]);

  let archiveRunning = false, archiveTl = null, archiveDelay = null;

  function archiveStop() {
    archiveRunning = false;
    if (archiveDelay) { archiveDelay.kill(); archiveDelay = null; }
    if (archiveTl)    { archiveTl.kill();    archiveTl    = null; }
    gsap.killTweensOf(slideEls);
    idx = 0;
    setView(views[0]);
    gsap.set(slideEls, { x: 0, opacity: 1 });
  }

  function runArchiveSequence() {
    if (!archiveRunning) return;
    // Cycle through all remaining views once, then hold
    const remaining = views.length - 1 - idx;
    if (remaining <= 0) return;
    idx = (idx + 1) % views.length;
    archiveTl = gsap.timeline({
      onComplete: () => { if (archiveRunning) archiveDelay = gsap.delayedCall(2.5, runArchiveSequence); }
    });
    archiveTl
      .to(slideEls, { x: -18, opacity: 0, duration: 0.3, ease: 'power2.in', stagger: 0.03 })
      .call(() => { setView(views[idx]); gsap.set(slideEls, { x: 18 }); })
      .to(slideEls, { x: 0, opacity: 1, duration: 0.38, ease: 'power2.out', stagger: 0.03 });
  }

  ScrollTrigger.create({
    trigger: '#pcard-02 .pc-visual',
    start: 'top 85%', end: 'bottom 15%',
    onEnter:     () => { if (!archiveRunning) { archiveRunning = true; archiveDelay = gsap.delayedCall(2.5, runArchiveSequence); } },
    onEnterBack: () => { if (!archiveRunning) { archiveRunning = true; archiveDelay = gsap.delayedCall(2.5, runArchiveSequence); } },
    onLeave:     archiveStop,
    onLeaveBack: archiveStop,
  });
}

function initAdminAnimation() {
  const line     = document.querySelector('.graph-line');
  const dot      = document.querySelector('.graph-dot');
  const valueEl  = document.querySelector('.ad-value');
  const changeEl = document.querySelector('.ad-change');
  const graphWrap = document.querySelector('.ad-graph');

  if (!line || !dot || !valueEl) return;

  const len = line.getTotalLength ? line.getTotalLength() : 110;
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(dot,  { opacity: 0, scale: 1 });

  const salesVal = { val: 12400 };
  let adminRunning = false, adminTl = null, adminDelay = null;

  function adminStop() {
    adminRunning = false;
    if (adminDelay) { adminDelay.kill(); adminDelay = null; }
    if (adminTl)    { adminTl.kill();    adminTl    = null; }
    gsap.killTweensOf([line, dot, graphWrap, salesVal]);
    salesVal.val = 12400;
    valueEl.textContent  = '$12,400';
    changeEl.textContent = '+0.0%';
    gsap.set(line,      { strokeDashoffset: len });
    gsap.set(dot,       { opacity: 0, scale: 1 });
    gsap.set(graphWrap, { opacity: 1 });
  }

  function runAdminCycle() {
    if (!adminRunning) return;
    salesVal.val         = 12400;
    valueEl.textContent  = '$12,400';
    changeEl.textContent = '+0.0%';

    adminTl = gsap.timeline();
    adminTl
      .to(line, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.out' })
      .to(salesVal, {
        val: 14820, duration: 1.8, ease: 'power2.out',
        onUpdate: () => { valueEl.textContent = '$' + Math.floor(salesVal.val).toLocaleString(); }
      }, 0)
      .call(() => { changeEl.textContent = '+19.5%'; }, [], 1.1)
      .to(dot, { opacity: 1, scale: 1.5, duration: 0.25, ease: 'back.out(2)' })
      .to(dot, { scale: 1.0, duration: 0.25 });
    // hold final state — no erase, no restart
  }

  ScrollTrigger.create({
    trigger: '#pcard-03 .pc-visual',
    start: 'top 85%', end: 'bottom 15%',
    onEnter:     () => { if (!adminRunning) { adminRunning = true; runAdminCycle(); } },
    onEnterBack: () => { if (!adminRunning) { adminRunning = true; runAdminCycle(); } },
    onLeave:     adminStop,
    onLeaveBack: adminStop,
  });
}

function initLoyaltyAnimation() {
  const lc = document.querySelector('.loyalty-card');
  if (!lc) return;

  const tierEl    = lc.querySelector('.lc-tier');
  const ptsEl     = lc.querySelector('.lc-pts-value');
  const fillEl    = lc.querySelector('.lc-progress-fill');
  const visitsEl  = lc.querySelector('.lc-visits');
  const rewardEl  = lc.querySelector('.lc-reward');

  const pts = { val: 2600 };
  let loyaltyRunning = false, loyaltyTl = null, loyaltyDelay = null;

  function loyaltyStop() {
    loyaltyRunning = false;
    if (loyaltyDelay) { loyaltyDelay.kill(); loyaltyDelay = null; }
    if (loyaltyTl)    { loyaltyTl.kill();    loyaltyTl    = null; }
    gsap.killTweensOf([lc, fillEl, rewardEl, pts]);
    gsap.set(lc, { opacity: 1 });
    pts.val = 2600;
    ptsEl.textContent        = '2,600';
    tierEl.textContent       = 'SILVER';
    tierEl.style.color       = 'rgba(255,255,255,0.5)';
    tierEl.style.borderColor = 'rgba(255,255,255,0.2)';
    visitsEl.textContent     = '11';
    gsap.set(fillEl,   { width: '87%' });
    gsap.set(rewardEl, { opacity: 0 });
  }

  function runLoyaltyCycle() {
    if (!loyaltyRunning) return;
    gsap.set(lc, { opacity: 1 });
    pts.val              = 2600;
    ptsEl.textContent    = '2,600';
    tierEl.textContent   = 'SILVER';
    tierEl.style.color   = 'rgba(255,255,255,0.5)';
    tierEl.style.borderColor = 'rgba(255,255,255,0.2)';
    visitsEl.textContent = '11';
    gsap.set(fillEl,   { width: '87%' });
    gsap.set(rewardEl, { opacity: 0 });

    loyaltyTl = gsap.timeline();
    loyaltyTl
      .to({}, { duration: 1.2 })
      .call(() => { visitsEl.textContent = '12'; })
      .to(pts, {
        val: 3000, duration: 1.4, ease: 'power2.out',
        onUpdate: () => { ptsEl.textContent = Math.floor(pts.val).toLocaleString(); }
      })
      .to(fillEl, { width: '100%', duration: 1.4, ease: 'power2.out' }, '<')
      .call(() => {
        tierEl.textContent       = 'GOLD';
        tierEl.style.color       = '#D4AF37';
        tierEl.style.borderColor = '#D4AF37';
      })
      .to(rewardEl, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    // hold final GOLD state — no fade out, no restart
  }

  ScrollTrigger.create({
    trigger: '#pcard-04 .pc-visual',
    start: 'top 85%', end: 'bottom 15%',
    onEnter:     () => { if (!loyaltyRunning) { loyaltyRunning = true; runLoyaltyCycle(); } },
    onEnterBack: () => { if (!loyaltyRunning) { loyaltyRunning = true; runLoyaltyCycle(); } },
    onLeave:     loyaltyStop,
    onLeaveBack: loyaltyStop,
  });
}

// ── TYPEWRITER TITLES ──────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  return _audioCtx;
}

let typewriterAudioBuffer = null;
let typewriterClicks = [];
let _isSoundMuted = false;
let bgMusic = null;

function startBgMusic() {
  if (bgMusic) return;
  try {
    bgMusic = new Audio((window._BASE || './') + 'assets/background-music.mp3');
    bgMusic.loop = true;
    const isMobile = window.innerWidth <= 768;
    bgMusic.volume = isMobile ? 0.01 : 0.05; // Set subtle volume (5% desktop, 1% mobile)
    if (!_isSoundMuted) {
      bgMusic.play().catch(e => {
        console.warn("Background music play failed:", e);
      });
    }
  } catch (e) {
    console.warn("Failed to initialize background music:", e);
  }
}

function loadTypewriterWav() {
  const ctx = getAudioCtx();
  if (!ctx || typewriterAudioBuffer) return;

  fetch((window._BASE || './') + 'assets/mixkit-old-typewriter-typing-1372.wav')
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      typewriterAudioBuffer = audioBuffer;
      detectWavClicks(audioBuffer);
    })
    .catch(err => {
      console.warn("Failed to load typewriter WAV:", err);
    });
}

// Auto-calibrating transient peak detector to slice individual keystroke clicks from the WAV file
function detectWavClicks(buffer) {
  try {
    const data = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    
    // Find the maximum absolute amplitude to auto-scale the threshold
    let maxAmp = 0;
    for (let i = 0; i < data.length; i++) {
      const val = Math.abs(data[i]);
      if (val > maxAmp) maxAmp = val;
    }
    
    const threshold = maxAmp * 0.35; // 35% of max volume is a click peak
    const minInterval = 0.12 * sampleRate; // minimum 120ms between clicks
    
    typewriterClicks = [];
    
    let i = 0;
    while (i < data.length) {
      const val = Math.abs(data[i]);
      if (val > threshold) {
        // Record timestamp starting 10ms before the peak to capture the strike transient
        const time = Math.max(0, i - 0.01 * sampleRate) / sampleRate;
        typewriterClicks.push(time);
        i += minInterval;
      } else {
        i++;
      }
    }
    
    console.log(`Detected ${typewriterClicks.length} typewriter click peaks (max amp: ${maxAmp.toFixed(3)}, threshold: ${threshold.toFixed(3)})`);
    
    if (typewriterClicks.length === 0) {
      typewriterClicks = [0];
    }
  } catch (e) {
    console.warn("Error detecting click peaks in WAV:", e);
    typewriterClicks = [0];
  }
}

function _unlockAudio() {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = _audioCtx;
    
    // Play a short silent buffer to initialize/unlock the audio destination
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (ctx.state === 'running') {
          _removeUnlockListeners();
          loadTypewriterWav();
          startBgMusic();
        }
      });
    } else if (ctx.state === 'running') {
      _removeUnlockListeners();
      loadTypewriterWav();
      startBgMusic();
    }
  } catch (e) {
    console.warn("Failed to resume AudioContext:", e);
  }
}

const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown', 'mousedown', 'pointerdown'];

function _removeUnlockListeners() {
  unlockEvents.forEach(evt => {
    document.removeEventListener(evt, _unlockAudio, { capture: true });
  });
}

// Bind only to actual user interaction events (including touchstart/touchend)
unlockEvents.forEach(evt => {
  document.addEventListener(evt, _unlockAudio, { capture: true, passive: true });
});

// Dynamic Unmute Overlay / Button
const SOUND_TOGGLE_THEME = 'glass'; // 'glass' or 'metal'
let _unmuteBtnDone = false;
function initUnmuteButton() {
  if (_unmuteBtnDone) return;
  _unmuteBtnDone = true;

  const btn = document.createElement('div');
  btn.id = 'audio-unmute-btn';
  btn.classList.add('sound-on');
  btn.classList.add(SOUND_TOGGLE_THEME === 'metal' ? 'metal-theme' : 'glass-theme');
  btn.innerHTML = `
    <div id="liquid-metal-audio"></div>
    <div class="audio-wave-wrap">
      <svg class="wave-svg" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path class="wave-path wavy wavy3" d="M -30 12 Q -22.5 4 -15 12 T 0 12 T 15 12 T 30 12 T 45 12 T 60 12 T 75 12 T 90 12 T 105 12 T 120 12 T 135 12" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" fill="none" opacity="0.25" />
        <path class="wave-path wavy" d="M -30 12 Q -22.5 2 -15 12 T 0 12 T 15 12 T 30 12 T 45 12 T 60 12 T 75 12 T 90 12 T 105 12 T 120 12 T 135 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
        <path class="wave-path wavy wavy2" d="M -30 12 Q -22.5 5 -15 12 T 0 12 T 15 12 T 30 12 T 45 12 T 60 12 T 75 12 T 90 12 T 105 12 T 120 12 T 135 12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.45" />
        <path class="wave-path flat" d="M 0 12 L 100 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" />
      </svg>
    </div>
    <span class="unmute-txt">ON</span>
  `;

  document.documentElement.appendChild(btn);
  
  // Fade in after 1 second
  setTimeout(() => {
    btn.style.opacity = '1';
    btn.style.transform = 'translateY(0)';
  }, 1000);

  const toggleSound = () => {
    _unlockAudio();

    if (_isSoundMuted) {
      _isSoundMuted = false;
      btn.classList.remove('sound-off');
      btn.classList.add('sound-on');
      btn.querySelector('.unmute-txt').textContent = 'ON';
      if (bgMusic) {
        bgMusic.play().catch(e => {});
      } else {
        startBgMusic();
      }
      setTimeout(() => playTypeClick(), 50);
    } else {
      _isSoundMuted = true;
      btn.classList.remove('sound-on');
      btn.classList.add('sound-off');
      btn.querySelector('.unmute-txt').textContent = 'OFF';
      if (bgMusic) {
        bgMusic.pause();
      }
    }
  };

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSound();
  });
  
  const silentUnlock = () => {
    _unlockAudio();
    document.removeEventListener('click', silentUnlock);
    document.removeEventListener('keydown', silentUnlock);
  };
  document.addEventListener('click', silentUnlock);
  document.addEventListener('keydown', silentUnlock);
}

function playTypeClick() {
  if (_isSoundMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    if (ctx.state === 'suspended') return;

    const now = ctx.currentTime;

    // A. WAV file playback (if loaded and peaks detected)
    if (typewriterAudioBuffer && typewriterClicks.length > 0) {
      const src = ctx.createBufferSource();
      src.buffer = typewriterAudioBuffer;

      // Select a random detected keystroke start time
      const randIdx = Math.floor(Math.random() * typewriterClicks.length);
      const startTime = typewriterClicks[randIdx];
      const duration = 0.18; // Play 180ms of sound per click

      const isMobile = window.innerWidth <= 768;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isMobile ? 0.40 : 0.18, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(now, startTime, duration);
      return;
    }

    // B. Physical synthesis fallback (while buffer is loading)
    // 1. Mechanical Strike Impact (noise bandpass-filtered around 1.1kHz)
    const impactLen = Math.floor(ctx.sampleRate * 0.015); // ~15ms
    const impactBuf = ctx.createBuffer(1, impactLen, ctx.sampleRate);
    const impactData = impactBuf.getChannelData(0);
    for (let i = 0; i < impactLen; i++) {
      impactData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impactLen, 3);
    }
    const impactSrc = ctx.createBufferSource();
    impactSrc.buffer = impactBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100 + Math.random() * 300, now); // randomized mechanical focus
    filter.Q.setValueAtTime(1.8, now);
    
    const isMobile = window.innerWidth <= 768;
    const impactGain = ctx.createGain();
    impactGain.gain.setValueAtTime(isMobile ? 0.22 : 0.10, now); // clear volume
    impactGain.gain.linearRampToValueAtTime(0.001, now + 0.015);

    impactSrc.connect(filter);
    filter.connect(impactGain);
    impactGain.connect(ctx.destination);
    impactSrc.start(now);

    // 2. Metallic Resonance (oscillators representing mechanical typebars)
    const ringFreqs = [740, 1150, 1850];
    ringFreqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 20, now);
      
      const decay = 0.035 + Math.random() * 0.015; // 35-50ms
      const isMobile = window.innerWidth <= 768;
      const initialVol = (idx === 0 ? (isMobile ? 0.05 : 0.02) : (isMobile ? 0.025 : 0.01)) * (0.8 + Math.random() * 0.4);
      oscGain.gain.setValueAtTime(initialVol, now);
      oscGain.gain.linearRampToValueAtTime(0.0001, now + decay);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + decay);
    });

    // 3. Hollow Platen/Desk Resonance (triangle wave low end thump)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(130, now); // ~130Hz
    
    bodyGain.gain.setValueAtTime(0.14, now);
    bodyGain.gain.linearRampToValueAtTime(0.0001, now + 0.045);
    
    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.045);

  } catch(e) {
    console.warn("Error synthesizing/playing typewriter sound:", e);
  }
}

let _typewriterDone = false;
function initTypewriterTitles() {
  if (_typewriterDone) return;
  _typewriterDone = true;
  document.querySelectorAll('.d-title').forEach(title => {
    // Split innerHTML preserving <br> tags
    const parts = title.innerHTML.split(/(<br\s*\/?>)/gi);
    title.innerHTML = parts.map(p =>
      p.match(/^<br/i) ? p :
      [...p].map(ch => ch === ' ' ? ' ' : `<span class="tw-ch">${ch}</span>`).join('')
    ).join('');

    const chars = title.querySelectorAll('.tw-ch');
    gsap.set(chars, { opacity: 0 });

    ScrollTrigger.create({
      trigger: title,
      start: 'top 85%',
      onEnter: () => {
        gsap.killTweensOf(chars);
        gsap.set(chars, { opacity: 0 });
        gsap.to(chars, {
          opacity: 1,
          duration: 0.01,
          stagger: { each: 0.075, onStart: playTypeClick }
        });
      },
      onLeaveBack: () => {
        gsap.killTweensOf(chars);
        gsap.set(chars, { opacity: 0 });
      }
    });
  });
}

// Register animations — ScrollTrigger handles when each one starts/stops
document.addEventListener('DOMContentLoaded', () => {
  initTypewriterTitles();
  initScaleAnimation();
  initArchiveAnimation();
  initAdminAnimation();
  initLoyaltyAnimation();
  initUnmuteButton();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initTypewriterTitles();
  initScaleAnimation();
  initArchiveAnimation();
  initAdminAnimation();
  initLoyaltyAnimation();
  initUnmuteButton();
}
