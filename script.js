/* =========================================================
   Patil Agro Traders – script.js (vanilla JS + Three.js)
   ========================================================= */
'use strict';

/* ---------- 1. WhatsApp (single source of truth) ---------- */
function openWhatsApp(message) {
  const phone = "919545172111";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
const DEFAULT_MSG = "नमस्कार, मला पाटील ॲग्रो ट्रेडर्सच्या ऊस रोपांबद्दल माहिती हवी आहे.";
/* Global WhatsApp click handler for all buttons and chips */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-msg]');
  if (el) {
    e.preventDefault();
    openWhatsApp(el.dataset.msg || DEFAULT_MSG);
  }
});



/* ---------- 2. Page load, navbar, mobile menu ---------- */
(function ensureLogos() {
  if (!document.querySelector('link[rel="icon"]')) {
    const fav = document.createElement('link');
    fav.rel = 'icon'; fav.type = 'image/png'; fav.href = 'logo.png';
    document.head.appendChild(fav);
  }
  const brandLink = document.querySelector('#nav .logo');
  if (brandLink && !brandLink.querySelector('img.brand-logo')) {
    brandLink.innerHTML = '<img src="logo.png" alt="पाटील ॲग्रो ट्रेडर्स लोगो" class="brand-logo" width="36" height="36"> पाटील ॲग्रो ट्रेडर्स';
  }
  const footH3 = document.querySelector('footer .foot h3');
  if (footH3 && !footH3.querySelector('img.foot-logo')) {
    footH3.innerHTML = '<img src="logo.png" alt="पाटील ॲग्रो ट्रेडर्स लोगो" class="foot-logo" width="42" height="42"> पाटील ॲग्रो ट्रेडर्स';
  }
})();

window.addEventListener('load', () => setTimeout(() => document.body.classList.remove('loading'), 500));
const nav = document.getElementById('nav'),
      menu = document.getElementById('menu'),
      burger = document.getElementById('burger'),
      backdrop = document.getElementById('menuBackdrop');

const onScroll = () => {
  if (nav) nav.classList.toggle('solid', window.scrollY > 40);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const setMenu = open => {
  if (!menu || !burger) return;
  menu.classList.toggle('open', open);
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (backdrop) backdrop.classList.toggle('open', open);
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
};

if (burger) {
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
}
if (backdrop) {
  backdrop.addEventListener('click', () => setMenu(false));
}
if (menu) {
  menu.querySelectorAll('a, button').forEach(el => el.addEventListener('click', () => setMenu(false)));
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu && menu.classList.contains('open')) {
    setMenu(false);
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 920 && menu && menu.classList.contains('open')) {
    setMenu(false);
  }
});

/* ---------- 3. Scroll reveal (staggered) + counters ---------- */
function countUp(el) {
  const end = +el.dataset.n, suf = el.dataset.s || '', t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1400, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add('in');
  en.target.querySelectorAll('[data-n]').forEach(countUp);
  io.unobserve(en.target);
}), { threshold: .15 });
document.querySelectorAll('.grid, .stats, .steps').forEach(g =>
  [...g.children].forEach((c, i) => c.style.setProperty('--d', i * 0.1 + 's')));
document.querySelectorAll('.rv, .steps').forEach(el => io.observe(el));

/* ---------- 4. Hero parallax on text (subtle) ---------- */
const heroIn = document.querySelector('.hero-in');
window.addEventListener('scroll', () => {
  if (window.scrollY < innerHeight) heroIn.style.marginTop = (window.scrollY * -0.12) + 'px';
}, { passive: true });

/* ---------- 5. Three.js helpers ---------- */
const isMobile = matchMedia('(max-width: 768px)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Creates renderer/scene/camera bound to a canvas, handles resize + off-screen pausing. */
function createStage(canvas, fov, camZ) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.z = camZ;
  const box = canvas.parentElement;
  const resize = () => {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  resize(); window.addEventListener('resize', resize);
  let visible = true;
  new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(box);
  const mouse = { x: 0, y: 0 };
  window.addEventListener('pointermove', e => {
    mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  }, { passive: true });
  /** run(fn): fn(time, mouse) is called each frame only while visible and tab active */
  const run = fn => {
    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      fn(clock.getElapsedTime(), mouse); renderer.render(scene, camera);
    })();
  };
  return { scene, camera, run };
}

/** Sugarcane-style leaf: long blade, curved and tapered. */
function leafGeometry(len, wid) {
  const g = new THREE.PlaneGeometry(wid, len, 1, 8); g.translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / len;
    p.setX(i, p.getX(i) * Math.sin(Math.PI * Math.min(1, t * 1.05 + .05)));
    p.setZ(i, t * t * len * 0.35);
  }
  g.computeVertexNormals(); return g;
}
function lights(scene, color) {
  scene.add(new THREE.AmbientLight(0xbfe8c0, .7));
  const d = new THREE.DirectionalLight(color || 0xfff0b0, 1.1); d.position.set(3, 5, 4); scene.add(d);
}

/* ---------- 6. Hero scene: particles + floating leaves ---------- */
(function hero() {
  const canvas = document.getElementById('heroCanvas');
  if (!window.THREE || !canvas) return;
  const { scene, camera, run } = createStage(canvas, 60, 10);
  lights(scene);
  const N = isMobile ? 70 : 180, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - .5) * (i % 3 === 2 ? 10 : 22);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf3dc8a, size: .07, transparent: true, opacity: .75 }));
  scene.add(pts);
  const geo = leafGeometry(1.4, .35), mats = [0x4caf50, 0x2e7d32, 0x8bc34a].map(c =>
    new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: .6 }));
  const leaves = [];
  for (let i = 0; i < (isMobile ? 9 : 22); i++) {
    const m = new THREE.Mesh(geo, mats[i % 3]);
    m.position.set((Math.random() - .5) * 18, (Math.random() - .5) * 10, (Math.random() - .5) * 6 - 1);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    m.userData = { s: .15 + Math.random() * .3, y: m.position.y, o: Math.random() * 6 };
    scene.add(m); leaves.push(m);
  }
  const k = reduced ? 0 : 1;
  run((t, mouse) => {
    pts.rotation.y = t * .02 * k;
    leaves.forEach(l => {
      l.rotation.x += .003 * l.userData.s * k; l.rotation.y += .004 * l.userData.s * k;
      l.position.y = l.userData.y + Math.sin(t * l.userData.s + l.userData.o) * .5 * k;
    });
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * .03;
    camera.position.y += (-mouse.y * .8 - camera.position.y) * .03;
    camera.lookAt(0, 0, 0);
  });
})();

/* ---------- 7. Video Showcase Playback Handler ---------- */
(function initVideoShowcase() {
  function setupVideo() {
    const plantSec = document.getElementById('plant');
    if (plantSec && !plantSec.querySelector('video')) {
      plantSec.className = 'sec video-sec';
      plantSec.id = 'video';
      plantSec.innerHTML = '<div class="wrap c rv in"><div class="video-card"><video class="showcase-vdo" src="vdo.mp4" autoplay loop muted playsinline controls preload="metadata" aria-label="पाटील ॲग्रो ट्रेडर्स – ऊस रोपवाटिका व्हिडिओ">तुमचा ब्राउझर व्हिडिओ प्लेबॅकला सपोर्ट करत नाही.</video></div></div>';
    }
    const vdo = document.querySelector('.showcase-vdo');
    if (!vdo) return;
    if ('IntersectionObserver' in window) {
      const vdoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            vdo.play().catch(() => {});
          } else {
            vdo.pause();
          }
        });
      }, { threshold: 0.2 });
      vdoObserver.observe(vdo);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupVideo);
  } else {
    setupVideo();
  }
})();

/* ---------- 8. Products Carousel Slider ---------- */
(function initProductSlider() {
  const productsSec = document.getElementById('products');
  if (!productsSec) return;

  const track = document.getElementById('prodTrack') || productsSec.querySelector('.grid.g4') || productsSec.querySelector('.grid');
  if (!track) return;

  // Self-heal: Ensure cards have direct WhatsApp inquiry buttons and variety list
  const inquiryMsgs = [
    "नमस्कार, मला उच्च दर्जाच्या ऊस रोपांबद्दल चौकशी करायची आहे.",
    "नमस्कार, मला ऊस रोपांची किंमत आणि उपलब्धता जाणून घ्यायची आहे.",
    "नमस्कार, मला निवडक ऊस जातींबद्दल चौकशी करायची आहे.",
    "नमस्कार, मला Home Delivery बद्दल माहिती हवी आहे."
  ];

  const allCards = Array.from(track.querySelectorAll('.card.prod'));
  allCards.forEach((card, idx) => {
    // If card has old vpanel, convert it into direct .prod-info
    const vpanel = card.querySelector('.vpanel');
    if (vpanel) {
      if (!card.querySelector('.prod-info')) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'prod-info';
        const vt = vpanel.querySelector('.vt');
        if (vt) infoDiv.appendChild(vt);
        const chips = vpanel.querySelector('.chips');
        if (chips) infoDiv.appendChild(chips);
        const mini = vpanel.querySelector('.mini');
        if (mini) infoDiv.appendChild(mini);
        const oldBtn = card.querySelector('button');
        if (oldBtn) card.insertBefore(infoDiv, oldBtn);
        else card.appendChild(infoDiv);
      }
      vpanel.remove();
    }

    // Ensure main inquiry button opens WhatsApp directly
    let btn = card.querySelector('.btn.wa.sm') || card.querySelector('button.btn') || card.querySelector('button:not(.chip)');
    if (btn) {
      btn.removeAttribute('data-toggle');
      btn.removeAttribute('aria-expanded');
      btn.removeAttribute('aria-controls');
      btn.className = 'btn wa sm';
      if (!btn.dataset.msg) {
        btn.dataset.msg = inquiryMsgs[idx] || DEFAULT_MSG;
      }
      if (!btn.querySelector('svg.ic')) {
        btn.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-wa"/></svg> चौकशी करा';
      }
    }
  });

  // Ensure dynamic carousel wrapper if not present in HTML
  let wrap = document.querySelector('.prod-slider');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'prod-slider rv in';
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
  }
  track.id = 'prodTrack';
  track.classList.add('prod-track');

  let prevBtn = document.getElementById('prodPrev');
  if (!prevBtn) {
    prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'slider-btn prev';
    prevBtn.id = 'prodPrev';
    prevBtn.setAttribute('aria-label', 'मागील रोप');
    prevBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    wrap.insertBefore(prevBtn, wrap.firstChild);
  }
  let nextBtn = document.getElementById('prodNext');
  if (!nextBtn) {
    nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'slider-btn next';
    nextBtn.id = 'prodNext';
    nextBtn.setAttribute('aria-label', 'पुढील रोप');
    nextBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
    wrap.appendChild(nextBtn);
  }
  let dotsContainer = document.getElementById('prodDots');
  if (!dotsContainer) {
    dotsContainer = document.createElement('div');
    dotsContainer.className = 'slider-dots';
    dotsContainer.id = 'prodDots';
    dotsContainer.setAttribute('role', 'tablist');
    dotsContainer.setAttribute('aria-label', 'स्लाइड्स');
    wrap.appendChild(dotsContainer);
  }

  const cards = Array.from(track.querySelectorAll('.card.prod'));
  if (!cards.length) return;

  let positions = [];
  let currentIndex = 0;
  let autoSlideTimer = null;
  let isHovered = false;
  let isDragging = false;
  let dragMoved = false;
  let startX = 0;
  let scrollStart = 0;

  function calculatePositions() {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const computed = [];
    cards.forEach(card => {
      const left = card.offsetLeft - track.offsetLeft;
      if (left <= maxScroll + 5 && !computed.some(p => Math.abs(p - left) < 15)) {
        computed.push(left);
      }
    });
    if (computed.length === 0 || Math.abs(computed[computed.length - 1] - maxScroll) > 15) {
      computed.push(maxScroll);
    }
    positions = [...new Set(computed)].sort((a, b) => a - b);
    buildDots();
    updateActiveDot();
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    if (positions.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      dotsContainer.style.display = 'none';
      return;
    }
    prevBtn.style.display = '';
    nextBtn.style.display = '';
    dotsContainer.style.display = 'flex';

    positions.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (idx === currentIndex ? ' active' : '');
      dot.setAttribute('aria-label', `स्लाइड ${idx + 1}`);
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', idx === currentIndex ? 'true' : 'false');
      dot.addEventListener('click', () => {
        goToSlide(idx);
        restartAutoSlide();
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateActiveDot() {
    if (!positions.length) return;
    const currentScroll = track.scrollLeft;
    let closestIdx = 0;
    let minDiff = Infinity;
    positions.forEach((pos, idx) => {
      const diff = Math.abs(pos - currentScroll);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    currentIndex = closestIdx;
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      const isActive = idx === closestIdx;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function goToSlide(index) {
    if (!positions.length) return;
    currentIndex = (index + positions.length) % positions.length;
    track.scrollTo({ left: positions[currentIndex], behavior: 'smooth' });
    updateActiveDot();
  }

  prevBtn.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    restartAutoSlide();
  });
  nextBtn.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    restartAutoSlide();
  });

  let scrollDebounce;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(updateActiveDot, 50);
  }, { passive: true });

  function startAutoSlide() {
    stopAutoSlide();
    if (reduced || positions.length <= 1) return;
    autoSlideTimer = setInterval(() => {
      if (document.hidden || isHovered || isDragging) return;
      
      goToSlide(currentIndex + 1);
    }, 3800);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  function restartAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
  }

  wrap.addEventListener('mouseenter', () => { isHovered = true; });
  wrap.addEventListener('mouseleave', () => { isHovered = false; });

  track.addEventListener('touchstart', () => { isHovered = true; }, { passive: true });
  track.addEventListener('touchend', () => {
    setTimeout(() => { isHovered = false; }, 2000);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoSlide();
    else startAutoSlide();
  });

  track.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDragging = true;
    dragMoved = false;
    startX = e.pageX;
    scrollStart = track.scrollLeft;
    track.style.scrollBehavior = 'auto';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 6) {
      dragMoved = true;
      track.scrollLeft = scrollStart - dx;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    track.style.scrollBehavior = 'smooth';
    if (dragMoved) {
      const blockClick = ev => { ev.stopImmediatePropagation(); ev.preventDefault(); };
      track.addEventListener('click', blockClick, { capture: true, once: true });
      setTimeout(() => track.removeEventListener('click', blockClick, { capture: true }), 100);

      const currentScroll = track.scrollLeft;
      let nearestIdx = 0;
      let minDiff = Infinity;
      positions.forEach((pos, idx) => {
        const diff = Math.abs(pos - currentScroll);
        if (diff < minDiff) {
          minDiff = diff;
          nearestIdx = idx;
        }
      });
      goToSlide(nearestIdx);
    }
  });

  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToSlide(currentIndex - 1);
      restartAutoSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToSlide(currentIndex + 1);
      restartAutoSlide();
    }
  });

  let resizeTimer;
  const onResizeOrRotate = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calculatePositions();
    }, 120);
  };
  window.addEventListener('resize', onResizeOrRotate);
  window.addEventListener('orientationchange', onResizeOrRotate);

  // Calculate once DOM and styles are fully ready
  if (document.readyState === 'complete') {
    calculatePositions();
    startAutoSlide();
  } else {
    window.addEventListener('load', () => {
      calculatePositions();
      startAutoSlide();
    });
  }
})();