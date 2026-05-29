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
const phrasesByLang = {
  en: ['Software Developer', 'Frontend Engineer', 'AI Enthusiast'],
  it: ['Software Developer', 'Ingegnere Frontend', 'Esperto di AI'],
};
let phrases = [...phrasesByLang.en];
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

/* ============================================================
   I18N – MULTI-LANGUAGE (EN / IT)
   ============================================================ */
const i18n = {
  en: {
    'nav-about':      'About',
    'nav-skills':     'Skills',
    'nav-experience': 'Experience',
    'nav-education':  'Education',
    'nav-contact':    'Contact',

    'hero-greeting':    "Hello, I'm",
    'hero-title-static': "I'm a\u00a0",
    'hero-description': 'Dynamic Software Developer with 6+ years of experience crafting innovative web applications that enhance user engagement and functionality.',
    'hero-cta-explore': 'Explore My Work',
    'hero-cta-contact': 'Get In Touch',
    'hero-scroll':      'Scroll',

    'about-tag':           'Get to know me',
    'about-title':         'About <span class="gradient-text">Me</span>',
    'about-heading':       'Software Developer based in <span class="gradient-text">Pisa, Italy</span>',
    'about-bio-1':         'Dynamic Software Developer with 6 years of experience, proficient in crafting innovative web applications that enhance user engagement and functionality. Expertise spans across HTML, CSS, and Javascript, complemented by a strong foundation in React.js and Node.js.',
    'about-bio-2':         "Adept at collaborating with cross-functional teams to deliver high-quality software solutions that meet evolving business needs. Passionate about leveraging technology to drive efficiency and improve user experiences. Committed to continuous learning and adapting to emerging technologies.",
    'about-stat-years':     'Years Exp.',
    'about-stat-companies': 'Companies',
    'about-stat-tech':      'Technologies',
    'about-badge-text':     'Years of<br />Experience',

    'skills-tag':   'What I know',
    'skills-title': 'My <span class="gradient-text">Skills</span>',

    'exp-tag':      "Where I've worked",
    'exp-title':    'Work <span class="gradient-text">Experience</span>',
    'exp-current':  'Current',
    'exp-job1-desc': 'Building modern web applications with a focus on Vue.js, delivering scalable and maintainable front-end solutions. Working with Docker for containerised development environments and collaborating with the team to ship high-quality features.',
    'exp-job2-desc': 'Led development of enterprise-grade web applications, architecting scalable front-end solutions using React.js and Node.js. Collaborated with cross-functional teams to deliver high-quality software that meets evolving business requirements.',
    'exp-job3-desc': 'Built responsive web interfaces and full-stack applications, collaborating with product teams to translate design requirements into performant, accessible web experiences using modern web technologies.',
    'exp-job4-desc': 'Developed front-end components and interactive user interfaces for client projects. Focused on delivering pixel-perfect implementations and seamless user experiences across all devices and screen sizes.',

    'edu-tag':        'My background',
    'edu-title':      'Education',
    'edu-diploma':    'High School Diploma',
    'edu-grade-label':'Final Grade',
    'edu-lang-title':        'Languages',
    'edu-lang-subtitle':     'Spoken & Written',
    'edu-lang-it-name':      'Italian',
    'edu-lang-it-level':     'Native',
    'edu-lang-en-name':      'English',
    'edu-lang-en-level':     'Professional',
    'edu-lang-pl-name':      'Polish',
    'edu-lang-pl-level':     'Conversational',

    'contact-tag':           "Let's talk",
    'contact-title':         'Get In <span class="gradient-text">Touch</span>',
    'contact-subtitle':      "Have a project in mind? I'd love to hear about it. Send me a message and let's make it happen.",
    'contact-email-label':   'Email',
    'contact-phone-label':   'Phone',
    'contact-location-label':'Location',

    'footer-tagline':   'Crafting digital experiences with passion & precision.',
    'footer-copyright': '© <span id="footer-year"></span> Danilo Cappelletti &nbsp;·&nbsp; Built with <span class="heart">♥</span> and lots of JavaScript.',
  },
  it: {
    'nav-about':      'Chi sono',
    'nav-skills':     'Competenze',
    'nav-experience': 'Esperienza',
    'nav-education':  'Formazione',
    'nav-contact':    'Contatti',

    'hero-greeting':    'Ciao, sono',
    'hero-title-static': 'Sono un\u00a0',
    'hero-description': 'Sviluppatore Software con oltre 6 anni di esperienza nella creazione di applicazioni web innovative che migliorano il coinvolgimento degli utenti e le loro funzionalità.',
    'hero-cta-explore': 'Scopri il mio lavoro',
    'hero-cta-contact': 'Contattami',
    'hero-scroll':      'Scorri',

    'about-tag':           'Conoscimi',
    'about-title':         'Chi <span class="gradient-text">Sono</span>',
    'about-heading':       'Software Developer a <span class="gradient-text">Pisa, Italia</span>',
    'about-bio-1':         'Sviluppatore Software dinamico con 6 anni di esperienza, specializzato nella creazione di applicazioni web innovative che migliorano il coinvolgimento degli utenti. Le competenze spaziano da HTML, CSS e Javascript, con solide basi in React.js e Node.js.',
    'about-bio-2':         "Abile nel collaborare con team multifunzionali per consegnare soluzioni software di alta qualità che soddisfano le esigenze aziendali. Appassionato di tecnologia e miglioramento dell'esperienza utente. Impegnato nell'apprendimento continuo e nell'adattamento alle nuove tecnologie.",
    'about-stat-years':     'Anni Esp.',
    'about-stat-companies': 'Aziende',
    'about-stat-tech':      'Tecnologie',
    'about-badge-text':     'Anni di<br />Esperienza',

    'skills-tag':   'Cosa so fare',
    'skills-title': 'Le mie <span class="gradient-text">Competenze</span>',

    'exp-tag':      'Dove ho lavorato',
    'exp-title':    'Esperienza <span class="gradient-text">Lavorativa</span>',
    'exp-current':  'In corso',
    'exp-job1-desc': 'Sviluppo di applicazioni web moderne con focus su Vue.js, consegnando soluzioni front-end scalabili e manutenibili. Utilizzo di Docker per ambienti di sviluppo containerizzati e collaborazione con il team per rilasciare funzionalità di alta qualità.',
    'exp-job2-desc': 'Ho guidato lo sviluppo di applicazioni web enterprise, progettando soluzioni front-end scalabili con React.js e Node.js. Collaborazione con team interfunzionali per consegnare software di alta qualità in linea con i requisiti aziendali.',
    'exp-job3-desc': 'Ho realizzato interfacce web responsive e applicazioni full-stack, collaborando con i team di prodotto per trasformare i requisiti di design in esperienze web performanti e accessibili con tecnologie moderne.',
    'exp-job4-desc': 'Ho sviluppato componenti front-end e interfacce utente interattive per progetti clienti, con focus sulla consegna di implementazioni pixel-perfect e esperienze utente fluide su tutti i dispositivi e schermi.',

    'edu-tag':        'La mia formazione',
    'edu-title':      'Formazione',
    'edu-diploma':    'Diploma di Maturità',
    'edu-grade-label':'Voto Finale',
    'edu-lang-title':        'Lingue',
    'edu-lang-subtitle':     'Parlate e Scritte',
    'edu-lang-it-name':      'Italiano',
    'edu-lang-it-level':     'Madrelingua',
    'edu-lang-en-name':      'Inglese',
    'edu-lang-en-level':     'Professionale',
    'edu-lang-pl-name':      'Polacco',
    'edu-lang-pl-level':     'Conversazionale',

    'contact-tag':           'Parliamo',
    'contact-title':         '<span class="gradient-text">Contattami</span>',
    'contact-subtitle':      'Hai un progetto in mente? Sarei felice di sentirti. Mandami un messaggio e realizziamolo insieme.',
    'contact-email-label':   'Email',
    'contact-phone-label':   'Telefono',
    'contact-location-label':'Posizione',

    'footer-tagline':   'Creare esperienze digitali con passione e precisione.',
    'footer-copyright': '© <span id="footer-year"></span> Danilo Cappelletti &nbsp;·&nbsp; Realizzato con <span class="heart">♥</span> e tanto JavaScript.',
  },
};

let currentLang = localStorage.getItem('dc-lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('dc-lang', lang);
  document.documentElement.lang = lang;

  // textContent nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = i18n[lang][el.dataset.i18n];
    if (val !== undefined) el.textContent = val;
  });

  // innerHTML nodes (gradient spans, <br>, etc.)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = i18n[lang][el.dataset.i18nHtml];
    if (val !== undefined) el.innerHTML = val;
  });

  // Update typed phrases and restart animation
  phrases = [...phrasesByLang[lang]];
  pIdx = 0; cIdx = 0; deleting = false;
  if (typedEl) typedEl.textContent = '';

  // Update button label
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = lang === 'en' ? 'IT' : 'EN';

  // Auto year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.getElementById('lang-btn')?.addEventListener('click', () => {
  setLanguage(currentLang === 'en' ? 'it' : 'en');
});

// Apply saved/default language on load
setLanguage(currentLang);
