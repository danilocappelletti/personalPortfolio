/* ============================================================
   PARTICLES CANVAS
   ============================================================ */
const canvas = document.getElementById('particles-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let raf;

function resizeCanvas() {
  const { width, height } = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.round(width  * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  canvas.w = width; canvas.h = height;
}

class Particle {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x  = Math.random() * canvas.w;
    this.y  = initial ? Math.random() * canvas.h : (Math.random() < 0.5 ? 0 : canvas.h);
    this.vx = (Math.random() - 0.5) * 0.55;
    this.vy = (Math.random() - 0.5) * 0.55;
    this.r  = Math.random() * 1.8 + 0.4;
    this.op = Math.random() * 0.45 + 0.08;
    this.color = Math.random() > 0.55 ? '124,58,237' : '6,182,212';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > canvas.w)  this.vx *= -1;
    if (this.y < 0 || this.y > canvas.h)  this.vy *= -1;
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
  const count = Math.min(Math.floor(canvas.w / 13), 110);
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
  ctx.clearRect(0, 0, canvas.w, canvas.h);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
  raf = requestAnimationFrame(animateParticles);
}

function startParticles() {
  resizeCanvas();
  initParticles();
  cancelAnimationFrame(raf);
  animateParticles();
}

startParticles();
let resizeTimer, lastW = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastW) return;
  lastW = window.innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(startParticles, 150);
}, { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else animateParticles();
});

/* ============================================================
   CUSTOM CURSOR
   ============================================================ */
const cursorEl = document.getElementById('cursor');
const followerEl = document.getElementById('cursor-follower');
const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');

function hideCursor() {
  document.documentElement.classList.remove('custom-cursor');
}

document.addEventListener('pointermove', event => {
  if (!finePointer.matches || event.pointerType === 'touch' || event.target.closest('a, button, input, textarea, select')) {
    hideCursor();
    return;
  }
  cursorEl.style.transform = `translate(${event.clientX - 6}px, ${event.clientY - 6}px)`;
  followerEl.style.transform = `translate(${event.clientX - 19}px, ${event.clientY - 19}px)`;
  document.documentElement.classList.add('custom-cursor');
}, { passive:true });

document.documentElement.addEventListener('pointerleave', hideCursor);
window.addEventListener('blur', hideCursor);
finePointer.addEventListener('change', hideCursor);

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

function setMenu(open) {
  hamburger.classList.toggle('open', open);
  navMenu.classList.toggle('open', open);
  document.documentElement.classList.toggle('nav-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
}

hamburger.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
navLinks.forEach(l => l.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburger.contains(e.target)) setMenu(false);
});

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
   I18N – MULTI-LANGUAGE (EN / IT)
   ============================================================ */
const i18n = {
  en: {
    'nav-about':      'About',
    'nav-skills':     'Skills',
    'nav-projects':   'Projects',
    'nav-experience': 'Experience',
    'nav-education':  'Education',
    'nav-contact':    'Contact',

    'skip-content': 'Skip to content',
    'hero-greeting':    'Software Developer / Pisa, Italy',
    'hero-context': '6+ years / Enterprise web & research tools',
    'hero-description': 'I build React and Vue applications, from enterprise workflows to tools for papyrus reconstruction.',
    'hero-cta-explore': 'View Selected Work',
    'hero-cta-contact': 'Get In Touch',
    'hero-scroll':      'Scroll',

    'about-tag':           'Get to know me',
    'about-title':         'About <span class="gradient-text">Me</span>',
    'about-heading':       'Software Developer based in <span class="gradient-text">Pisa, Italy</span>',
    'about-bio-1':         'I am a software developer based in Pisa with over six years of experience. My work spans React and Node.js applications at Apparound, Vue.js development at Stetel, and specialist Python tools.',
    'about-bio-2':         'I have worked with product and design teams on enterprise software and taken sole ownership of the TIFF editor. I enjoy turning a specific, difficult workflow into software people can use.',
    'about-stat-years':     'Years Exp.',
    'about-stat-companies': 'Companies',
    'about-stat-tech':      'Technologies',
    'about-badge-text':     'Years of<br />Experience',

    'skills-tag':   'Skills, applied',
    'skills-title': 'Engineering in <span class="gradient-text">Practice</span>',
    'skills-ui-title': 'Frontend systems',
    'skills-ui-desc': 'Reusable components, responsive layouts and REST API integration for enterprise web applications.',
    'skills-ui-proof': 'Apparound & Stetel',
    'skills-fullstack-title': 'Full-stack workflows',
    'skills-fullstack-desc': 'Connecting booking interfaces to data models, credit systems and payments in a personal full-stack project.',
    'skills-fullstack-proof': 'Explore GymBuddy',
    'skills-tools-title': 'Specialist tools',
    'skills-tools-desc': 'Large-image arrangement and precision measurement for papyrus reconstruction; charts and sensor data interfaces for IoT monitoring.',
    'skills-tools-proof': 'Read the TIFF case study',

    'projects-tag':   'Selected work',
    'projects-title': 'Different problems.<br /><span class="gradient-text">Considered solutions.</span>',
    'projects-gymbuddy-subtitle': 'Personal Next.js Test',
    'projects-gymbuddy-desc': 'Personal project testing Next.js + Prisma workflows. Booking platform with credit systems, instructor management, and advanced reporting for activities and classes.',
    'projects-tiff-subtitle': 'Papyri Reconstruction Tool',
    'projects-tiff-desc': 'A specialist tool for arranging very large scans and reconstructing damaged papyri.',
    'projects-sensor-subtitle': 'Real-Time Data Dashboard',
    'projects-sensor-desc': 'Vue 3 + TypeScript dashboard for monitoring IoT sensor data with live charts, historical analytics, and responsive data tables.',
    'projects-award': 'Project: Seal of Excellence',
    'tiff-kicker': '01 / Research tooling / Sole developer',
    'tiff-caption': 'Browser interface demo with placeholder images, not the production Python application.',
    'case-problem': 'The problem',
    'case-role': 'My contribution',
    'case-decision': 'Technical trade-off',
    'case-result': 'The result',
    'tiff-problem': 'The research workflow needed suitable software to work with very large image files and automatically arrange them for papyrus reconstruction.',
    'tiff-role': 'I was the sole developer, building the editor and its image arrangement, stitching and precision measurement tools in Python.',
    'tiff-decision': 'Large source files make interactive navigation costly. The documented design uses reduced-resolution image previews for navigation, while keeping original-resolution data for export: responsiveness without sacrificing output detail.',
    'tiff-result': 'The project received the EU Seal of Excellence, recognising its quality. It did not receive funding because funds were unavailable.',
    'tiff-demo-link': 'Open interface demo',
    'sensor-kicker': '02 / Data interfaces',
    'sensor-caption': 'Browser demo / simulated sensor data',
    'sensor-demo-link': 'Explore the demo',
    'gym-kicker': '03 / Personal full-stack project',
    'gym-bookings': 'Activity & class bookings',
    'gym-payments': 'Credits & payment workflows',
    'gym-management': 'Instructor management & reporting',
    'gym-source': 'Explore the source',

    'exp-tag':      "Where I've worked",
    'exp-title':    'Work <span class="gradient-text">Experience</span>',
    'exp-current':  'Current',
    'exp-job1-desc': 'Designed and built responsive web applications on a Vue.js architecture, writing clean, modular JavaScript for long-term scalability. Managed Docker-based development environments to keep local and production workflows aligned, and integrated REST APIs while collaborating in an agile team.',
    'exp-job2-desc': 'Developed and architected enterprise-grade full-stack applications with React.js on the front end and Node.js on the server. Designed and integrated REST APIs for efficient client–server communication, coordinated technical work across cross-functional teams, and delivered secure, optimised code to strict enterprise standards.',
    'exp-job3-desc': 'Managed, customised and maintained WordPress-based websites and ecosystems. Optimised performance and load times with hand-written HTML, CSS and Vanilla JavaScript, built responsive UIs with React.js, and partnered with product and design teams to turn requirements into accessible, high-performing web experiences.',
    'exp-job4-desc': 'Built interactive, reusable front-end components with React.js and core JavaScript. Implemented pixel-perfect designs with advanced HTML5/CSS3 and ensured smooth, responsive experiences across mobile, tablet and desktop — working fully remote for a Dubai-based client.',

    'edu-tag':        'My background',
    'edu-title':      'Education',
    'edu-diploma':    'Scientific High School Diploma',
    'edu-grade-label':'Final Grade',
    'edu-focus-1':    'Mathematics & Physics — calculus, algebra, geometry, scientific method',
    'edu-focus-2':    'Logic & Problem Solving — rigorous analytical reasoning and data modelling',
    'edu-focus-3':    'Humanities & Languages — Italian, English, philosophy, critical thinking',
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
    'nav-projects':   'Progetti',
    'nav-experience': 'Esperienza',
    'nav-education':  'Formazione',
    'nav-contact':    'Contatti',

    'skip-content': 'Vai al contenuto',
    'hero-greeting':    'Software Developer / Pisa, Italia',
    'hero-context': '6+ anni / Applicazioni enterprise e strumenti di ricerca',
    'hero-description': 'Sviluppo applicazioni React e Vue, dai flussi aziendali agli strumenti per la ricostruzione dei papiri.',
    'hero-cta-explore': 'Esplora i progetti',
    'hero-cta-contact': 'Contattami',
    'hero-scroll':      'Scorri',

    'about-tag':           'Conoscimi',
    'about-title':         'Chi <span class="gradient-text">Sono</span>',
    'about-heading':       'Software Developer a <span class="gradient-text">Pisa, Italia</span>',
    'about-bio-1':         'Sono uno sviluppatore software a Pisa con oltre sei anni di esperienza. Ho lavorato su applicazioni React e Node.js in Apparound, sviluppo Vue.js in Stetel e strumenti specialistici in Python.',
    'about-bio-2':         'Ho collaborato con team di prodotto e design su software enterprise e sviluppato da solo l\'editor TIFF. Mi piace trasformare un flusso di lavoro specifico e complesso in software utilizzabile.',
    'about-stat-years':     'Anni Esp.',
    'about-stat-companies': 'Aziende',
    'about-stat-tech':      'Tecnologie',
    'about-badge-text':     'Anni di<br />Esperienza',

    'skills-tag':   'Competenze applicate',
    'skills-title': 'Ingegneria in <span class="gradient-text">Pratica</span>',
    'skills-ui-title': 'Sistemi frontend',
    'skills-ui-desc': 'Componenti riutilizzabili, layout responsive e integrazione di API REST per applicazioni web enterprise.',
    'skills-ui-proof': 'Apparound & Stetel',
    'skills-fullstack-title': 'Flussi full-stack',
    'skills-fullstack-desc': 'Interfacce di prenotazione collegate a modelli dati, sistemi di crediti e pagamenti in un progetto personale full-stack.',
    'skills-fullstack-proof': 'Esplora GymBuddy',
    'skills-tools-title': 'Strumenti specialistici',
    'skills-tools-desc': 'Disposizione di immagini di grandi dimensioni e misurazioni precise per ricostruire papiri; grafici e interfacce dati per il monitoraggio di sensori IoT.',
    'skills-tools-proof': 'Leggi il caso TIFF',

    'projects-tag':   'Progetti selezionati',
    'projects-title': 'Problemi diversi.<br /><span class="gradient-text">Soluzioni ragionate.</span>',
    'projects-gymbuddy-subtitle': 'Test Personale Next.js',
    'projects-gymbuddy-desc': 'Progetto personale per testare flussi di lavoro Next.js + Prisma. Piattaforma di prenotazione con sistemi di credito, gestione istruttori e reportistica avanzata per attività e corsi.',
    'projects-tiff-subtitle': 'Strumento di Ricostruzione Papiri',
    'projects-tiff-desc': 'Uno strumento specialistico per disporre scansioni di grandi dimensioni e ricostruire papiri danneggiati.',
    'projects-sensor-subtitle': 'Dashboard Dati in Tempo Reale',
    'projects-sensor-desc': 'Dashboard Vue 3 + TypeScript per il monitoraggio dei dati dei sensori IoT con grafici live, analitiche storiche e tabelle dati responsive.',
    'projects-award': 'Progetto: Sigillo di Eccellenza',
    'tiff-kicker': '01 / Strumenti di ricerca / Unico sviluppatore',
    'tiff-caption': 'Demo web con immagini segnaposto, non l\'applicazione Python di produzione.',
    'case-problem': 'Il problema',
    'case-role': 'Il mio contributo',
    'case-decision': 'Compromesso tecnico',
    'case-result': 'Il risultato',
    'tiff-problem': 'Il lavoro di ricerca richiedeva un software adatto a gestire file immagine di grandi dimensioni e disporli automaticamente per la ricostruzione dei papiri.',
    'tiff-role': 'Sono stato l\'unico sviluppatore: ho realizzato in Python l\'editor e gli strumenti di disposizione, unione delle immagini e misurazione di precisione.',
    'tiff-decision': 'Navigare file originali molto grandi ha un costo elevato. Il progetto documentato usa anteprime a risoluzione ridotta per la navigazione e conserva i dati originali per l\'esportazione: reattivit\u00e0 senza perdere dettaglio nel risultato.',
    'tiff-result': 'Il progetto ha ricevuto il Sigillo di Eccellenza dell\'UE, che ne riconosce la qualit\u00e0. Non ha ottenuto il finanziamento per mancanza di fondi.',
    'tiff-demo-link': 'Apri la demo dell\'interfaccia',
    'sensor-kicker': '02 / Interfacce dati',
    'sensor-caption': 'Demo web / dati dei sensori simulati',
    'sensor-demo-link': 'Esplora la demo',
    'gym-kicker': '03 / Progetto personale full-stack',
    'gym-bookings': 'Prenotazioni di attivit\u00e0 e corsi',
    'gym-payments': 'Crediti e flussi di pagamento',
    'gym-management': 'Gestione istruttori e reportistica',
    'gym-source': 'Esplora il codice',

    'exp-tag':      'Dove ho lavorato',
    'exp-title':    'Esperienza <span class="gradient-text">Lavorativa</span>',
    'exp-current':  'In corso',
    'exp-job1-desc': 'Progettazione e implementazione di applicazioni web reattive con architettura Vue.js, scrivendo codice JavaScript pulito e modulare per una scalabilità a lungo termine. Gestione di ambienti di sviluppo containerizzati con Docker per allineare i flussi locali e di produzione, integrazione di REST APIs e collaborazione proattiva in team con metodologie agili.',
    'exp-job2-desc': 'Sviluppo e architettura di applicazioni web full-stack di livello enterprise con React.js per il front-end e Node.js per la logica server. Progettazione e integrazione di REST APIs per una comunicazione client–server efficiente, coordinamento tecnico in team interfunzionali e consegna di codice sicuro e ottimizzato secondo rigorosi standard aziendali.',
    'exp-job3-desc': 'Amministrazione, personalizzazione e manutenzione di siti ed ecosistemi basati su WordPress. Ottimizzazione di performance e tempi di caricamento con HTML, CSS e JavaScript puro (Vanilla JS), realizzazione di interfacce responsive con React.js e collaborazione con i team di prodotto e design per trasformare i requisiti in esperienze web accessibili e ad alto rendimento.',
    'exp-job4-desc': 'Creazione di componenti front-end interattivi e riutilizzabili con React.js e JavaScript core. Implementazione pixel-perfect dei requisiti di design con HTML5/CSS3 avanzato e garanzia di esperienze fluide e responsive su mobile, tablet e desktop — operando in modalità totalmente remota per un cliente di Dubai.',

    'edu-tag':        'La mia formazione',
    'edu-title':      'Formazione',
    'edu-diploma':    'Diploma Liceo Scientifico',
    'edu-grade-label':'Voto Finale',
    'edu-focus-1':    'Matematica e Fisica — calcolo infinitesimale, algebra, geometria, metodo scientifico',
    'edu-focus-2':    'Logica e Problem Solving — ragionamento analitico rigoroso e modellizzazione dei dati',
    'edu-focus-3':    'Cultura Umanistica e Lingue — italiano, inglese, filosofia, pensiero critico',
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


