// Nomor WhatsApp WebKita (format internasional, tanpa + atau spasi) — 0838-3465-4716
const WA_NUMBER = '6283834654716';
const waLink = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

document.documentElement.classList.add('js');

// Tautan WhatsApp dengan pesan otomatis
document.querySelectorAll('.js-wa').forEach((el) => {
  const msg = el.dataset.msg || 'Halo WebKita';
  el.href = waLink(msg);
  el.target = '_blank';
  el.rel = 'noopener noreferrer';
});

// Header saat scroll
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu mobile
const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') === 'true';
  menuBtn.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
});
mobileNav.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', 'false');
    mobileNav.hidden = true;
  })
);

// Menu aktif sesuai section
const links = document.querySelectorAll('.nav a');
const sections = ['home', 'paket', 'cara-order', 'kontak'].map((id) => document.getElementById(id));
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  },
  { rootMargin: '-45% 0px -50% 0px' }
);
sections.forEach((s) => s && spy.observe(s));

// Animasi muncul
const revealEls = document.querySelectorAll('.reveal, .plan, .adv, .step');
revealEls.forEach((el) => el.classList.add('reveal'));
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  io.observe(el);
});

document.getElementById('year').textContent = new Date().getFullYear();

// ================= Alur pemesanan: Data → QRIS → WhatsApp =================
const modal = document.getElementById('order-modal');
const form = document.getElementById('step-1');
const steps = [1, 2, 3].map((n) => document.getElementById('step-' + n));
const indicators = modal.querySelectorAll('[data-step-ind]');
const btnContinue = document.getElementById('btn-continue');
const btnWaAgain = document.getElementById('btn-wa-again');
const rupiah = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
let order = { plan: '', price: 0, id: '' };
let lastFocus = null;

function goStep(n) {
  steps.forEach((el, i) => (el.hidden = i !== n - 1));
  indicators.forEach((li) => {
    const k = Number(li.dataset.stepInd);
    li.classList.toggle('is-active', k === n);
    li.classList.toggle('is-done', k < n);
  });
  modal.querySelector('.modal-panel').scrollTop = 0;
}

function openModal(plan, price) {
  order = { plan, price: Number(price), id: 'WK-' + Date.now().toString().slice(-6) };
  document.getElementById('sum-plan').textContent = 'Paket ' + plan;
  document.getElementById('sum-price').textContent = rupiah(price);
  lastFocus = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  goStep(1);
  setTimeout(() => form.querySelector('input').focus(), 60);
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll('.js-order').forEach((btn) =>
  btn.addEventListener('click', () => openModal(btn.dataset.plan, btn.dataset.price))
);
modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => {
  if (!modal.hidden && e.key === 'Escape') closeModal();
});

// Validasi
function validate() {
  let ok = true;
  const set = (name, valid) => {
    const field = form.elements[name].closest('.field');
    field.classList.toggle('invalid', !valid);
    if (!valid && ok) form.elements[name].focus();
    if (!valid) ok = false;
  };
  const v = (n) => form.elements[n].value.trim();
  set('nama', v('nama').length >= 2);
  set('usaha', v('usaha').length >= 2);
  const digits = v('wa').replace(/\D/g, '');
  set('wa', digits.length >= 10 && digits.length <= 15);
  set('jenis', v('jenis') !== '');
  set('email', v('email') === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')));
  return ok;
}
form.addEventListener('input', (e) => {
  const f = e.target.closest('.field');
  if (f && f.classList.contains('invalid')) f.classList.remove('invalid');
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validate()) return;
  const d = Object.fromEntries(new FormData(form).entries());
  const lines = [
    'Halo WebKita, saya sudah melakukan pembayaran via QRIS.',
    '',
    '*Detail Pesanan*',
    `Kode pesanan: ${order.id}`,
    `Paket: ${order.plan}`,
    `Total: ${rupiah(order.price)}`,
    '',
    '*Data Pemesan*',
    `Nama: ${d.nama.trim()}`,
    `Nama usaha: ${d.usaha.trim()}`,
    `No. WhatsApp: ${d.wa.trim()}`,
    `Jenis usaha: ${d.jenis}`,
  ];
  if (d.email.trim()) lines.push(`Email: ${d.email.trim()}`);
  if (d.kota.trim()) lines.push(`Kota: ${d.kota.trim()}`);
  if (d.catatan.trim()) lines.push(`Catatan: ${d.catatan.trim()}`);
  lines.push('', 'Berikut saya lampirkan bukti pembayarannya. Terima kasih.');
  const link = waLink(lines.join('\n'));
  btnContinue.href = link;
  btnWaAgain.href = link;
  document.getElementById('pay-total').textContent = rupiah(order.price);
  document.querySelectorAll('.js-total').forEach((el) => (el.textContent = rupiah(order.price)));
  document.getElementById('order-id').textContent = order.id;
  goStep(2);
});

document.getElementById('btn-back').addEventListener('click', () => goStep(1));
btnContinue.addEventListener('click', () => {
  // Link WhatsApp terbuka di tab baru, modal pindah ke layar terima kasih
  setTimeout(() => {
    goStep(3);
    form.reset();
  }, 300);
});
