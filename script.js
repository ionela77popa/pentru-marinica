const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Always start the birthday experience at the top, including after reload.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
function resetPageScroll() {
  if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
resetPageScroll();
window.addEventListener('pageshow', resetPageScroll);
let scrollFrame;
function stopScroll() { cancelAnimationFrame(scrollFrame); }
['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(type => window.addEventListener(type, stopScroll, { passive: true }));
function smoothScrollTo(target) {
  stopScroll();
  const from = window.scrollY;
  const to = Math.max(0, Math.min(from + target.getBoundingClientRect().top - 35, document.documentElement.scrollHeight - window.innerHeight));
  if (reducedMotion) { window.scrollTo({ top: to, behavior: 'instant' }); return; }
  const start = performance.now();
  const duration = Math.min(1200, 650 + Math.abs(to - from) * 0.2);
  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    window.scrollTo({ top: from + (to - from) * eased, behavior: 'instant' });
    if (progress < 1) scrollFrame = requestAnimationFrame(step);
  }
  scrollFrame = requestAnimationFrame(step);
}
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.getElementById(link.getAttribute('href').slice(1));
  if (!target) return;
  event.preventDefault();
  history.replaceState(null, '', link.getAttribute('href'));
  smoothScrollTo(target);
}));
const panelAnimations = new WeakMap();
async function togglePanel(panel, open) {
  const current = panelAnimations.get(panel);
  const height = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  const opacity = panel.hidden ? 0 : Number(getComputedStyle(panel).opacity);
  current?.cancel();
  if (reducedMotion || !panel.animate) { panel.hidden = !open; return; }
  panel.hidden = false;
  const margin = getComputedStyle(panel).marginTop;
  const animation = panel.animate([
    { height: `${height}px`, opacity, marginTop: height ? margin : '0px', transform: `translateY(${open ? 14 : 0}px)`, overflow: 'hidden' },
    { height: `${open ? panel.scrollHeight : 0}px`, opacity: open ? 1 : 0, marginTop: open ? margin : '0px', transform: `translateY(${open ? 0 : -8}px)`, overflow: 'hidden' }
  ], { duration: open ? 700 : 450, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
  panelAnimations.set(panel, animation);
  try { await animation.finished; } catch { return; }
  if (panelAnimations.get(panel) !== animation) return;
  panel.hidden = !open;
  animation.cancel();
  panelAnimations.delete(panel);
}
if ('IntersectionObserver' in window) {
  document.body.classList.add('js-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(section => observer.observe(section));
}
const letterButton = document.querySelector('#open-letter');
letterButton.addEventListener('click', async () => {
  const open = letterButton.getAttribute('aria-expanded') !== 'true';
  letterButton.setAttribute('aria-expanded', String(open));
  letterButton.classList.toggle('opened', open);
  letterButton.querySelector('.envelope-hint').textContent = open ? 'atinge ca să închizi' : 'atinge ca să deschizi';
  await togglePanel(document.querySelector('#letter'), open);
  if (open && letterButton.getAttribute('aria-expanded') === 'true') smoothScrollTo(document.querySelector('#letter'));
});
const notes = [
  'nu trebuie să faci nimic extraordinar ca să meriți lucruri frumoase.',
  'sper să te privești azi cu aceeași blândețe cu care te privesc eu.',
  '67',
  'există îmbrățișări care spun mai mult decât o mie de cuvinte. îți trimit una.',
  'nu te grăbi. și florile au anotimpul lor.',
  'o zi grea nu înseamnă o viață grea. mai sunt atâtea dimineți frumoase înainte.',
  'să nu-ți faci visurile mai mici doar ca să încapă în așteptările altora.',
  '69?',
  'lumea are loc pentru felul tău de a fi. exact așa cum ești.',
  'oricâți ani trec, sper să avem mereu ceva de povestit și un motiv să râdem.',
  'astăzi îți doresc ceva simplu: să simți cât de iubită ești.',
  'unele cadouri se desfac. altele rămân. prietenia noastră e dintre cele care rămân.'
];
let remaining = [];
let drawn = 0;
document.querySelector('#draw-note').addEventListener('click', () => {
  if (!remaining.length) remaining = [...notes.keys()].sort(() => Math.random() - 0.5);
  document.querySelector('#note-text').textContent = notes[remaining.pop()];
  drawn++;
  document.querySelector('#note-count').textContent = `bilețelul ${((drawn - 1) % notes.length) + 1} din ${notes.length} · păstrează-l în suflet`;
  document.querySelector('#draw-note').innerHTML = 'încă un gând frumos <span>♡</span>';
  if (!reducedMotion) document.querySelector('.note-card').animate([
    { opacity: 0.35, transform: 'rotate(4deg) translateY(8px)' },
    { opacity: 1, transform: 'rotate(4deg) translateY(0)' }
  ], { duration: 450, easing: 'ease-out' });
});
function sprinkle(count = 20) {
  if (reducedMotion) return;
  const container = document.querySelector('.petals');
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal'; petal.textContent = i % 3 === 0 ? '♡' : '✿';
    petal.style.left = `${Math.random() * 95}%`;
    petal.style.fontSize = `${12 + Math.random() * 15}px`;
    petal.style.animationDuration = `${5 + Math.random() * 4}s`;
    petal.style.animationDelay = `${Math.random() * 2}s`;
    container.append(petal);
    setTimeout(() => petal.remove(), 12000);
  }
}
const candle = document.querySelector('#candle');
const candleFlames = [...candle.querySelectorAll('.candle-fire')];
const holdProgress = document.querySelector('#hold-progress');
const progressFill = holdProgress.querySelector('span');
const holdDuration = 3000;
let holdStart = null;
let holdFrame;
let holdingPointer = null;
let holdingKey = null;
function updateHold(now) {
  if (holdStart === null) return;
  const progress = Math.min(1, (now - holdStart) / holdDuration);
  const extinguished = Math.floor(progress * candleFlames.length);
  candleFlames.forEach((flame, index) => flame.classList.toggle('out', index < extinguished));
  progressFill.style.transform = `scaleX(${progress})`;
  holdProgress.setAttribute('aria-valuenow', String(extinguished));
  if (progress < 1) { holdFrame = requestAnimationFrame(updateHold); return; }
  holdStart = null;
  candle.classList.add('blown');
  candle.classList.remove('holding');
  candle.setAttribute('aria-label', 'dorința ta a fost trimisă. la mulți ani, marina!');
  document.querySelector('#wish-message').textContent = 'dorința ta e în drum spre stele. la mulți ani! ♡';
  sprinkle(38);
}
function startHold() {
  if (holdStart !== null || candle.classList.contains('blown')) return;
  holdStart = performance.now();
  candle.classList.add('holding');
  document.querySelector('#wish-message').textContent = 'suflăăă… mai ține puțin ♡';
  holdFrame = requestAnimationFrame(updateHold);
}
function cancelHold() {
  holdingPointer = null;
  holdingKey = null;
  if (holdStart === null) return;
  cancelAnimationFrame(holdFrame);
  holdStart = null;
  candle.classList.remove('holding');
  candleFlames.forEach(flame => flame.classList.remove('out'));
  progressFill.style.transform = 'scaleX(0)';
  holdProgress.setAttribute('aria-valuenow', '0');
  document.querySelector('#wish-message').textContent = 'ține apăsat pe tort 3 secunde ca să sufli ♡';
}
candle.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || holdingKey !== null || holdingPointer !== null || candle.classList.contains('blown')) return;
  holdingPointer = event.pointerId;
  candle.setPointerCapture(event.pointerId);
  startHold();
});
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => candle.addEventListener(type, event => {
  if (event.pointerId === holdingPointer) cancelHold();
}));
candle.addEventListener('keydown', event => {
  if (![' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  if (event.repeat || holdingPointer !== null || holdingKey !== null) return;
  holdingKey = event.key;
  startHold();
});
candle.addEventListener('keyup', event => {
  if (event.key === holdingKey) { event.preventDefault(); cancelHold(); }
});
candle.addEventListener('contextmenu', event => event.preventDefault());
candle.addEventListener('blur', cancelHold);
window.addEventListener('blur', cancelHold);
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelHold(); });
const photoDialog = document.querySelector('#photo-dialog');
document.querySelectorAll('.photo-slot').forEach(button => {
  const img = button.querySelector('img');
  const showImage = () => {
    img.hidden = false;
    button.querySelector('.photo-placeholder').hidden = true;
    button.classList.add('has-photo');
  };
  img.addEventListener('load', showImage);
  if (img.complete && img.naturalWidth) showImage();
  img.addEventListener('error', () => { img.hidden = true; });
  button.addEventListener('click', () => {
    if (!img.naturalWidth) return;
    document.querySelector('#large-photo').src = img.src;
    document.querySelector('#large-photo').alt = img.alt;
    photoDialog.showModal();
  });
});
let closingPhoto = false;
async function closePhoto() {
  if (closingPhoto || !photoDialog.open) return;
  closingPhoto = true;
  photoDialog.classList.add('closing');
  if (!reducedMotion) await Promise.all(photoDialog.getAnimations().map(animation => animation.finished.catch(() => {})));
  photoDialog.close();
  photoDialog.classList.remove('closing');
  closingPhoto = false;
}
document.querySelector('#close-photo').addEventListener('click', closePhoto);
photoDialog.addEventListener('click', event => { if (event.target === photoDialog) closePhoto(); });
photoDialog.addEventListener('cancel', event => { event.preventDefault(); closePhoto(); });
sprinkle(10);

const giftButton = document.querySelector('#reveal-gift');
giftButton.addEventListener('click', () => {
  const open = giftButton.getAttribute('aria-expanded') !== 'true';
  giftButton.setAttribute('aria-expanded', String(open));
  togglePanel(document.querySelector('#gift-content'), open);
  giftButton.innerHTML = open ? 'închide cadoul <span>♡</span>' : 'deschide cadoul <span>♡</span>';
  if (open) sprinkle(18);
});
const moviePoster = document.querySelector('#movie-poster');
moviePoster.addEventListener('load', () => {
  moviePoster.hidden = false;
  document.querySelector('#poster-placeholder').hidden = true;
});
moviePoster.addEventListener('error', () => {
  moviePoster.hidden = true;
  document.querySelector('#poster-placeholder').hidden = false;
});
moviePoster.src = moviePoster.dataset.src;
