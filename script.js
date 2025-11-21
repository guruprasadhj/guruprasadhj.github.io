// script.js - behavior: mobile drawer, lazy images, reveal, modal, keyboard accessibility

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Mobile drawer
const hamburger = $('#hamburger');
const drawer = $('#drawer');
const closeDrawerBtn = $('#close-drawer');

if (hamburger) {
  // Prevent taps/presses from falling through to underlying links
  hamburger.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); });
  hamburger.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!drawer) return;
    const open = drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', String(!open));
    // Reflect expanded state for accessibility
    hamburger.setAttribute('aria-expanded', String(!!open));
  });
}
if (closeDrawerBtn) {
  closeDrawerBtn.addEventListener('click', ()=> {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  });
}
$$('.drawer-link').forEach(l => l.addEventListener('click', ()=> {
  if (!drawer) return;
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true');
}));

// Header shadow on scroll
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = (window.scrollY > 6) ? '0 10px 30px rgba(2,6,23,0.6)' : 'none';
}, {passive:true});

// IntersectionObserver reveal
const revealEls = $$('.reveal');
let revealObserver;
if ('IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, {threshold: 0.12});
  revealEls.forEach(el => revealObserver.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

// Lazy-load images and ensure reveal observer triggers after load
const lazyImages = $$('.lazy');
if ('IntersectionObserver' in window) {
  const imgObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.onload = () => {
        img.classList.add('loaded');
        // if the parent card wasn't visible yet, ensure revealObserver will check it
        const parent = img.closest('.reveal');
        if (parent && revealObserver) revealObserver.observe(parent);
      };
      img.onerror = () => { img.style.opacity = 0.85; };
      obs.unobserve(img);
    });
  }, {rootMargin: '120px 0px'});
  lazyImages.forEach(i => imgObs.observe(i));
} else {
  lazyImages.forEach(img => { img.src = img.dataset.src; });
}

// Data objects for modal content (update URLs/description as needed)
const PROJECTS = {
  'aditya': {
    title: "AI Content generation — Main Website",
    img: 'assets/images/engage_ai.webp',
    desc: 'A UI-forward content generation platform. I worked on UX, performance and integration.',
    tech: 'React, Node.js, GCP',
    link: 'https://example.com'
  },
  'connect': {
    title: 'Connect Message',
    img: 'assets/images/connect_message.webp',
    desc: 'Messaging platform UX and backend integration.',
    tech: 'Realtime, Websockets',
    link: 'https://example.com'
  },
  'integration': {
    title: 'Lorem Ipsum',
    img: 'assets/images/integration_sample.webp',
    desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eleifend tristique tellus vel commodo.',
    tech: 'Node.js, GCP, SAML',
    link: 'https://example.com'
  },
  'writing': {
    title: 'Personal Website & Writing',
    img: 'assets/images/writing.webp',
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum eleifend tristique tellus vel commodo.",
    tech: 'Markdown, Notion',
    link: 'https://example.com'
  }
};

const ARTWORKS = {
  'art1': { title: 'Nightfall Study', img: 'assets/images/HeyRam_art.jpg', desc: 'Digital painting study exploring light and silhouette.' },
  'art2': { title: 'Monsoon Alley', img: 'assets/images/art_monsoon.webp', desc: 'Inspired by Chennai backstreets. Focus on reflections.' },
  'art3': { title: 'Detective Portrait', img: 'assets/images/art_detective.webp', desc: 'Character portrait concept for Aditya.' }
};

const BOOK = {
  title: "Aditya: Detective's Nightmare",
  cover: 'assets/images/book_cover.webp',
  desc: "A detective novel blending noir and Tamil cultural elements. Follow Aditya across Chettinad estates and Chennai backstreets.",
  buy: 'https://example.com'
};

// Modal logic
const modal = $('#modal');
const modalImg = $('#modal-img');
const modalTitle = $('#modal-title');
const modalDesc = $('#modal-desc');
const modalTech = $('#modal-tech');
const modalLink = $('#modal-link');
const modalClose = $('#modal-close');

function openModalFor(data) {
  modalImg.src = data.img || data.cover || '';
  modalTitle.textContent = data.title || '';
  modalDesc.textContent = data.desc || '';
  modalTech.textContent = data.tech || '';
  modalLink.href = data.link || data.buy || '#';
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';
  modalClose && modalClose.focus();
}
function closeModal() {
  modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow = '';
}

// Attach handlers: projects
$$('.project').forEach(card => {
  card.addEventListener('click', () => {
    const key = card.dataset.project;
    openModalFor(PROJECTS[key] || {});
  });
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') {
    const key = card.dataset.project;
    openModalFor(PROJECTS[key] || {});
  }});
});

// Attach handlers: artworks
$$('.artwork').forEach(a => {
  a.addEventListener('click', () => {
    const key = a.dataset.art;
    openModalFor(ARTWORKS[key] || {});
  });
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') {
    const key = a.dataset.art;
    openModalFor(ARTWORKS[key] || {});
  }});
});

// Book cover opens modal
const bookCover = document.querySelector('#book .book-cover img');
if (bookCover) {
  bookCover.addEventListener('click', () => openModalFor({ title: BOOK.title, img: BOOK.cover, desc: BOOK.desc, link: BOOK.buy }));
  bookCover.style.cursor = 'pointer';
}

// Modal close handlers
modalClose && modalClose.addEventListener('click', closeModal);
modal && modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Auto year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Under-construction notice dismiss
const dismissNoticeBtn = $('#dismiss-notice');
const underConstruction = $('#under-construction');
if (dismissNoticeBtn && underConstruction) {
  const hideNotice = (e) => {
    e && e.preventDefault && e.preventDefault();
    e && e.stopPropagation && e.stopPropagation();
    underConstruction.style.display = 'none';
    underConstruction.setAttribute('aria-hidden', 'true');
    try { localStorage.setItem('noticeDismissed', '1'); } catch (err) {}
  };
  // handle pointerdown for faster mobile response and click as a fallback
  dismissNoticeBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hideNotice(); });
  dismissNoticeBtn.addEventListener('click', hideNotice);
  // if previously dismissed, hide on load
  try { if (localStorage.getItem('noticeDismissed')) underConstruction.style.display = 'none'; } catch (err) {}
}

// Close drawer when clicking outside
document.addEventListener('click', (e) => {
  const dr = $('#drawer');
  if (!dr) return;
  if (!dr.classList.contains('open')) return;
  if (e.target.closest && e.target.closest('.panel')) return;
  if (e.target.closest && e.target.closest('#hamburger')) return;
  dr.classList.remove('open'); dr.setAttribute('aria-hidden','true');
});
