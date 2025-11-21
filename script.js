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
let imgObs = null;
function observeLazy(img) {
  if (!img) return;
  if ('IntersectionObserver' in window && imgObs) {
    imgObs.observe(img);
  } else {
    // Fallback: load immediately
    img.src = img.dataset.src;
  }
}

if ('IntersectionObserver' in window) {
  imgObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      img.onload = () => {
        img.classList.add('loaded');
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
// Centralized site data (fetched from `data.json` at runtime)
let DATA = {};

async function fetchSiteData() {
  try {
    const res = await fetch('data.json', {cache: 'no-store'});
    if (!res.ok) throw new Error('Failed to load data.json');
    DATA = await res.json();
  } catch (err) {
    console.warn('Could not load data.json, falling back to empty DATA', err);
    DATA = {};
  }
}

function renderProjects() {
  const container = document.getElementById('projects-grid');
  if (!container) return;
  container.innerHTML = '';
  const projects = DATA.PROJECTS || {};
  Object.keys(projects).forEach(key => {
    const p = projects[key];
    const art = document.createElement('article');
    art.className = 'project reveal';
    art.setAttribute('data-project', key);
    art.setAttribute('tabindex', '0');
    art.setAttribute('role', 'button');
    art.setAttribute('aria-pressed', 'false');

    art.innerHTML = `
      <div class="project-media">
        <img class="lazy" data-src="${p.img}" alt="${escapeHtml(p.title)}" />
      </div>
      <div class="pcontent">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="muted">${escapeHtml(p.desc)}</p>
        <div class="tags"><span class="tag">${escapeHtml((p.tech||'').split(',')[0]||'')}</span></div>
      </div>`;

    art.addEventListener('click', () => openModalFor(p));
    art.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openModalFor(p); });
    container.appendChild(art);
    const img = art.querySelector('img.lazy');
    if (img) observeLazy(img);
    if (revealObserver) revealObserver.observe(art);
  });
}

function renderArtworks() {
  const container = document.getElementById('art-grid');
  if (!container) return;
  container.innerHTML = '';
  const arts = DATA.ARTWORKS || {};
  Object.keys(arts).forEach(key => {
    const a = arts[key];
    const el = document.createElement('article');
    el.className = 'artwork reveal';
    el.setAttribute('data-art', key);
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.innerHTML = `
      <img class="lazy" data-src="${a.img}" alt="${escapeHtml(a.title)}" />
      <div class="pcontent"><h3>${escapeHtml(a.title)}</h3><p class="muted">${escapeHtml(a.desc)}</p></div>`;
    el.addEventListener('click', () => openModalFor(a));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openModalFor(a); });
    container.appendChild(el);
    const img = el.querySelector('img.lazy');
    if (img) observeLazy(img);
    if (revealObserver) revealObserver.observe(el);
  });
}

function renderBook() {
  const book = DATA.BOOK || {};
  const coverImg = document.querySelector('#book .book-cover img');
  const titleEl = document.querySelector('#book .book-info h3');
  const descEl = document.querySelector('#book .book-info p.muted');
  const buyBtn = document.querySelector('#book .book-actions a.primary');
  const excerptBtn = document.querySelector('#book .book-actions a.btn');
  if (coverImg && book.cover) coverImg.src = book.cover;
  if (titleEl && book.title) titleEl.textContent = book.title;
  if (descEl && book.desc) descEl.textContent = book.desc;
  if (buyBtn && book.buy) buyBtn.href = book.buy;
}

function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

async function initSite() {
  await fetchSiteData();
  renderProjects();
  renderArtworks();
  renderBook();
}

// run init after scripts parsed
initSite();

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

// Note: project/artwork/book event handlers are attached during render
// Book cover click handler is attached in renderBook (book cover exists in DOM already)

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
