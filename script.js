/* =========================================================
   Sumitra Hospital — script
   ========================================================= */

/* ---------------------------------------------------------
   SETTINGS — booking emails (Web3Forms)
   1. Go to https://web3forms.com, enter the Gmail address that
      should receive bookings and click "Create Access Key".
   2. Paste the key from your inbox below.
   That's it: every booking now arrives in that Gmail inbox.
   --------------------------------------------------------- */
const WEB3FORMS_ACCESS_KEY = "aaaaaaaaaaaaaaa";
const HOSPITAL_PHONE = "8083980227";

(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const header = $('#header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme switcher ---------- */
  const themeBtn = $('#themeBtn');
  const themeMeta = $('meta[name="theme-color"]');
  const applyThemeUI = () => {
    const dark = root.getAttribute('data-theme') !== 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    themeMeta.setAttribute('content', dark ? '#0A0D0C' : '#F6F8F7');
  };
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('sumitra-theme', next); } catch (e) {}
    applyThemeUI();
  });
  applyThemeUI();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Header border on scroll ---------- */
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Smooth scroll that lands the heading right under the header
     (fixes the big empty gap when clicking Gallery, Reviews, etc.) ---------- */
  const scrollToId = (id, smooth = true) => {
    if (id === 'top' || id === '') { window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }); return; }
    const el = document.getElementById(id);
    if (!el) return;
    const pad = el.classList.contains('section') ? parseFloat(getComputedStyle(el).paddingTop) || 0 : 0;
    const top = el.getBoundingClientRect().top + window.scrollY + pad - header.offsetHeight - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (id !== 'top' && !document.getElementById(id)) return;
      e.preventDefault();
      setMenu(false);
      scrollToId(id);
      history.replaceState(null, '', id === 'top' ? location.pathname : '#' + id);
    });
  });
  if (location.hash) window.addEventListener('load', () => scrollToId(location.hash.slice(1), false));

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.nav a[href^="#"]');
  const sections = navLinks.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navObs.observe(s));
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- ECG heartbeat line in the hero ---------- */
  const buildEcg = () => {
    const W = 1200, base = 74;
    let d = `M0 ${base}`;
    for (let x = 0; x < W; x += 300) {
      d += ` L${x + 90} ${base} L${x + 102} ${base - 8} L${x + 114} ${base}`      // P wave
        +  ` L${x + 132} ${base} L${x + 140} ${base + 10} L${x + 152} ${base - 62}` // Q R
        +  ` L${x + 164} ${base + 30} L${x + 174} ${base}`                          // S
        +  ` L${x + 196} ${base} Q${x + 214} ${base - 20} ${x + 232} ${base}`       // T wave
        +  ` L${x + 300} ${base}`;
    }
    $('#ecgBase').setAttribute('d', d);
    $('#ecgPulse').setAttribute('d', d);
  };
  buildEcg();

  /* ---------- Cursor spotlight on cards ---------- */
  $$('.spot').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Gallery lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  $$('.g-item').forEach((b) => b.addEventListener('click', () => {
    const img = $('img', b);
    lbImg.src = b.dataset.full; lbImg.alt = img.alt;
    lbCap.textContent = $('.g-cap', b).textContent;
    lb.showModal();
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

  /* ---------- Appointment modal ---------- */
  const modal = $('#apptModal');
  const card = $('.modal-card', modal);
  const form = $('#apptForm');
  const msg = $('#formMsg');
  const btn = $('#submitBtn');
  const phone = $('#m-phone');
  const dateInput = $('#m-date');
  const concern = $('#m-concern');
  const consent = $('#m-consent');

  const now = new Date();
  dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });

  const openModal = (concernValue) => {
    setMenu(false);
    if (card.classList.contains('sent')) { card.classList.remove('sent'); form.reset(); }
    msg.classList.remove('show');
    if (concernValue) {
      const opt = [...concern.options].find((o) => o.value === concernValue || o.text === concernValue);
      if (opt) concern.value = opt.value;
    }
    modal.showModal();
    root.classList.add('modal-open');
    setTimeout(() => $('#m-name').focus(), 60);
  };
  const closeModal = () => modal.close();
  modal.addEventListener('close', () => root.classList.remove('modal-open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  $('#modalClose').addEventListener('click', closeModal);
  $('#doneClose').addEventListener('click', closeModal);

  $$('[data-open-appt]').forEach((el) => el.addEventListener('click', () => openModal(el.dataset.concern)));
  $$('.t-card[data-concern]').forEach((el) => el.addEventListener('click', () => openModal(el.dataset.concern)));

  // clear red state as the user fixes a field
  $$('input, select, textarea', form).forEach((f) => f.addEventListener('input', () => f.classList.remove('bad')));
  consent.addEventListener('change', () => consent.closest('.consent').classList.remove('bad'));

  const showError = (text) => { msg.textContent = text; msg.classList.add('show'); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.remove('show');

    // validate
    let firstBad = null;
    $$('[required]', form).forEach((f) => {
      if (f === consent) return;
      const ok = f.checkValidity();
      f.classList.toggle('bad', !ok);
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      showError(!phone.checkValidity() && firstBad === phone ? 'Please enter a valid 10-digit mobile number.' : 'Please fill in all the fields marked *.');
      firstBad.focus();
      return;
    }
    if (!consent.checked) {
      consent.closest('.consent').classList.add('bad');
      showError('Please tick the box so our staff can call you to confirm.');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    if (data.botcheck) return; // spam bot
    delete data.botcheck;

    if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.startsWith('aaaa')) {
      showError(`Online booking isn't set up yet. Please call ${HOSPITAL_PHONE} to book. (Site owner: add your Web3Forms access key in script.js.)`);
      return;
    }

    const name = data['Patient name'].trim();
    const prettyDate = new Date(data['Preferred date'] + 'T00:00')
      .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    data['Preferred date'] = prettyDate;

    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New appointment: ${name}, ${prettyDate} (${data['Preferred time']})`,
      from_name: 'Sumitra Hospital Website',
      ...data,
      'Contact consent': 'Yes, call / SMS / WhatsApp',
      botcheck: false,
    };

    btn.disabled = true; btn.classList.add('loading');
    $('.lbl', btn).textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (res.ok && out.success) {
        $('#doneName').textContent = name;
        card.classList.add('sent');
        card.scrollTop = 0;
      } else {
        showError(out.message || `The request could not be sent. Please call ${HOSPITAL_PHONE} to book.`);
      }
    } catch (err) {
      showError(`No internet connection, or the request was blocked. Please call ${HOSPITAL_PHONE} to book.`);
    } finally {
      btn.disabled = false; btn.classList.remove('loading');
      $('.lbl', btn).textContent = '📅 Confirm Appointment';
    }
  });

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
