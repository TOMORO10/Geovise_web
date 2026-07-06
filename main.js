/* =========================================================
   GEOVISE.IO — MAIN.JS
   Canvas Animations, Scroll Effects, Interactivity
   ========================================================= */

(function () {
  'use strict';

  /* ── UTILS ─────────────────────────────────────────────── */
  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ── NAVBAR SCROLL ─────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  /* ── HAMBURGER MENU ─────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    spans[0].style.transform = navLinks.classList.contains('open') ? 'rotate(45deg) translateY(7px)' : '';
    spans[1].style.opacity = navLinks.classList.contains('open') ? '0' : '1';
    spans[2].style.transform = navLinks.classList.contains('open') ? 'rotate(-45deg) translateY(-7px)' : '';
  });
  // close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '1'; });
    });
  });

  /* ══════════════════════════════════════════════════════════
     HERO CANVAS — Animated global network
  ══════════════════════════════════════════════════════════ */
  const heroCanvas = document.getElementById('heroCanvas');
  if (!heroCanvas) return;
  const heroCtx = heroCanvas.getContext('2d');

  let heroNodes = [];
  let heroEdges = [];
  let heroW, heroH;
  let animFrameHero;
  let heroT = 0;

  const GOLD = '#D4A017';

  const WORLD_POINTS = [
    [0.125, 0.32], [0.13, 0.38], [0.14, 0.44], [0.18, 0.3],
    [0.18, 0.36], [0.2, 0.42], [0.22, 0.48], [0.24, 0.54],
    [0.25, 0.48], [0.27, 0.52], [0.28, 0.58], [0.3, 0.64],
    [0.32, 0.7], [0.34, 0.76], [0.3, 0.8], [0.33, 0.84],
    [0.44, 0.22], [0.46, 0.26], [0.48, 0.3], [0.5, 0.28],
    [0.52, 0.24], [0.54, 0.28], [0.56, 0.22], [0.46, 0.34],
    [0.48, 0.38], [0.5, 0.34],
    [0.48, 0.44], [0.5, 0.5], [0.5, 0.56], [0.52, 0.62],
    [0.52, 0.68], [0.54, 0.74], [0.46, 0.6], [0.44, 0.54],
    [0.58, 0.26], [0.6, 0.22], [0.65, 0.26], [0.68, 0.3],
    [0.7, 0.26], [0.72, 0.22], [0.75, 0.28], [0.78, 0.3],
    [0.8, 0.26], [0.63, 0.34], [0.66, 0.38], [0.7, 0.4],
    [0.74, 0.36], [0.78, 0.38],
    [0.54, 0.36], [0.56, 0.4], [0.58, 0.44],
    [0.78, 0.46], [0.82, 0.48], [0.84, 0.52], [0.82, 0.58],
    [0.84, 0.64], [0.86, 0.7], [0.88, 0.6],
    [0.22, 0.26], [0.24, 0.3], [0.26, 0.34], [0.28, 0.38],
    [0.3, 0.44],
  ];

  const KEY_NODES = [
    { rx: 0.15, ry: 0.42, label: 'California · CAISO', color: GOLD },
    { rx: 0.23, ry: 0.56, label: 'Texas · ERCOT', color: GOLD },
  ];

  function initHero() {
    heroW = heroCanvas.width  = heroCanvas.offsetWidth  || window.innerWidth;
    heroH = heroCanvas.height = heroCanvas.offsetHeight || window.innerHeight;

    heroNodes = WORLD_POINTS.map(([rx, ry]) => ({
      x: rx * heroW, y: ry * heroH,
      r: rand(1.2, 2.8),
      ox: rx * heroW, oy: ry * heroH,
      pulse: rand(0, Math.PI * 2),
      pulseSpeed: rand(0.008, 0.018),
      alpha: rand(0.3, 0.9),
      key: false,
    }));

    KEY_NODES.forEach(k => {
      heroNodes.push({
        x: k.rx * heroW, y: k.ry * heroH,
        r: 4.5, ox: k.rx * heroW, oy: k.ry * heroH,
        pulse: 0, pulseSpeed: 0.022, alpha: 1,
        key: true, color: k.color, label: k.label,
      });
    });

    heroEdges = [];
    const count = heroNodes.length;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = heroNodes[i].x - heroNodes[j].x;
        const dy = heroNodes[i].y - heroNodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < heroW * 0.18) heroEdges.push({ from: i, to: j, dist });
      }
    }
  }

  function drawHero() {
    heroCtx.clearRect(0, 0, heroW, heroH);

    const bgGrad = heroCtx.createRadialGradient(heroW * 0.15, heroH * 0.4, 0, heroW * 0.5, heroH * 0.5, heroW * 0.9);
    bgGrad.addColorStop(0, '#0e1e38');
    bgGrad.addColorStop(0.5, '#07111f');
    bgGrad.addColorStop(1, '#050d1a');
    heroCtx.fillStyle = bgGrad;
    heroCtx.fillRect(0, 0, heroW, heroH);

    heroCtx.strokeStyle = 'rgba(212,160,23,0.025)';
    heroCtx.lineWidth = 0.5;
    for (let x = 0; x < heroW; x += 60) {
      heroCtx.beginPath(); heroCtx.moveTo(x, 0); heroCtx.lineTo(x, heroH); heroCtx.stroke();
    }
    for (let y = 0; y < heroH; y += 60) {
      heroCtx.beginPath(); heroCtx.moveTo(0, y); heroCtx.lineTo(heroW, y); heroCtx.stroke();
    }

    heroT++;

    heroNodes.forEach((n, i) => {
      if (!n.key) {
        n.x = n.ox + Math.sin(heroT * 0.003 + i) * 4;
        n.y = n.oy + Math.cos(heroT * 0.004 + i) * 3;
      }
      n.pulse += n.pulseSpeed;
    });

    heroEdges.forEach(e => {
      const a = heroNodes[e.from], b = heroNodes[e.to];
      const fade = 1 - e.dist / (heroW * 0.18);
      heroCtx.beginPath();
      heroCtx.moveTo(a.x, a.y);
      heroCtx.lineTo(b.x, b.y);
      heroCtx.strokeStyle = (a.key || b.key)
        ? `rgba(212,160,23,${0.18 * fade})`
        : `rgba(212,160,23,${0.07 * fade})`;
      heroCtx.lineWidth = (a.key || b.key) ? 0.8 : 0.4;
      heroCtx.stroke();
    });

    heroNodes.forEach(n => {
      const pulse = Math.sin(n.pulse) * 0.5 + 0.5;
      if (n.key) {
        heroCtx.beginPath();
        heroCtx.arc(n.x, n.y, 18 + pulse * 8, 0, Math.PI * 2);
        heroCtx.fillStyle = 'rgba(212,160,23,0.06)';
        heroCtx.fill();
        heroCtx.beginPath();
        heroCtx.arc(n.x, n.y, 10 + pulse * 4, 0, Math.PI * 2);
        heroCtx.fillStyle = 'rgba(212,160,23,0.12)';
        heroCtx.fill();
        heroCtx.beginPath();
        heroCtx.arc(n.x, n.y, n.r + pulse * 1.5, 0, Math.PI * 2);
        heroCtx.fillStyle = n.color || GOLD;
        heroCtx.shadowColor = n.color || GOLD;
        heroCtx.shadowBlur = 12;
        heroCtx.fill();
        heroCtx.shadowBlur = 0;
      } else {
        heroCtx.beginPath();
        heroCtx.arc(n.x, n.y, n.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        heroCtx.fillStyle = `rgba(212,160,23,${n.alpha * (0.4 + pulse * 0.4)})`;
        heroCtx.fill();
      }
    });

    const pe = heroEdges[Math.floor(heroT * 0.5) % heroEdges.length];
    if (pe) {
      const pa = heroNodes[pe.from], pb = heroNodes[pe.to];
      const t2 = (heroT * 0.02) % 1;
      heroCtx.beginPath();
      heroCtx.arc(pa.x + (pb.x - pa.x) * t2, pa.y + (pb.y - pa.y) * t2, 2, 0, Math.PI * 2);
      heroCtx.fillStyle = GOLD;
      heroCtx.shadowColor = GOLD;
      heroCtx.shadowBlur = 8;
      heroCtx.fill();
      heroCtx.shadowBlur = 0;
    }

    animFrameHero = requestAnimationFrame(drawHero);
  }

  function startHero() {
    initHero();
    if (animFrameHero) cancelAnimationFrame(animFrameHero);
    drawHero();
  }

  window.addEventListener('resize', () => { cancelAnimationFrame(animFrameHero); startHero(); });
  startHero();



  /* ══════════════════════════════════════════════════════════
     MINI NETWORK CANVAS — Value section
  ══════════════════════════════════════════════════════════ */
  const miniCanvas = document.getElementById('miniNetworkCanvas');
  if (miniCanvas) {
    const mCtx = miniCanvas.getContext('2d');
    const mW = 320, mH = 320;
    miniCanvas.width = mW; miniCanvas.height = mH;

    const mNodes = Array.from({ length: 18 }, () => ({
      x: rand(20, mW - 20),
      y: rand(20, mH - 20),
      r: rand(2, 4.5),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      pulse: rand(0, Math.PI * 2),
      ps: rand(0.02, 0.04),
    }));

    const mEdges = [];
    for (let i = 0; i < mNodes.length; i++) {
      for (let j = i + 1; j < mNodes.length; j++) {
        const dx = mNodes[i].x - mNodes[j].x;
        const dy = mNodes[i].y - mNodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 100) mEdges.push([i, j]);
      }
    }

    let mT = 0;
    (function drawMini() {
      mCtx.clearRect(0, 0, mW, mH);
      mCtx.fillStyle = '#0a1628';
      mCtx.fillRect(0, 0, mW, mH);

      mNodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.pulse += n.ps;
        if (n.x < 10 || n.x > mW - 10) n.vx *= -1;
        if (n.y < 10 || n.y > mH - 10) n.vy *= -1;
      });

      mEdges.forEach(([i, j]) => {
        const a = mNodes[i], b = mNodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) {
          mCtx.beginPath();
          mCtx.moveTo(a.x, a.y);
          mCtx.lineTo(b.x, b.y);
          mCtx.strokeStyle = `rgba(212,160,23,${0.4 * (1 - d / 110)})`;
          mCtx.lineWidth = 0.8;
          mCtx.stroke();
        }
      });

      mNodes.forEach(n => {
        const p = Math.sin(n.pulse) * 0.5 + 0.5;
        mCtx.beginPath();
        mCtx.arc(n.x, n.y, n.r * (0.7 + p * 0.5), 0, Math.PI * 2);
        mCtx.fillStyle = `rgba(212,160,23,${0.5 + p * 0.5})`;
        mCtx.shadowColor = GOLD;
        mCtx.shadowBlur = 6;
        mCtx.fill();
        mCtx.shadowBlur = 0;
      });

      mT++;
      requestAnimationFrame(drawMini);
    })();
  }


  /* ══════════════════════════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════════════════════════ */
  const revealTargets = document.querySelectorAll(
    '.value-grid, .service-card, .tech-box, .market-card, .contact-form'
  );

  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(el => revealObs.observe(el));


  /* ══════════════════════════════════════════════════════════
     CONTACT FORM — Real Supabase Integration
  ══════════════════════════════════════════════════════════ */
  // Supabase Configuration
  const SUPABASE_URL = 'https://jwvfljkmnkalkswquogl.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_iUTUPSHTjzZMLzAiT73fmg_9VKEahL_';

  // --- FORM HANDLERS (Landing & BESS) ---
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Basic Validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalBtnText = btn.textContent;
      const formSuccess = form.parentElement.querySelector('.form-success');
      
      btn.textContent = 'Sending...';
      btn.disabled = true;
      btn.style.opacity = '0.7';

      // Gather form data
      const formData = new FormData(form);
      const data = {
        full_name: formData.get('fullName'),
        company: formData.get('company'),
        email: formData.get('email'),
        product_of_interest: formData.get('product'),
        message: formData.get('message'),
        // Extra fields for BESS
        market: formData.get('market') || null,
        project_size: formData.get('size') || null
      };

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Supabase Error:', errorData);
          throw new Error(`Supabase error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // Success
        form.style.display = 'none';
        formSuccess.classList.add('visible');

        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            form_id: form.id || 'contact',
            product_of_interest: data.product_of_interest || null
          });
        }
      } catch (error) {
        console.error('Submission Detail Error:', error);
        alert(`Error: ${error.message}\n\nCheck the browser console (F12) for more details.`);
        btn.textContent = originalBtnText;
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    });
  });


  /* ══════════════════════════════════════════════════════════
     TECH BOX HOVER GLOW
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.tech-box').forEach(box => {
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      box.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(212,160,23,0.08) 0%, rgba(14,30,56,0.7) 60%)`;
    });
    box.addEventListener('mouseleave', () => {
      box.style.background = '';
    });
  });


  /* ══════════════════════════════════════════════════════════
     SERVICE CARD MOUSE TILT
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = clamp((e.clientY - cy) / (rect.height / 2), -1, 1) * 4;
      const ry = clamp((e.clientX - cx) / (rect.width / 2), -1, 1) * -4;
      card.style.transform = `translateY(-6px) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });


  /* ══════════════════════════════════════════════════════════
     SMOOTH ACTIVE NAV LINK
  ══════════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  const navObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navAnchors.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--gold-400)' : '';
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => navObs.observe(s));

})();
