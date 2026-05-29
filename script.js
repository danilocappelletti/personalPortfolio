/* ============================================================
   PARTICLES CANVAS
   ============================================================ */
const canvas = document.getElementById('particles-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let raf;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x  = Math.random() * canvas.width;
    this.y  = initial ? Math.random() * canvas.height : (Math.random() < 0.5 ? 0 : canvas.height);
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;
    this.r  = Math.random() * 1.8 + 0.4;
    this.op = Math.random() * 0.45 + 0.08;
    this.color = Math.random() > 0.55 ? '124,58,237' : '6,182,212';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.width)  this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height)  this.vy *= -1;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.op})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(Math.floor(canvas.width / 13), 110);
  for (let i = 0; i < count; i++) particles.push(new Particle());
}

function drawLines() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.hypot(dx, dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(124,58,237,${0.14 * (1 - dist / 130)})`;
        ctx.lineWidth   = 0.7;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
  raf = requestAnimationFrame(animateParticles);
}

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursorEl  = document.getElementById('cursor');
const followerEl = document.getElementById('cursor-follower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursorEl.style.transform = `translate(${mx - 6}px, ${my - 6}px)`;
});

(function animateCursor() {
  fx += (mx - fx) * 0.11;
  fy += (my - fy) * 0.11;
  followerEl.style.transform = `translate(${fx - 19}px, ${fy - 19}px)`;
  requestAnimationFrame(animateCursor);
})();

document.querySelectorAll('a,button,.skill-card,.timeline-card,.education-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorEl.style.opacity  = '0';
    followerEl.style.opacity = '0';
  });
  el.addEventListener('mouseleave', () => {
    cursorEl.style.opacity  = '1';
    followerEl.style.opacity = '1';
  });
});

/* ============================================================
   TYPING EFFECT
   ============================================================ */
const typedEl = document.getElementById('typed-text');
const phrases = ['Software Developer', 'Frontend Engineer', 'AI Enthusiast', 'Nerd at Heart'];
let pIdx = 0, cIdx = 0, deleting = false;

function typeStep() {
  const phrase = phrases[pIdx];
  if (deleting) { cIdx--; } else { cIdx++; }
  typedEl.textContent = phrase.slice(0, cIdx);

  let delay = deleting ? 55 : 95;
  if (!deleting && cIdx === phrase.length) { delay = 2400; deleting = true; }
  else if (deleting && cIdx === 0)         { deleting = false; pIdx = (pIdx + 1) % phrases.length; delay = 380; }

  setTimeout(typeStep, delay);
}
setTimeout(typeStep, 1800); // start after hero animation

/* ============================================================
   NAVBAR – scroll behaviour & active link
   ============================================================ */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');
const navLinks  = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  highlightNav();
}, { passive: true });

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navMenu.classList.toggle('open');
});
navLinks.forEach(l => l.addEventListener('click', () => {
  hamburger.classList.remove('open');
  navMenu.classList.remove('open');
}));

function highlightNav() {
  const scrollY = window.scrollY + 120;
  document.querySelectorAll('section[id]').forEach(sec => {
    const link = document.querySelector(`.nav-link[href="#${sec.id}"]`);
    if (!link) return;
    const inView = scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight;
    link.classList.toggle('active', inView);
  });
}

/* ============================================================
   SCROLL-REVEAL (IntersectionObserver)
   ============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('aos-animate'); });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-aos]').forEach(el => revealObserver.observe(el));

/* ============================================================
   SKILL BAR ANIMATION
   ============================================================ */
const skillsSection = document.getElementById('skills');
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-fill').forEach(fill => {
        setTimeout(() => { fill.style.width = fill.dataset.width + '%'; }, 180);
      });
      skillObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.25 });

if (skillsSection) skillObserver.observe(skillsSection);

/* ============================================================
   COUNTER ANIMATION (about stats)
   ============================================================ */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-target]').forEach(counter => {
        animateCounter(counter, parseInt(counter.dataset.target, 10));
      });
      statsObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });

const aboutSection = document.getElementById('about');
if (aboutSection) statsObserver.observe(aboutSection);

/* ============================================================
   CONTACT FORM (UI-only, opens mailto as fallback)
   ============================================================ */
document.getElementById('contact-form')?.addEventListener('submit', function(e) {
  e.preventDefault();

  const btn = this.querySelector('button[type="submit"]');
  const orig = btn.innerHTML;

  // Validate
  const name    = this.name.value.trim();
  const email   = this.email.value.trim();
  const subject = this.subject.value.trim();
  const message = this.message.value.trim();

  if (!name || !email || !subject || !message) return;

  btn.innerHTML  = '<span>Sending…</span><i class="fas fa-spinner fa-spin"></i>';
  btn.disabled   = true;

  // Simulate send – open mailto so it actually works as a static site
  setTimeout(() => {
    const mailtoUrl =
      `mailto:danilobcappelletti@gmail.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoUrl;

    btn.innerHTML  = '<span>Message Sent!</span><i class="fas fa-check"></i>';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';

    setTimeout(() => {
      btn.innerHTML  = orig;
      btn.style.background = '';
      btn.disabled   = false;
      this.reset();
    }, 3000);
  }, 1200);
});

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('load', () => {
  resizeCanvas();
  initParticles();
  animateParticles();
});

window.addEventListener('resize', () => {
  resizeCanvas();
  initParticles();
}, { passive: true });
