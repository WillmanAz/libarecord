/* ==========================================================================
   UKM RISET — Open Recruitment Portal — script.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------------
     1. LOADING SCREEN
  --------------------------------------------------------------------- */
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');
  const loaderPct = document.getElementById('loaderPct');

  let progress = 0;
  const loaderInterval = setInterval(() => {
    progress += Math.random() * 18;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loaderInterval);
      setTimeout(() => {
        loader.classList.add('hidden');
        document.body.style.overflow = '';
        initAfterLoad();
      }, 350);
    }
    loaderFill.style.width = progress + '%';
    loaderPct.textContent = String(Math.floor(progress)).padStart(2, '0') + '%';
  }, 180);

  document.body.style.overflow = 'hidden';

  /* ---------------------------------------------------------------------
     2. AMBIENT PARTICLES (background layer)
  --------------------------------------------------------------------- */
  const pCanvas = document.getElementById('particles');
  const pCtx = pCanvas.getContext('2d');
  let particles = [];

  function resizeParticles(){
    pCanvas.width = window.innerWidth;
    pCanvas.height = document.documentElement.scrollHeight;
  }

  function createParticles(){
    const count = Math.min(70, Math.floor(window.innerWidth / 22));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * pCanvas.width,
      y: Math.random() * pCanvas.height,
      r: Math.random() * 1.4 + 0.4,
      vy: -(Math.random() * 0.25 + 0.05),
      alpha: Math.random() * 0.5 + 0.15
    }));
  }

  function drawParticles(){
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    const scrollY = window.scrollY;
    particles.forEach(p => {
      p.y += p.vy;
      if (p.y < scrollY - 20) p.y = scrollY + window.innerHeight + 20;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(120,170,255,${p.alpha})`;
      pCtx.fill();
    });
    requestAnimationFrame(drawParticles);
  }

  resizeParticles();
  createParticles();
  drawParticles();
  window.addEventListener('resize', () => { resizeParticles(); createParticles(); });

  /* ---------------------------------------------------------------------
     3. HERO NETWORK CANVAS (signature element)
  --------------------------------------------------------------------- */
  const netCanvas = document.getElementById('network');
  const netCtx = netCanvas.getContext('2d');
  let nodes = [];
  let heroEl = document.querySelector('.hero');

  function resizeNetwork(){
    netCanvas.width = heroEl.offsetWidth;
    netCanvas.height = heroEl.offsetHeight;
  }

  function createNodes(){
    const count = Math.min(46, Math.floor(netCanvas.width / 34));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * netCanvas.width,
      y: Math.random() * netCanvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 1
    }));
  }

  function drawNetwork(){
    netCtx.clearRect(0, 0, netCanvas.width, netCanvas.height);
    const maxDist = 150;

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > netCanvas.width) n.vx *= -1;
      if (n.y < 0 || n.y > netCanvas.height) n.vy *= -1;
    });

    for (let i = 0; i < nodes.length; i++){
      for (let j = i + 1; j < nodes.length; j++){
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist){
          netCtx.beginPath();
          netCtx.moveTo(a.x, a.y);
          netCtx.lineTo(b.x, b.y);
          netCtx.strokeStyle = `rgba(99,150,255,${(1 - dist / maxDist) * 0.35})`;
          netCtx.lineWidth = 0.6;
          netCtx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      netCtx.beginPath();
      netCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      netCtx.fillStyle = 'rgba(160,200,255,0.75)';
      netCtx.fill();
    });

    requestAnimationFrame(drawNetwork);
  }

  resizeNetwork();
  createNodes();
  drawNetwork();
  window.addEventListener('resize', () => { resizeNetwork(); createNodes(); });

  /* ---------------------------------------------------------------------
     4. CURSOR GLOW
  --------------------------------------------------------------------- */
  const cursorGlow = document.getElementById('cursorGlow');
  window.addEventListener('mousemove', (e) => {
    cursorGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%,-50%)`;
  });

  /* ---------------------------------------------------------------------
     5. NAVBAR SCROLL STATE + MOBILE MENU
  --------------------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function onScrollNav(){
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav);

  hamburger.addEventListener('click', () => {
    const active = hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open', active);
    hamburger.setAttribute('aria-expanded', String(active));
  });

  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* active nav-link highlighting */
  const navLinkEls = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('main section, .hero');

  function highlightNav(){
    let current = 'home';
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom > 140) current = sec.id;
    });
    navLinkEls.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', highlightNav);

  /* ---------------------------------------------------------------------
     6. TOP PROGRESS BAR + RIGHT RAIL
  --------------------------------------------------------------------- */
  const topProgress = document.getElementById('topProgress');
  const railFill = document.getElementById('railFill');

  function onScrollProgress(){
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    topProgress.style.width = pct + '%';
    railFill.style.height = pct + '%';
  }
  onScrollProgress();
  window.addEventListener('scroll', onScrollProgress);

  /* ---------------------------------------------------------------------
     7. BACK TO TOP
  --------------------------------------------------------------------- */
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------------------------------------------------------------------
     8. SCROLL REVEAL (IntersectionObserver)
  --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* safety net: force-reveal anything still hidden after 2.5s, in case a
     browser quirk or a later error prevents the observer from firing */
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.in-view)').forEach(el => el.classList.add('in-view'));
  }, 2500);

  /* timeline items also get in-view class for node glow */
  document.querySelectorAll('.tl-item').forEach(el => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  /* timeline progress fill */
  const timelineEl = document.querySelector('.timeline');
  const timelineFill = document.getElementById('timelineFill');
  if (timelineEl && timelineFill){
    window.addEventListener('scroll', () => {
      const rect = timelineEl.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.6;
      const total = rect.height;
      const covered = Math.min(Math.max(viewportCenter - rect.top, 0), total);
      timelineFill.style.height = (covered / total) * 100 + '%';
    });
  }

  /* ---------------------------------------------------------------------
     9. ANIMATED COUNTERS
  --------------------------------------------------------------------- */
  const counters = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();

      function tick(now){
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => counterObserver.observe(c));

  /* ---------------------------------------------------------------------
     10. COUNTDOWN TIMER
  --------------------------------------------------------------------- */
  const targetDate = new Date('2026-07-21T23:59:59+07:00').getTime();
  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMins = document.getElementById('cdMins');
  const cdSecs = document.getElementById('cdSecs');

  function pad(n){ return String(n).padStart(2, '0'); }

  function updateCountdown(){
    const diff = targetDate - Date.now();
    if (diff <= 0){
      [cdDays, cdHours, cdMins, cdSecs].forEach(el => el.textContent = '00');
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    cdDays.textContent = pad(d);
    cdHours.textContent = pad(h);
    cdMins.textContent = pad(m);
    cdSecs.textContent = pad(s);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------------------------------------------------------------------
     11. FAQ ACCORDION
  --------------------------------------------------------------------- */
  document.querySelectorAll('.acc-item').forEach(item => {
    const trigger = item.querySelector('.acc-trigger');
    const panel = item.querySelector('.acc-panel');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.acc-item.open').forEach(openItem => {
        if (openItem !== item){
          openItem.classList.remove('open');
          openItem.querySelector('.acc-trigger').setAttribute('aria-expanded', 'false');
          openItem.querySelector('.acc-panel').style.maxHeight = null;
        }
      });

      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = !isOpen ? panel.scrollHeight + 'px' : null;
    });
  });

  /* ---------------------------------------------------------------------
     12. RIPPLE EFFECT ON BUTTONS
  --------------------------------------------------------------------- */
  document.querySelectorAll('.ripple').forEach(btn => {
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e){
      const rect = this.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      circle.className = 'ripple-circle';
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(circle);
      setTimeout(() => circle.remove(), 650);
    });
  });

  /* ---------------------------------------------------------------------
     13. CARD TILT EFFECT
  --------------------------------------------------------------------- */
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
    });
  });

  /* ---------------------------------------------------------------------
     14. GSAP SECTION REVEAL (progressive enhancement)
  --------------------------------------------------------------------- */
  function initAfterLoad(){
    if (window.gsap && window.ScrollTrigger){
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray('.section-head').forEach(head => {
        gsap.from(head, {
          y: 30, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: head, start: 'top 85%' }
        });
      });
    }
  }

  /* smooth anchor scroll fallback for older browsers */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e){
      const id = this.getAttribute('href');
      if (id.length > 1){
        const target = document.querySelector(id);
        if (target){
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

});