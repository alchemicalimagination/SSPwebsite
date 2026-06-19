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
    end: `+=${window.innerHeight * 4.0}`, // Expanded scroll range for slow, fine scrub control
    scrub: 1.5,
    pin: true
  }
});

// Setup references and translations for the bilingual scrub
const isIt = window.location.pathname.includes('/it/');
const trans = {
  colour: isIt ? 'COLORE' : 'COLOUR',
  toner: isIt ? 'TONER' : 'TONER',
  ox: isIt ? 'OSSIGENO' : 'OX 20 VOL',
  measuring: isIt ? 'MISURAZIONE' : 'MEASURING',
  active: isIt ? 'ATTIVO' : 'ACTIVE',
  saved: isIt ? 'SALVATO' : 'SAVED'
};

const scaleValueEls = document.querySelectorAll('#pcard-01 .scale-value');
const scaleLabelEls = document.querySelectorAll('#pcard-01 .scale-label');
const scaleStatusEls = document.querySelectorAll('#pcard-01 .scale-status');
const scaleDrop = document.querySelector('#pcard-01 .scale-drop');
const scaleLiquid = document.querySelector('#pcard-01 .scale-liquid');
const weightVal = { val: 0.0 };

// Ensure everything starts from View 1's initial state
cardCollapseTl
  .set('#pcard-01 .pc-3d-card', { rotateY: 0 })
  .set(scaleLiquid, { scaleY: 0.05, transformOrigin: 'bottom center' })
  .call(() => {
    document.querySelectorAll('#pcard-01 .pc-3d-front').forEach(el => el.classList.remove('is-deducting'));
    scaleLabelEls.forEach(el => el.textContent = trans.colour);
    scaleValueEls.forEach(el => el.textContent = '0.0 g');
    scaleStatusEls.forEach(el => {
      el.textContent = trans.measuring;
      el.style.color = 'rgba(255,255,255,0.5)';
      el.style.borderColor = 'rgba(255,255,255,0.3)';
    });
  }, null, 0.0)

  // ── Step 1: COLOUR (0.0 to 0.7) ──
  // Drop falls
  .fromTo(scaleDrop, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.0)
  .to(scaleDrop, { y: 38, duration: 0.4, ease: 'power2.in' }, 0.1)
  .to(scaleDrop, { opacity: 0, duration: 0.1 }, 0.5)
  // Liquid rises
  .to(scaleLiquid, { scaleY: 0.33, duration: 0.3, ease: 'power2.out' }, 0.4)
  // Weight counts up to 36.0g
  .to(weightVal, {
    val: 36.0,
    duration: 0.45,
    ease: 'power1.out',
    onUpdate: () => {
      scaleValueEls.forEach(el => el.textContent = weightVal.val.toFixed(1) + ' g');
    }
  }, 0.25)

  // ── Step 2: TONER (0.7 to 1.5) ──
  .call(() => {
    scaleLabelEls.forEach(el => el.textContent = trans.toner);
    scaleValueEls.forEach(el => el.textContent = '0.0 g');
    weightVal.val = 0.0;
  }, null, 0.75)
  // Drop falls
  .fromTo(scaleDrop, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.8)
  .to(scaleDrop, { y: 38, duration: 0.4, ease: 'power2.in' }, 0.9)
  .to(scaleDrop, { opacity: 0, duration: 0.1 }, 1.3)
  // Liquid rises
  .to(scaleLiquid, { scaleY: 0.66, duration: 0.3, ease: 'power2.out' }, 1.2)
  // Weight counts up to 12.0g
  .to(weightVal, {
    val: 12.0,
    duration: 0.45,
    ease: 'power1.out',
    onUpdate: () => {
      scaleValueEls.forEach(el => el.textContent = weightVal.val.toFixed(1) + ' g');
    }
  }, 1.05)

  // ── Step 3: OX 20 VOL (1.5 to 2.3) ──
  .call(() => {
    scaleLabelEls.forEach(el => el.textContent = trans.ox);
    scaleValueEls.forEach(el => el.textContent = '0.0 ml');
    weightVal.val = 0.0;
  }, null, 1.55)
  // Drop falls
  .fromTo(scaleDrop, { y: 0, opacity: 0 }, { opacity: 1, duration: 0.1 }, 1.6)
  .to(scaleDrop, { y: 38, duration: 0.4, ease: 'power2.in' }, 1.7)
  .to(scaleDrop, { opacity: 0, duration: 0.1 }, 2.1)
  // Liquid rises
  .to(scaleLiquid, { scaleY: 1.0, duration: 0.3, ease: 'power2.out' }, 2.0)
  // Weight counts up to 60.0ml
  .to(weightVal, {
    val: 60.0,
    duration: 0.45,
    ease: 'power1.out',
    onUpdate: () => {
      scaleValueEls.forEach(el => el.textContent = weightVal.val.toFixed(1) + ' ml');
    }
  }, 1.85)

  // Finalize Mix status
  .call(() => {
    scaleStatusEls.forEach(el => {
      el.textContent = trans.saved;
      el.style.color = '#a8dadc';
      el.style.borderColor = '#a8dadc';
    });
  }, null, 2.35)

  // ── Flip 1: Front to Back (2.4 to 3.2) ──
  .to('#pcard-01 .pc-3d-card', { rotateY: 180, ease: 'power1.inOut', duration: 0.8 }, 2.5)
  .call(() => {
    document.querySelectorAll('#pcard-01 .pc-3d-front').forEach(el => el.classList.remove('is-deducting'));
  }, null, 2.5)

  // Pause on View 2 (3.2 to 4.2)

  // ── Flip 2: Back to Front (4.2 to 5.0) ──
  .to('#pcard-01 .pc-3d-card', { rotateY: 360, ease: 'power1.inOut', duration: 0.8 }, 4.2)
  .call(() => {
    document.querySelectorAll('#pcard-01 .pc-3d-front').forEach(el => el.classList.add('is-deducting'));
  }, null, 4.6)
  .call(() => { playScannerBeep(); triggerCardBump(); }, null, 4.7)
  .fromTo('#pcard-01 .pc-purchased', 
    { boxShadow: '0 0 0 rgba(214, 48, 48, 0)', scale: 1 }, 
    { boxShadow: '0 0 15px rgba(214, 48, 48, 0.9)', scale: 1.1, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 
    4.7
  )

  // Animate stock bars draining inside View 3
  .fromTo('#pcard-01 .fill-7n', { width: '85%' }, { width: '60%', duration: 0.6, ease: 'power2.out' }, 4.7)
  .fromTo('#pcard-01 .fill-8gg', { width: '90%' }, { width: '80%', duration: 0.6, ease: 'power2.out' }, 4.7)
  .fromTo('#pcard-01 .fill-ox', { width: '100%' }, { width: '50%', duration: 0.6, ease: 'power2.out' }, 4.7)

  // Collapse and shrink the card at the end of the scroll
  .to(['#pcard-01 .pc-tag', '#pcard-01 .pc-mid', '#pcard-01 .pc-bc-wrap', '#pcard-01 .pc-purchased', '#pcard-01 .pm', '#pcard-01 .pc-ing'], { opacity: 0, duration: 0.5 }, 6.0)
  .to('#pcard-01 .pc-top', { borderBottomColor: 'transparent', duration: 0.3 }, 6.0)
  .to('#pcard-01 .pc-bot', { borderTopColor:    'transparent', duration: 0.3 }, 6.0)
  .to('#pcard-01', { width: 110, height: 110, minHeight: 110, ease: 'power2.inOut', duration: 0.8 }, 6.2)
  
  // Slide out #01 label and slide in #02 label
  .to('#pcard-01 .num-current',   { x: -60, opacity: 0, duration: 0.4 }, 6.6)
  .to('#pcard-01 .label-current', { x: -40, opacity: 0, duration: 0.4 }, 6.6)
  .to('#pcard-01 .num-next',      { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 6.8)
  .to('#pcard-01 .label-next',    { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 6.8);

// ── CARD #02 CUSTOM 3D FLIP TIMELINES ──────────────────
const card02 = document.getElementById('pcard-02');

gsap.set('#pcard-02', { overflow: 'hidden' });
gsap.set('#pcard-02 .num-next',    { x: 120, opacity: 0 });
gsap.set('#pcard-02 .label-next',  { x: 40,  opacity: 0 });
gsap.set(['#pcard-02 .num-current', '#pcard-02 .label-current', '#pcard-02 .pc-bc-wrap', '#pcard-02 .pc-purchased', '#pcard-02 .pm'], { opacity: 0, x: -30 });
gsap.set(['#pcard-02 .pc-tag', '#pcard-02 .pc-ing'], { opacity: 0, x: 30 });
gsap.set('#pcard-02 .pc-mid', { opacity: 0 });
gsap.set('#pcard-02 .pc-top', { borderBottomColor: 'transparent' });
gsap.set('#pcard-02 .pc-bot', { borderTopColor: 'transparent' });

const card02RevealTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan-02',
    start: 'top 80%',
    end: 'top top',
    scrub: 1.2
  }
});
card02RevealTl
  .to('#pcard-02 .pc-top', { borderBottomColor: 'rgba(0,0,0,0.1)', duration: 0.3 }, 0)
  .to('#pcard-02 .pc-bot', { borderTopColor: 'rgba(0,0,0,0.12)',   duration: 0.3 }, 0)
  .to('#pcard-02 .num-current',   { opacity: 1, x: 0, duration: 0.5 }, 0.1)
  .to('#pcard-02 .label-current', { opacity: 1, x: 0, duration: 0.5 }, 0.2)
  .to('#pcard-02 .pc-tag',        { opacity: 1, x: 0, duration: 0.5 }, 0.25)
  .to('#pcard-02 .pc-mid',       { opacity: 1,        duration: 0.5 }, 0.4)
  .to('#pcard-02 .pc-bc-wrap',   { opacity: 1, x: 0, duration: 0.5 }, 0.5)
  .to('#pcard-02 .pc-purchased', { opacity: 1, x: 0, duration: 0.5 }, 0.6)
  .to('#pcard-02 .pm',           { opacity: 1, x: 0, stagger: 0.05, duration: 0.4 }, 0.7)
  .to('#pcard-02 .pc-ing',       { opacity: 1, x: 0, duration: 0.5 }, 1.0);

const card02CollapseTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan-02',
    start: 'top top',
    end: `+=${window.innerHeight * 4.0}`,
    scrub: 1.5,
    pin: true
  }
});

card02CollapseTl
  .set('#pcard-02 .pc-3d-card', { rotateY: 0 })
  .call(() => {
    document.querySelectorAll('#pcard-02 .pc-3d-front').forEach(el => el.classList.remove('is-deducting'));
  }, null, 0.0)

  // ── Flip 1: Front to Back (2.5 to 3.3) ──
  .to('#pcard-02 .pc-3d-card', { rotateY: 180, ease: 'power1.inOut', duration: 0.8 }, 2.5)
  .call(() => {
    document.querySelectorAll('#pcard-02 .pc-3d-front').forEach(el => el.classList.remove('is-deducting'));
  }, null, 2.5)

  // ── Flip 2: Back to Front (4.2 to 5.0) ──
  .to('#pcard-02 .pc-3d-card', { rotateY: 360, ease: 'power1.inOut', duration: 0.8 }, 4.2)
  .call(() => {
    document.querySelectorAll('#pcard-02 .pc-3d-front').forEach(el => el.classList.add('is-deducting'));
  }, null, 4.6)
  .call(() => { playScannerBeep(); triggerCardBump('pcard-02'); }, null, 4.7)
  .fromTo('#pcard-02 .pc-purchased', 
    { boxShadow: '0 0 0 rgba(214, 48, 48, 0)', scale: 1 }, 
    { boxShadow: '0 0 15px rgba(214, 48, 48, 0.9)', scale: 1.1, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' }, 
    4.7
  )

  // Collapse and shrink at the end of the scroll
  .to(['#pcard-02 .pc-tag', '#pcard-02 .pc-mid', '#pcard-02 .pc-bc-wrap', '#pcard-02 .pc-purchased', '#pcard-02 .pm', '#pcard-02 .pc-ing'], { opacity: 0, duration: 0.5 }, 6.0)
  .to('#pcard-02 .pc-top', { borderBottomColor: 'transparent', duration: 0.3 }, 6.0)
  .to('#pcard-02 .pc-bot', { borderTopColor:    'transparent', duration: 0.3 }, 6.0)
  .to('#pcard-02', { width: 110, height: 110, minHeight: 110, ease: 'power2.inOut', duration: 0.8 }, 6.2)

  // Slide out #02 label and slide in #03 label
  .to('#pcard-02 .num-current',   { x: -60, opacity: 0, duration: 0.4 }, 6.6)
  .to('#pcard-02 .label-current', { x: -40, opacity: 0, duration: 0.4 }, 6.6)
  .to('#pcard-02 .num-next',      { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 6.8)
  .to('#pcard-02 .label-next',    { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 6.8);

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

// ── CARD #03 CUSTOM 3D FLIP TIMELINE ──────────────────
gsap.set('#pcard-03', { overflow: 'hidden' });
gsap.set('#pcard-03 .num-next',    { x: 120, opacity: 0 });
gsap.set('#pcard-03 .label-next',  { x: 40,  opacity: 0 });
gsap.set(['#pcard-03 .num-current', '#pcard-03 .label-current', '#pcard-03 .pc-bc-wrap', '#pcard-03 .pc-purchased', '#pcard-03 .pm'], { opacity: 0, x: -30 });
gsap.set(['#pcard-03 .pc-tag', '#pcard-03 .pc-ing'], { opacity: 0, x: 30 });
gsap.set('#pcard-03 .pc-mid', { opacity: 0 });
gsap.set('#pcard-03 .pc-top', { borderBottomColor: 'transparent' });
gsap.set('#pcard-03 .pc-bot', { borderTopColor: 'transparent' });
gsap.set('#pcard-03 .pc-3d-card', { rotateY: 0 });
gsap.set('#pcard-03 .st-data', { opacity: 0, y: 6 });
gsap.set('#pcard-03 .pl-row, #pcard-03 .pl-divider, #pcard-03 .pl-synced', { opacity: 0 });

const card03RevealTl = gsap.timeline({
  scrollTrigger: { trigger: '#s-scan-03', start: 'top 80%', end: 'top top', scrub: 1.2 }
});
card03RevealTl
  .to('#pcard-03 .pc-top', { borderBottomColor: 'rgba(0,0,0,0.1)', duration: 0.3 }, 0)
  .to('#pcard-03 .pc-bot', { borderTopColor: 'rgba(0,0,0,0.12)',   duration: 0.3 }, 0)
  .to('#pcard-03 .num-current',   { opacity: 1, x: 0, duration: 0.5 }, 0.1)
  .to('#pcard-03 .label-current', { opacity: 1, x: 0, duration: 0.5 }, 0.2)
  .to('#pcard-03 .pc-tag',        { opacity: 1, x: 0, duration: 0.5 }, 0.25)
  .to('#pcard-03 .pc-mid',        { opacity: 1,        duration: 0.5 }, 0.4)
  .to('#pcard-03 .pc-bc-wrap',    { opacity: 1, x: 0, duration: 0.5 }, 0.5)
  .to('#pcard-03 .pc-purchased',  { opacity: 1, x: 0, duration: 0.5 }, 0.6)
  .to('#pcard-03 .pm',            { opacity: 1, x: 0, stagger: 0.05, duration: 0.4 }, 0.7)
  .to('#pcard-03 .pc-ing',        { opacity: 1, x: 0, duration: 0.5 }, 1.0);

const adVal03    = { val: 0 };
const adChange03 = { val: 0.0 };
const adRet03    = { val: 0 };
const adBooked03 = { val: 0 };
const plProfit03 = { val: 0 };

const card03CollapseTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#s-scan-03',
    start: 'top top',
    end: `+=${window.innerHeight * 5.0}`,
    scrub: 1.5,
    pin: true
  }
});

card03CollapseTl
  .set('#pcard-03 .pc-3d-card', { rotateY: 0 })
  .call(() => {
    document.querySelectorAll('#pcard-03 .pc-3d-front').forEach(el => el.classList.remove('is-deducting'));
  }, null, 0.0)

  // ── View 1: graph draws, numbers count up (0.0 → 2.5) ──
  .to(adVal03, {
    val: 12400, duration: 1.2, ease: 'power1.out',
    onUpdate: () => {
      document.querySelectorAll('#pcard-03 .ad-value-03').forEach(el => {
        el.textContent = '$' + Math.round(adVal03.val).toLocaleString();
      });
    }
  }, 0.2)
  .to(adChange03, {
    val: 12.5, duration: 1.2, ease: 'power1.out',
    onUpdate: () => {
      document.querySelectorAll('#pcard-03 .ad-change-03').forEach(el => {
        el.textContent = '+' + adChange03.val.toFixed(1) + '%';
      });
    }
  }, 0.2)
  .to('#pcard-03 .graph-line-03', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out' }, 0.3)
  .to('#pcard-03 .graph-dot-03',  { opacity: 1, duration: 0.3, ease: 'power2.out' }, 1.6)
  .to(adRet03, {
    val: 94, duration: 0.9, ease: 'power1.out',
    onUpdate: () => {
      document.querySelectorAll('#pcard-03 .ad-ret-03').forEach(el => {
        el.textContent = Math.round(adRet03.val) + '%';
      });
    }
  }, 0.6)
  .to(adBooked03, {
    val: 88, duration: 0.9, ease: 'power1.out',
    onUpdate: () => {
      document.querySelectorAll('#pcard-03 .ad-booked-03').forEach(el => {
        el.textContent = Math.round(adBooked03.val) + '%';
      });
    }
  }, 0.8)

  // ── Flip 1: Front → Back (2.5 → 3.3) ──
  .to('#pcard-03 .pc-3d-card', { rotateY: 180, ease: 'power1.inOut', duration: 0.8 }, 2.5)

  // ── View 2: stylist rows stagger in (3.4 → 4.3) ──
  .to('#pcard-03 .st-data', { opacity: 1, y: 0, duration: 0.3, stagger: 0.18, ease: 'power2.out' }, 3.4)

  // ── Flip 2: Back → Front (4.5 → 5.3) ──
  .to('#pcard-03 .pc-3d-card', { rotateY: 360, ease: 'power1.inOut', duration: 0.8 }, 4.5)

  // ── Flip complete: swap content, then beep (5.3 → 5.5) ──
  .call(() => {
    document.querySelectorAll('#pcard-03 .pc-3d-front').forEach(el => el.classList.add('is-deducting'));
  }, null, 5.3)
  .call(() => { playScannerBeep(); triggerCardBump('pcard-03'); }, null, 5.5)
  .to('#pcard-03 .pc-purchased', { boxShadow: '0 0 15px rgba(214,48,48,0.9)', scale: 1.06, duration: 0.2, ease: 'power2.out' }, 5.5)
  .to('#pcard-03 .pc-purchased', { boxShadow: '0 0 0 rgba(214,48,48,0)', scale: 1, duration: 0.25, ease: 'power2.in' }, 5.72)

  // ── View 3: ledger animates in, profit counts up (5.6 → 6.6) ──
  .to('#pcard-03 .pl-row-gross',  { opacity: 1, duration: 0.3, ease: 'power2.out' }, 5.65)
  .to('#pcard-03 .pl-row-exp',    { opacity: 1, duration: 0.3, ease: 'power2.out' }, 5.9)
  .to('#pcard-03 .pl-divider',    { opacity: 1, duration: 0.2 }, 6.1)
  .to('#pcard-03 .pl-profit-row', { opacity: 1, duration: 0.3, ease: 'power2.out' }, 6.2)
  .to(plProfit03, {
    val: 8600, duration: 0.7, ease: 'power1.out',
    onUpdate: () => {
      document.querySelectorAll('#pcard-03 .pl-profit-val').forEach(el => {
        el.textContent = '$' + Math.round(plProfit03.val).toLocaleString();
      });
    }
  }, 6.2)
  .to('#pcard-03 .pl-synced', {
    opacity: 1, boxShadow: '0 0 12px rgba(0,245,212,0.4)', duration: 0.4, ease: 'power2.out'
  }, 6.7)

  // ── Collapse (7.5 → 8.8) ──
  .to('#pcard-03 .pc-3d-card', { rotateY: 0, duration: 0.1 }, 7.4)
  .to(['#pcard-03 .pc-tag', '#pcard-03 .pc-mid', '#pcard-03 .pc-bc-wrap', '#pcard-03 .pc-purchased', '#pcard-03 .pm', '#pcard-03 .pc-ing'],
    { opacity: 0, duration: 0.5 }, 7.5)
  .to('#pcard-03 .pc-top', { borderBottomColor: 'transparent', duration: 0.3 }, 7.5)
  .to('#pcard-03 .pc-bot', { borderTopColor:    'transparent', duration: 0.3 }, 7.5)
  .to('#pcard-03', { width: 110, height: 110, minHeight: 110, ease: 'power2.inOut', duration: 0.8 }, 7.8)
  .to('#pcard-03 .num-current',   { x: -60, opacity: 0, duration: 0.4 }, 8.2)
  .to('#pcard-03 .label-current', { x: -40, opacity: 0, duration: 0.4 }, 8.2)
  .to('#pcard-03 .num-next',      { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 8.4)
  .to('#pcard-03 .label-next',    { x: 0,   opacity: 1, duration: 0.4, ease: 'power2.out' }, 8.4);

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
  // Logic moved into scrubbed scrollTrigger collapse timeline to animate on scroll
}

// initArchiveAnimation deleted

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

let lastBeepTime = 0;
function playScannerBeep() {
  if (_isSoundMuted) return;
  const now = Date.now();
  if (now - lastBeepTime < 800) return;
  lastBeepTime = now;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    if (ctx.state === 'suspended') return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn("Scanner beep failed:", e);
  }
}

let lastBumpTime = 0;
function triggerCardBump(cardId = 'pcard-01') {
  const now = Date.now();
  if (now - lastBumpTime < 800) return;
  lastBumpTime = now;
  try {
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  } catch (e) {}
  
  // Real-time visual bump on desktop & mobile (non-scrubbed)
  gsap.fromTo(`#${cardId}`, 
    { y: 0, scale: 1 }, 
    { y: -10, scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'y,scale' }
  );
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
    const cleanedHTML = title.innerHTML
      .replace(/[\r\n\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split innerHTML preserving <br> tags (including classes)
    const parts = cleanedHTML.split(/(<br\b[^>]*>)/gi);
    title.innerHTML = parts.map(p =>
      p.match(/^<br/i) ? p :
      [...p].map(ch => ch === ' ' ? '\u00A0' : `<span class="tw-ch">${ch}</span>`).join('')
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
  initAdminAnimation();
  initLoyaltyAnimation();
  initUnmuteButton();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initTypewriterTitles();
  initScaleAnimation();
  initAdminAnimation();
  initLoyaltyAnimation();
  initUnmuteButton();
}

// ── WAITLIST POPUP ──────────────────────────────────────
function openWaitlist() {
  const overlay = document.getElementById('waitlist-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { if (window._initShaders) window._initShaders(); }, 50);
}
function closeWaitlist() {
  const overlay = document.getElementById('waitlist-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('waitlist-overlay');
  const closeBtn = document.getElementById('waitlist-close');
  const form = document.getElementById('waitlist-form');
  const thanks = document.getElementById('waitlist-thanks');

  if (closeBtn) closeBtn.addEventListener('click', closeWaitlist);
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeWaitlist();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeWaitlist();
  });

  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.hidden = true;
          if (thanks) thanks.hidden = false;
        }
      } catch(err) {}
    });
  }
});

let _wlMetalDone = false;
function initWaitlistMetal() {
  if (_wlMetalDone) return;
  const container = document.getElementById('liquid-metal-wl');
  if (!container || typeof ShaderMount === 'undefined') return;
  _wlMetalDone = true;
  new ShaderMount(container, liquidMetalFragmentShader, {
    color1: '#e8e0d8', color2: '#c8c0b8', color3: '#a89888',
    speed: 0.6, scale: 1.2
  });
}
