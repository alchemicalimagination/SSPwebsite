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

// ── FIXED BADGE ────────────────────────────────────────
const fixedBadge = document.querySelector('.fixed-badge');
const badgeNum   = fixedBadge?.querySelector('b');
const badgeLabel = fixedBadge?.querySelector('small');

const badgeData = [
  { num: '#01', label: 'INVENTORY<br>PRECISION',  section: '#s-scan' },
  { num: '#02', label: 'CLIENT<br>ARCHIVE',        section: '#s-scan-02' },
  { num: '#03', label: 'ADMIN<br>INTELLIGENCE',    section: '#s-scan-03' },
  { num: '#04', label: 'SALON<br>MANAGEMENT',      section: '#s-scan-04' }
];

function setBadge(num, label) {
  if (!badgeNum || !badgeLabel) return;
  badgeNum.textContent = num;
  badgeLabel.innerHTML = label;
}

if (fixedBadge) {
  // Show when card #01 starts its collapse phase, hide if scrolling back up
  ScrollTrigger.create({
    trigger: '#s-scan',
    start: 'top top',
    onEnter:     () => gsap.to(fixedBadge, { opacity: 1, duration: 0.4 }),
    onLeaveBack: () => gsap.to(fixedBadge, { opacity: 0, duration: 0.3 })
  });

  // Update badge label as each product card section enters
  badgeData.forEach(({ num, label, section }, i) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      onEnter:     () => setBadge(num, label),
      onLeaveBack: () => {
        const prev = badgeData[i - 1];
        if (prev) setBadge(prev.num, prev.label);
      }
    });
  });

  // Hide badge when footer slides into view
  ScrollTrigger.create({
    trigger: '#s-scan-04',
    start: `top+=${window.innerHeight} top`,
    onEnter:     () => gsap.to(fixedBadge, { opacity: 0, duration: 0.3 }),
    onLeaveBack: () => gsap.to(fixedBadge, { opacity: 1, duration: 0.3 })
  });
}

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

// ── CARD ANIMATION: desktop only ──────────────────────
if (window.innerWidth > 768) {
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
} // end desktop-only card animations

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
if (window.innerWidth > 768) {
  gsap.set('#footer', { yPercent: 100 });
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-scan-04',
      start: `top+=${window.innerHeight} top`,
      end:   `top+=${window.innerHeight * 2} top`,
      scrub: 1
    }
  }).to('#footer', { yPercent: 0, ease: 'none' });
} else {
  gsap.set('#footer', { yPercent: 0 });
}

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
  const valueEl = document.querySelector('.scale-value');
  const statusEl = document.querySelector('.scale-status');
  const drop = document.querySelector('.scale-drop');
  const liquid = document.querySelector('.scale-liquid');

  if (!valueEl || !drop || !liquid) return;

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.5 });
  const weightObj = { val: 0.0 };
  
  tl.set(drop, { y: 0, opacity: 0 })
    .set(liquid, { scaleY: 0.1, transformOrigin: "bottom center" })
    .set(weightObj, { val: 0.0 })
    .set(statusEl, { textContent: "ACTIVE", borderColor: "rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.5)" })
    .add(() => { valueEl.textContent = "0.0 g"; });

  // Drop 1
  tl.to(drop, { opacity: 1, duration: 0.05 })
    .to(drop, { y: 65, duration: 0.6, ease: "power1.in" })
    .to(drop, { opacity: 0, duration: 0.05 })
    .to(liquid, { scaleY: 0.4, duration: 0.3, ease: "power2.out" }, "-=0.05")
    .to(weightObj, {
      val: 18.4,
      duration: 0.4,
      ease: "power1.out",
      onUpdate: () => { valueEl.textContent = weightObj.val.toFixed(1) + " g"; }
    }, "-=0.3");

  // Drop 2
  tl.set(drop, { y: 0, opacity: 0 })
    .to(drop, { opacity: 1, duration: 0.05, delay: 0.4 })
    .to(drop, { y: 65, duration: 0.6, ease: "power1.in" })
    .to(drop, { opacity: 0, duration: 0.05 })
    .to(liquid, { scaleY: 0.75, duration: 0.3, ease: "power2.out" }, "-=0.05")
    .to(weightObj, {
      val: 34.1,
      duration: 0.4,
      ease: "power1.out",
      onUpdate: () => { valueEl.textContent = weightObj.val.toFixed(1) + " g"; }
    }, "-=0.3");

  // Drop 3
  tl.set(drop, { y: 0, opacity: 0 })
    .to(drop, { opacity: 1, duration: 0.05, delay: 0.4 })
    .to(drop, { y: 65, duration: 0.6, ease: "power1.in" })
    .to(drop, { opacity: 0, duration: 0.05 })
    .to(liquid, { scaleY: 1.0, duration: 0.3, ease: "power2.out" }, "-=0.05")
    .to(weightObj, {
      val: 42.5,
      duration: 0.4,
      ease: "power1.out",
      onUpdate: () => { valueEl.textContent = weightObj.val.toFixed(1) + " g"; }
    }, "-=0.3")
    .to(statusEl, {
      textContent: "SAVED",
      color: "#a8dadc",
      borderColor: "#a8dadc",
      duration: 0.3
    })
    .to({}, { duration: 2 });
}

function initArchiveAnimation() {
  const card = document.querySelector('.client-card');
  if (!card) return;

  const name = card.querySelector('.cc-name');
  const id = card.querySelector('.cc-id');
  const swatches = card.querySelectorAll('.cc-swatch');
  const detail1 = card.querySelector('.cc-detail-row:nth-child(1) span:last-child');
  const detail2 = card.querySelector('.cc-detail-row:nth-child(2) span:last-child');
  const tag = card.querySelector('.cc-tagline');

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });

  tl.to(card, { opacity: 0, y: -5, duration: 0.4, delay: 3 })
    .call(() => {
      name.textContent = "EMILY R.";
      id.textContent = "#8823";
      swatches[0].style.background = "#DDA15E";
      swatches[1].style.background = "#BC6C25";
      swatches[2].style.background = "#588157";
      detail1.textContent = "6A + 6GG (1:2)";
      detail2.textContent = "10 VOL";
      tag.textContent = "UPDATED 10M AGO";
    })
    .to(card, { opacity: 1, y: 0, duration: 0.4 })
    .to(card, { opacity: 0, y: -5, duration: 0.4, delay: 3 })
    .call(() => {
      name.textContent = "SARAH M.";
      id.textContent = "#9481";
      swatches[0].style.background = "#EED6A5";
      swatches[1].style.background = "#D4A373";
      swatches[2].style.background = "#B5838D";
      detail1.textContent = "7N + 8GG (1:1)";
      detail2.textContent = "20 VOL";
      tag.textContent = "SAVED 2 MINS AGO";
    })
    .to(card, { opacity: 1, y: 0, duration: 0.4 });
}

function initAdminAnimation() {
  const line = document.querySelector('.graph-line');
  const dot = document.querySelector('.graph-dot');
  const valueEl = document.querySelector('.ad-value');
  const changeEl = document.querySelector('.ad-change');

  if (!line || !dot || !valueEl) return;

  const length = line.getTotalLength ? line.getTotalLength() : 110;
  gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
  gsap.set(dot, { opacity: 0 });

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
  const salesVal = { val: 12400 };

  tl.set(line, { strokeDashoffset: length })
    .set(dot, { opacity: 0 })
    .set(salesVal, { val: 12400 })
    .set(changeEl, { textContent: "+0.0%" })
    .to(line, { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" })
    .to(salesVal, {
      val: 14820,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => {
        valueEl.textContent = "$" + Math.floor(salesVal.val).toLocaleString();
      }
    }, 0)
    .to(changeEl, {
      textContent: "+24.3%",
      duration: 0.5,
      ease: "none"
    }, 1.0)
    .to(dot, { opacity: 1, scale: 1.4, duration: 0.3 })
    .to(dot, { scale: 1.0, duration: 0.3 })
    .to({}, { duration: 2 });
}

function initBookingAnimation() {
  const container = document.querySelector('.booking-calendar');
  if (!container) return;

  const emptySlot = container.querySelector('.bc-slot.empty');
  const bookedSlot = container.querySelector('.bc-slot.booked');

  if (!emptySlot || !bookedSlot) return;

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });

  tl.set(bookedSlot, { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, overflow: 'hidden' })
    .set(emptySlot, { opacity: 1, height: 'auto', padding: '5px 6px', display: 'flex' })
    .to(emptySlot, { opacity: 0.3, duration: 0.5, delay: 1.5 })
    .to(emptySlot, { opacity: 0, height: 0, padding: 0, duration: 0.3 })
    .to(bookedSlot, { 
      opacity: 1, 
      height: 'auto', 
      paddingTop: 5, 
      paddingBottom: 5, 
      marginTop: 0, 
      duration: 0.5, 
      ease: "power2.out" 
    })
    .fromTo(bookedSlot.querySelector('.bc-status-dot'), 
      { scale: 0, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" }
    )
    .to({}, { duration: 3.5 });
}

// Start visual loops once DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  initScaleAnimation();
  initArchiveAnimation();
  initAdminAnimation();
  initBookingAnimation();
});
// Also fallback if DOM already loaded
if (document.readyState === "complete" || document.readyState === "interactive") {
  initScaleAnimation();
  initArchiveAnimation();
  initAdminAnimation();
  initBookingAnimation();
}
