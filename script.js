/* ============================================================
   PARTICLES CANVAS
   ============================================================ */
const canvas = document.getElementById('particles-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];
let raf;
let inkRgb    = '164,172,169';
let signalRgb = '255,180,84';

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
    this.signal = Math.random() > 0.8;
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
    ctx.fillStyle = `rgba(${this.signal ? signalRgb : inkRgb},${this.op})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(Math.floor(canvas.w / 13), window.innerWidth < 768 ? 40 : 110);
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
        ctx.strokeStyle = `rgba(${inkRgb},${0.12 * (1 - dist / 130)})`;
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
document.querySelectorAll('.menu-cv a').forEach(l => l.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  // The mobile menu covers the screen, so a tap on its empty background (target === navMenu) counts as outside
  const outside = e.target === navMenu || (!navMenu.contains(e.target) && !hamburger.contains(e.target));
  if (navMenu.classList.contains('open') && outside) setMenu(false);
});

function highlightNav() {
  const scrollY = window.scrollY + 120;
  const sections = document.querySelectorAll('section[id]');
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  sections.forEach((sec, i) => {
    const link = document.querySelector(`.nav-link[href="#${sec.id}"]`);
    if (!link) return;
    const inView = atBottom
      ? i === sections.length - 1
      : scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight;
    link.classList.toggle('active', inView);
  });
}

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
    'hero-description': 'Front-end and full-stack developer building React, Vue and Node.js applications, from enterprise workflows to tools for papyrus reconstruction.',
    'hero-cta-explore': 'View My Work',
    'hero-cta-contact': 'Get In Touch',
    'spec-base':        'Based in',
    'spec-exp':         'Experience',
    'spec-exp-val':     '6+ years, web & enterprise',
    'spec-stack':       'Core stack',
    'spec-langs':       'Languages',
    'hero-scroll':      'Scroll',

    'about-tag':           'A bit about me',
    'about-title':         'About <span class="gradient-text">Me</span>',
    'about-heading':       'Software Developer based in <span class="gradient-text">Pisa, Italy</span>',
    'about-bio-1':         'I\'m a software developer based in Pisa with over six years of experience. I\'ve built React applications at Apparound as a front-end developer in an agile team, Vue.js and Node.js applications at Stetel, and specialist tools in Python.',
    'about-bio-2':         'I\'ve worked with product and design teams on enterprise software, and I was the sole developer of the TIFF editor. I like turning a specific, difficult workflow into software people can actually use.',
    'about-stat-years':     'Years Exp.',
    'about-stat-companies': 'Companies',
    'about-stat-tech':      'Technologies',
    'about-badge-text':     'Years of<br />Experience',

    'skills-tag':   'What I work on',
    'skills-title': 'Skills in <span class="gradient-text">Practice</span>',
    'skills-ui-title': 'Frontend systems',
    'skills-ui-desc': 'Reusable components, responsive layouts and REST API integration for enterprise web applications.',
    'skills-ui-proof': 'Apparound & Stetel',
    'skills-fullstack-title': 'Full-stack workflows',
    'skills-fullstack-desc':     'Booking interfaces connected to data models, credits and payments, in a personal full-stack project.',
        'skills-fullstack-proof': 'See GymBuddy',
    'skills-tools-title': 'Specialist tools',
    'skills-tools-desc': 'Arranging very large images and measuring them precisely for papyrus reconstruction; charts and dashboards from test projects.',
    'skills-tools-proof': 'Read the TIFF case study',
    'stack-langs': 'Languages',
    'stack-frameworks': 'Frameworks & libraries',
    'stack-tools': 'Tools & platforms',
    'stack-ai': 'AI tools',
    'stack-ai-note': 'About two years of day-to-day agent-assisted development: GitHub Copilot in VS Code for Python, plus local models run with Ollama and llama.cpp, and Unsloth for model work.',

    'projects-tag':   'Selected work',
    'projects-title': 'Real problems.<br /><span class="gradient-text">Practical solutions.</span>',
    'projects-gymbuddy-subtitle': 'Personal Next.js Project',
    'projects-gymbuddy-desc': 'A personal demo built to try out Next.js and Prisma: a booking platform with a credit system, instructor management and detailed reporting. It was built for practice and has not been used by real users.',
    'projects-tiff-subtitle': 'Papyrus Reconstruction Tool',
    'projects-tiff-desc': 'A specialist tool for arranging very large scans and reconstructing damaged papyri.',
    'projects-sensor-subtitle': 'Test project: sensor dashboard',
    'projects-sensor-desc': 'Test project: a Vue 3 + TypeScript dashboard for practising IoT sensor monitoring, with sample data, charts and responsive tables.',
    'projects-award': 'EU Seal of Excellence',
    'tiff-kicker': '01 / Research tooling / Sole developer',
    'tiff-caption':     'Browser demo of the interface using placeholder images, not the production Python application.',
    'case-problem': 'The problem',
        'case-role': 'My role',
    'case-decision': 'Technical trade-off',
    'case-result': 'The result',
    'tiff-problem':     'The research team needed software that could handle very large image files and automatically arrange them for papyrus reconstruction.',
        'tiff-role': 'I was the only developer. I built the editor in Python, with tools for arranging and stitching images and measuring them precisely.',
        'tiff-decision': 'Navigating very large source files is slow. The design uses reduced-resolution previews for navigation and keeps the original data for export, so the interface stays responsive without losing detail in the output.',
        'tiff-result': 'The project received the EU Seal of Excellence in recognition of its quality, but was not funded because no funds were available.',
    'tiff-demo-link': 'Open interface demo',
    'tiff-letter-link': 'Read the President\'s letter (PDF)',
    'edu-course-meta': 'Udemy · 52.5 hours · January 2020',
    'edu-course-link': 'View certificate',
    'sensor-kicker': '02 / Test project',
    'sensor-caption': 'Test project · browser demo with sample data',
    'sensor-demo-link': 'Explore the demo',
    'gym-kicker': '03 / Personal demo',
    'gym-bookings': 'Activity & class bookings',
    'gym-payments': 'Credits & payment workflows',
    'gym-management': 'Instructor management & reporting',
    'gym-source': 'View the source code',

    'exp-tag':      "Where I've worked",
    'exp-title':    'Work <span class="gradient-text">Experience</span>',
    'exp-current':  'Current',
    'exp-job1-desc': 'Designed and built responsive web applications on a Vue.js and Node.js architecture, writing clean, modular JavaScript that scales over time. Managed Docker-based development environments to keep local and production workflows aligned, and integrated REST APIs while collaborating in an agile team. Main project: a router simulator for a major telecom operator.',
    'exp-job1-context': 'ICT company founded in 1991 in Livorno, delivering IT solutions and wireless technologies to businesses and public institutions.',
    'exp-job2-context': 'International software house founded in 2008, serving telecommunications, energy and industrial manufacturing with a sales platform for configuring and quoting offers.',
    'exp-job2-desc': 'Front-end developer in an agile team, building enterprise-grade web applications with React.js. Designed and integrated REST APIs for efficient client–server communication, coordinated technical work across cross-functional teams, and delivered secure, optimised code to strict enterprise standards.',
    'exp-job3-desc': 'Managed, customised and maintained WordPress-based websites and ecosystems. Optimised performance and load times with hand-written HTML, CSS and Vanilla JavaScript, built responsive UIs with React.js and Node.js, and partnered with product and design teams to turn requirements into accessible, high-performing web experiences.',
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
    'edu-apprentice-title':  'Professional Apprenticeship (Apprendistato professionalizzante)',
    'edu-apprentice-meta':   'Apparound SpA · Pisa, Italy  ·  September 2022 – September 2025',
    'edu-apprentice-desc':   'Three-year apprenticeship contract at Apparound SpA. A job-based qualification with no academic degree, held under the title of Software Developer.',

    'contact-tag':           "Let's talk",
    'contact-title':         'Get In <span class="gradient-text">Touch</span>',
    'contact-subtitle':      "Have a project or an idea? Send me a message and let's talk about it.",
    'contact-email-label':   'Email',
    'contact-phone-label':   'Phone',
    'contact-location-label':'Location',

    'footer-tagline':   'Software built with care.',
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
    'hero-description': 'Sviluppatore front-end e full-stack: realizzo applicazioni con React, Vue e Node.js, dai flussi aziendali agli strumenti per la ricostruzione dei papiri.',
    'hero-cta-explore': 'Vedi i progetti',
    'hero-cta-contact': 'Contattami',
    'spec-base':        'Sede',
    'spec-exp':         'Esperienza',
    'spec-exp-val':     '6+ anni, web ed enterprise',
    'spec-stack':       'Stack principale',
    'spec-langs':       'Lingue',
    'hero-scroll':      'Scorri',

    'about-tag':           'Un po\' di me',
    'about-title':         'Chi <span class="gradient-text">Sono</span>',
    'about-heading':       'Software Developer a <span class="gradient-text">Pisa, Italia</span>',
    'about-bio-1':             'Sono uno sviluppatore software di Pisa con oltre sei anni di esperienza. Ho sviluppato applicazioni React in Apparound come front-end developer in team agile, applicazioni Vue.js e Node.js in Stetel e strumenti specialistici in Python.',
        'about-bio-2':         'Ho lavorato con team di prodotto e design su software enterprise e ho sviluppato da solo l\'editor TIFF. Mi piace trasformare un flusso di lavoro specifico e complesso in un software che le persone usano davvero.',
    'about-stat-years':     'Anni Esp.',
    'about-stat-companies': 'Aziende',
    'about-stat-tech':      'Tecnologie',
    'about-badge-text':     'Anni di<br />Esperienza',

    'skills-tag':   'Di cosa mi occupo',
    'skills-title': 'Competenze <span class="gradient-text">in Pratica</span>',
    'skills-ui-title': 'Sistemi frontend',
    'skills-ui-desc': 'Componenti riutilizzabili, layout responsive e integrazione di API REST per applicazioni web enterprise.',
    'skills-ui-proof': 'Apparound & Stetel',
    'skills-fullstack-title': 'Flussi full-stack',
    'skills-fullstack-desc':     'Interfacce di prenotazione collegate a modelli dati, crediti e pagamenti, in un progetto personale full-stack.',
        'skills-fullstack-proof': 'Scopri GymBuddy',
    'skills-tools-title': 'Strumenti specialistici',
        'skills-tools-desc': 'Disposizione di immagini molto grandi e misure di precisione per ricostruire i papiri; grafici e dashboard da progetti di test.',
        'skills-tools-proof': 'Leggi il caso di studio TIFF',
        'stack-langs': 'Linguaggi',
        'stack-frameworks': 'Framework e librerie',
        'stack-tools': 'Strumenti e piattaforme',
        'stack-ai': 'Strumenti AI',
        'stack-ai-note': 'Circa due anni di sviluppo quotidiano assistito da agenti AI: GitHub Copilot in VS Code per Python, più modelli locali eseguiti con Ollama e llama.cpp, e Unsloth per il lavoro sui modelli.',

    'projects-tag':   'Progetti selezionati',
        'projects-title': 'Problemi concreti.<br /><span class="gradient-text">Soluzioni pratiche.</span>',
        'projects-gymbuddy-subtitle': 'Progetto personale Next.js',
        'projects-gymbuddy-desc': 'Demo personale per sperimentare Next.js e Prisma: una piattaforma di prenotazione con sistema a crediti, gestione degli istruttori e report dettagliati. È nata per esercizio e non è stata usata da utenti reali.',
        'projects-tiff-subtitle': 'Strumento per la ricostruzione dei papiri',
    'projects-tiff-desc': 'Uno strumento specialistico per disporre scansioni di grandi dimensioni e ricostruire papiri danneggiati.',
        'projects-sensor-subtitle': 'Progetto di test: dashboard sensori',
        'projects-sensor-desc': 'Progetto di test: una dashboard in Vue 3 e TypeScript per esercitarsi nel monitoraggio di sensori IoT, con dati di esempio, grafici e tabelle responsive.',
        'projects-award': 'Sigillo di Eccellenza UE',
    'tiff-kicker': '01 / Strumenti di ricerca / Unico sviluppatore',
    'tiff-caption':     'Demo nel browser con immagini di esempio, non l\'applicazione Python di produzione.',
    'case-problem': 'Il problema',
        'case-role': 'Il mio ruolo',
    'case-decision': 'Compromesso tecnico',
    'case-result': 'Il risultato',
        'tiff-problem': 'Il gruppo di ricerca aveva bisogno di un software in grado di gestire immagini molto grandi e di disporle automaticamente per ricostruire i papiri.',
        'tiff-role': 'Ero l\'unico sviluppatore: ho realizzato in Python l\'editor, con strumenti per disporre e unire le immagini e per misurarle con precisione.',
        'tiff-decision': 'Navigare file sorgente molto grandi è lento. Il progetto usa anteprime a risoluzione ridotta per la navigazione e conserva i dati originali per l\'esportazione: l\'interfaccia resta reattiva senza perdere dettaglio nel risultato finale.',
        'tiff-result': 'Il progetto ha ricevuto il Sigillo di Eccellenza dell\'UE, a riconoscimento della sua qualità, ma non è stato finanziato per mancanza di fondi.',
    'tiff-demo-link': 'Apri la demo dell\'interfaccia',
    'tiff-letter-link': 'Leggi la lettera del Presidente (PDF)',
    'edu-course-meta': 'Udemy · 52,5 ore · gennaio 2020',
    'edu-course-link': 'Vedi il certificato',
    'sensor-kicker': '02 / Progetto di test',
    'sensor-caption': 'Progetto di test · demo nel browser con dati di esempio',
    'sensor-demo-link': 'Esplora la demo',
    'gym-kicker': '03 / Demo personale',
    'gym-bookings': 'Prenotazioni di attività e corsi',
    'gym-payments': 'Crediti e flussi di pagamento',
    'gym-management': 'Gestione istruttori e reportistica',
    'gym-source': 'Vedi il codice sorgente',

    'exp-tag':      'Dove ho lavorato',
    'exp-title':    'Esperienza <span class="gradient-text">Lavorativa</span>',
    'exp-current':  'In corso',
    'exp-job1-desc':     'Progettazione e sviluppo di applicazioni web responsive basate su Vue.js e Node.js, con JavaScript pulito e modulare pensato per crescere nel tempo. Gestione degli ambienti di sviluppo con Docker per mantenere allineati sviluppo locale e produzione, integrazione di API REST e lavoro in un team agile. Progetto principale: un simulatore di router per un grande operatore di telecomunicazioni.',
        'exp-job1-context': 'Azienda ICT fondata nel 1991 a Livorno, con soluzioni IT e tecnologie wireless per imprese e pubbliche amministrazioni.',
        'exp-job2-context': 'Software house internazionale fondata nel 2008, attiva nelle telecomunicazioni, nell\'energia e nella produzione industriale, con una piattaforma di vendita per configurare e quotare le offerte.',
        'exp-job2-desc': 'Sviluppatore front-end in team agile, con sviluppo di applicazioni web di livello enterprise con React.js. Progettazione e integrazione di API REST per la comunicazione tra client e server, coordinamento tecnico tra team diversi e codice sicuro e ottimizzato, nel rispetto di standard aziendali rigorosi.',
        'exp-job3-desc': 'Gestione, personalizzazione e manutenzione di siti e ambienti WordPress. Ottimizzazione di prestazioni e tempi di caricamento con HTML, CSS e JavaScript scritti a mano, interfacce responsive con React.js e Node.js, collaborazione con i team di prodotto e design per trasformare i requisiti in esperienze web accessibili e veloci.',
        'exp-job4-desc': 'Sviluppo di componenti front-end interattivi e riutilizzabili con React.js e JavaScript. Realizzazione fedele dei design con HTML5/CSS3 avanzato, per esperienze fluide su mobile, tablet e desktop, lavorando in remoto per un cliente di Dubai.',

        'edu-tag':        'Il mio percorso',
    'edu-title':      'Formazione',
    'edu-diploma':    'Diploma Liceo Scientifico',
    'edu-grade-label':'Voto finale',
    'edu-focus-1':    'Matematica e Fisica — calcolo infinitesimale, algebra, geometria, metodo scientifico',
    'edu-focus-2':    'Logica e Problem Solving — ragionamento analitico rigoroso e modellizzazione dei dati',
    'edu-focus-3':    'Materie umanistiche e lingue — italiano, inglese, filosofia, pensiero critico',
    'edu-lang-title':        'Lingue',
    'edu-lang-subtitle':     'Parlato e scritto',
    'edu-lang-it-name':      'Italiano',
    'edu-lang-it-level':     'Madrelingua',
    'edu-lang-en-name':      'Inglese',
    'edu-lang-en-level':     'Professionale',
    'edu-lang-pl-name':      'Polacco',
    'edu-lang-pl-level':     'Livello conversazionale',
    'edu-apprentice-title':  'Apprendistato professionalizzante (Professional Apprenticeship)',
    'edu-apprentice-meta':   'Apparound SpA · Pisa, Italia  ·  settembre 2022 – settembre 2025',
    'edu-apprentice-desc':   'Contratto di apprendistato di tre anni presso Apparound SpA. Qualifica professionalizzante senza titolo di studio accademico, svolta con il ruolo di Software Developer.',

    'contact-tag':           'Parliamo',
    'contact-title':         '<span class="gradient-text">Contattami</span>',
    'contact-subtitle':          'Hai un progetto o un\'idea? Scrivimi e ne parliamo.',
    'contact-email-label':   'Email',
    'contact-phone-label':   'Telefono',
        'contact-location-label':'Località',

        'footer-tagline':   'Software realizzato con cura.',
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

  // Point the PDF downloads at the matching language version (navbar and mobile menu)
  document.querySelectorAll('.pdf-btn:not(.europass-btn)').forEach(btn => {
    btn.href = `portfolio_${lang}.pdf`;
    btn.download = `Danilo_Cappelletti_Portfolio_${lang}.pdf`;
  });
  document.querySelectorAll('.europass-btn').forEach(btn => {
    btn.href = `europass_${lang}.pdf`;
    btn.download = `Danilo_Cappelletti_Europass_CV_${lang}.pdf`;
  });

  // Auto year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.getElementById('lang-btn')?.addEventListener('click', () => {
  setLanguage(currentLang === 'en' ? 'it' : 'en');
});

// Apply saved/default language on load
setLanguage(currentLang);

/* ============================================================
   THEME
   ============================================================ */
const themeBtn  = document.getElementById('theme-btn');
const themeMeta = document.querySelector('meta[name="theme-color"]');
let currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

function setTheme(theme, persist = true) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  if (persist) localStorage.setItem('dc-theme', theme);

  const light = theme === 'light';
  inkRgb    = light ? '40,50,46'  : '164,172,169';
  signalRgb = light ? '168,90,0'  : '255,180,84';
  themeMeta?.setAttribute('content', light ? '#f5f6f2' : '#0c0e0f');

  // Icon and label name the theme the button will switch to
  if (themeBtn) {
    themeBtn.querySelector('i').className = light ? 'fas fa-moon' : 'fas fa-sun';
    themeBtn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  }
}

themeBtn?.addEventListener('click', () => {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

setTheme(currentTheme, false);

// Follow the OS scheme until the visitor picks one with the toggle
matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  if (!localStorage.getItem('dc-theme')) setTheme(e.matches ? 'light' : 'dark', false);
});


