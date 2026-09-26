/* ==========================================================================
   Thibodaux T-Box: site script (every page)
   ========================================================================== */
const SITE = {
  // Booking platform link (Golf O'Clock or Woosh). Every Book Now and Book a Tee Time button uses it.
  BOOKING_URL: 'https://example.com/book',

  // Membership sign up on the booking platform. Leave empty to use BOOKING_URL.
  MEMBERSHIP_URL: '',

  // Gift card purchase on the booking platform. Leave empty to use BOOKING_URL.
  GIFT_CARD_URL: '',

  // Member login on the booking platform.
  MEMBER_LOGIN_URL: 'https://example.com/login',

  // Form service endpoint (for example a Formspree form URL) that emails event inquiries
  // and contact messages to Lynn. Until it is set, forms ask people to call instead.
  FORM_ENDPOINT: '',

  // Target opening day (Central Time). Founding memberships close then. The countdown shows days only.
  FOUNDING_DEADLINE: '2026-11-30T23:59:59-06:00',

  // Phone number used in form messages.
  PHONE: '(985) 555-0142',

  // Social links. Each one appears in the footer once it has a URL.
  SOCIAL: { instagram: '', facebook: '' },
};

(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  let lenis = null;
  let motionOn = false;

  /* Tracking: GTM dataLayer, plus the Meta Pixel when it is present -------- */
  function track(event, data) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event, page: location.pathname }, data));
    if (typeof window.fbq === 'function') window.fbq('trackCustom', event, data || {});
  }
  const where = (el) => (el.closest('[id]') ? el.closest('[id]').id : 'nav');

  /* Links from settings ---------------------------------------------------- */
  function wireLinks() {
    const joinUrl = SITE.MEMBERSHIP_URL || SITE.BOOKING_URL;
    const giftUrl = SITE.GIFT_CARD_URL || SITE.BOOKING_URL;
    $$('[data-booking]').forEach((a) => {
      a.href = SITE.BOOKING_URL;
      a.addEventListener('click', () => track('book_now_click', { cta_text: a.textContent.trim(), cta_location: where(a) }));
    });
    $$('[data-join]').forEach((a) => {
      a.href = joinUrl;
      a.addEventListener('click', () => track('join_now_click', { plan: a.dataset.join }));
    });
    $$('a[href^="/memberships#"]').forEach((a) => {
      a.addEventListener('click', () => track('join_now_click', { plan: a.getAttribute('href').split('#')[1] }));
    });
    $$('[data-gift]').forEach((a) => {
      a.href = giftUrl;
      a.addEventListener('click', () => track('gift_card_click', { cta_location: where(a) }));
    });
    $$('[data-login]').forEach((a) => { a.href = SITE.MEMBER_LOGIN_URL; });
    $$('[data-social]').forEach((a) => {
      const url = SITE.SOCIAL[a.dataset.social];
      if (url) { a.href = url; a.hidden = false; a.target = '_blank'; a.rel = 'noopener'; }
    });
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
  }

  /* Founding countdown (days only, never spots) ---------------------------- */
  function founding() {
    const section = $('#founding');
    if (!section) return 0;
    const end = new Date(SITE.FOUNDING_DEADLINE);
    const days = Math.ceil((end.getTime() - Date.now()) / 86400000);
    if (!(days > 0)) { section.hidden = true; return 0; }
    $$('[data-days]', section).forEach((n) => { n.textContent = days; });
    $$('[data-days-unit]', section).forEach((n) => { n.textContent = days === 1 ? 'day' : 'days'; });
    const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'America/Chicago' }).format(end);
    $$('[data-deadline]', section).forEach((n) => { n.textContent = date; });
    return days;
  }
  // Odometer: each digit is a strip of 9..0 twice, so it rolls downward like a countdown.
  const STRIP = '98765432109876543210';
  const stripY = (index) => -index * 5;
  function buildOdometer(el, value) {
    const digits = String(value).split('').map(Number);
    const cells = [...STRIP].map((n) => `<span>${n}</span>`).join('');
    el.innerHTML = digits.map(() => `<span class="odo__col"><span class="odo__strip">${cells}</span></span>`).join('');
    return $$('.odo__strip', el).map((strip, i) => ({ strip, stop: 10 + (9 - digits[i]) }));
  }

  /* Nav matches the section under it --------------------------------------- */
  function navState() {
    const nav = $('[data-nav]');
    const darks = $$('[data-dark]');
    let queued = false;
    const update = () => {
      queued = false;
      const mid = nav.offsetHeight / 2;
      nav.classList.toggle('is-dark', darks.some((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      }));
    };
    update();
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
  }

  /* Mobile menu ------------------------------------------------------------ */
  function menu() {
    const nav = $('[data-nav]');
    const btn = $('.nav__menu');
    const panel = $('#menu');
    const behind = () => $$('main, .foot');
    const isOpen = () => panel.classList.contains('is-open');
    const open = () => {
      panel.classList.add('is-open');
      panel.inert = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      nav.classList.add('is-menu');
      root.classList.add('menu-open');
      behind().forEach((el) => { el.inert = true; });
      if (lenis) lenis.stop();
      const first = $('.menu__links a', panel);
      if (first) first.focus({ preventScroll: true });
    };
    const close = () => {
      if (!isOpen()) return;
      panel.classList.remove('is-open');
      panel.inert = true;
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-menu');
      root.classList.remove('menu-open');
      behind().forEach((el) => { el.inert = false; });
      if (lenis) lenis.start();
    };
    btn.addEventListener('click', () => (isOpen() ? close() : open()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) { close(); btn.focus(); } });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) close(); });
    return { close };
  }

  /* In-page links glide with Lenis ------------------------------------------ */
  const navOffset = () => 1 - $('[data-nav]').offsetHeight;
  function glideTo(target, immediate) {
    if (lenis) lenis.scrollTo(target, { offset: navOffset(), duration: immediate ? 0 : 1.4, immediate: !!immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + navOffset(), behavior: immediate || reduceMotion ? 'auto' : 'smooth' });
  }
  function anchors(menuApi) {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        menuApi.close();
        glideTo(target);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* Arriving at /memberships#eagle: land on the plan and mark it ------------ */
  function landOnHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    const go = () => {
      glideTo(target, true);
      if (target.classList.contains('plan')) {
        target.classList.add('is-target');
        setTimeout(() => target.classList.remove('is-target'), 3400);
      }
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(go)); else go();
  }

  /* FAQ accordions ---------------------------------------------------------- */
  function faq() {
    $$('details.qa').forEach((d) => {
      const summary = $('summary', d);
      const body = $('.qa__a', d);
      d.addEventListener('toggle', () => d.classList.toggle('is-open', d.open));
      summary.addEventListener('click', (e) => {
        if (!motionOn) return;
        e.preventDefault();
        gsap.killTweensOf(body);
        if (d.open) {
          d.classList.remove('is-open');
          gsap.fromTo(body, { height: body.offsetHeight }, {
            height: 0, duration: 0.45, ease: 'power3.inOut',
            onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); },
          });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0 }, {
            height: body.scrollHeight, duration: 0.55, ease: 'power3.out',
            onComplete: () => { gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); },
          });
        }
      });
    });
  }

  /* Events: the occasion list switches the photo beside it ----------------- */
  function occasions() {
    $$('[data-occ]').forEach((box) => {
      const items = $$('.occ__item', box);
      const photos = $$('.occ__ph', box);
      const set = (i) => {
        items.forEach((b, j) => { b.classList.toggle('is-active', i === j); b.setAttribute('aria-pressed', String(i === j)); });
        photos.forEach((p, j) => p.classList.toggle('is-active', i === j));
      };
      const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
      items.forEach((b, i) => {
        b.addEventListener('click', () => set(i));
        b.addEventListener('focus', () => set(i));
        b.addEventListener('pointerenter', () => { if (hover.matches) set(i); });
      });
    });
  }

  /* Forms: event inquiry and contact ---------------------------------------- */
  function forms() {
    $$('form[data-form]').forEach((form) => {
      const status = $('.form__status', form);
      const body = $('.form__body', form);
      const done = $('.form__done', form);
      const submit = $('button[type="submit"]', form);
      const say = (msg, kind) => { status.textContent = msg; status.classList.toggle('is-error', kind === 'error'); };

      $$('input[type="range"]', form).forEach((range) => {
        const out = form.querySelector(`output[for="${range.id}"]`);
        const paint = () => {
          const pct = ((range.value - range.min) / (range.max - range.min)) * 100;
          range.style.setProperty('--pct', `${pct}%`);
          if (out) out.textContent = range.value;
        };
        range.addEventListener('input', paint);
        paint();
      });
      $$('.input', form).forEach((input) => input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && input.checkValidity()) field.classList.remove('is-invalid');
      }));

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let firstBad = null;
        $$('[required]', form).forEach((input) => {
          const ok = input.checkValidity();
          const field = input.closest('.field');
          if (field) field.classList.toggle('is-invalid', !ok);
          if (!ok && !firstBad) firstBad = input;
        });
        if (firstBad) {
          say('Please add your name and a valid email so we can get back to you.', 'error');
          firstBad.focus();
          return;
        }
        const data = new FormData(form);
        if (data.get('_gotcha')) return;
        data.append('form', form.dataset.form);
        data.append('page', location.pathname);
        if (!SITE.FORM_ENDPOINT) {
          say(`Online messages open soon. For now, please call us at ${SITE.PHONE}.`, 'error');
          return;
        }
        const label = submit.textContent;
        submit.disabled = true;
        submit.textContent = 'Sending';
        say('', '');
        try {
          const res = await fetch(SITE.FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          track('form_submit', { form: form.dataset.form });
          const first = String(data.get('name') || '').trim().split(' ')[0];
          const who = $('[data-name]', done);
          if (who) who.textContent = first ? `, ${first}` : '';
          body.hidden = true;
          done.hidden = false;
          done.setAttribute('tabindex', '-1');
          done.focus({ preventScroll: true });
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        } catch (err) {
          say(`That didn't go through. Please try again, or call us at ${SITE.PHONE}.`, 'error');
        } finally {
          submit.disabled = false;
          submit.textContent = label;
        }
      });
    });
  }

  /* Sample drive: ball flight and launch monitor numbers -------------------- */
  function shot() {
    const fig = $('[data-shot]');
    if (!fig) return null;
    const plot = $('.shot__plot', fig);
    const svg = $('svg', plot);
    const trail = $('.shot__trail', svg);
    const ball = $('.shot__ball', svg);
    const ground = $('.shot__ground', svg);
    const dot = $('.shot__dot', svg);
    const replay = $('.shot__replay', fig);
    const carryEl = $('[data-carry]', fig);
    const stats = $$('[data-stat]', fig);
    const CARRY = Number(carryEl.dataset.carry);
    const RANGE = 300;
    const state = { p: 1 };
    let L = 0, x0 = 0, x1 = 1, tl = null;

    // Normalized cubic Bezier for a drive: steady climb, apex about two thirds out, steeper fall.
    const A = 0.36, K1 = 0.62, B = 0.8, K2 = 1.18;
    let apex = 0;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      apex = Math.max(apex, 3 * (1 - t) ** 2 * t * K1 + 3 * (1 - t) * t * t * K2);
    }

    function render() {
      const len = L * state.p;
      trail.style.strokeDashoffset = L - len;
      const pt = trail.getPointAtLength(len);
      ball.setAttribute('cx', pt.x);
      ball.setAttribute('cy', pt.y);
      const f = Math.min(1, Math.max(0, (pt.x - x0) / (x1 - x0)));
      carryEl.textContent = Math.round(CARRY * f);
    }
    function layout() {
      const W = plot.clientWidth;
      const H = plot.clientHeight;
      if (!W || !H) return;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const gy = H - 8, top = 12, pad = 6;
      const xAt = (yd) => pad + (W - pad * 2) * (yd / RANGE);
      x0 = xAt(0); x1 = xAt(CARRY);
      const sx = x1 - x0, sy = (gy - top) / apex;
      trail.setAttribute('d', `M${x0} ${gy} C${x0 + A * sx} ${gy - K1 * sy} ${x0 + B * sx} ${gy - K2 * sy} ${x1} ${gy}`);
      L = trail.getTotalLength();
      trail.style.strokeDasharray = `${L} ${L}`;
      ground.setAttribute('x1', 0); ground.setAttribute('x2', W);
      ground.setAttribute('y1', gy); ground.setAttribute('y2', gy);
      dot.setAttribute('cx', x1); dot.setAttribute('cy', gy);
      render();
    }
    const readouts = stats.map((el) => el.closest('div'));
    function prime() {
      state.p = 0;
      render();
      dot.style.opacity = 0;
      readouts.forEach((d) => { d.style.opacity = 0; });
    }
    function play() {
      if (tl) tl.kill();
      gsap.killTweensOf([state, dot, ...readouts]);
      prime();
      replay.hidden = true;
      tl = gsap.timeline({ onComplete: () => { replay.hidden = false; } });
      tl.to(readouts, { opacity: 1, duration: 0.25, ease: 'power1.out', stagger: 0.05 }, 0.15)
        .to(state, { p: 1, duration: 2.5, ease: 'power1.out', onUpdate: render }, 0.12)
        .to(dot, { opacity: 1, duration: 0.3 }, '>-0.05');
    }
    new ResizeObserver(layout).observe(plot);
    layout();
    replay.addEventListener('click', play);
    return { prime, play, final() { state.p = 1; render(); dot.style.opacity = 1; readouts.forEach((d) => { d.style.opacity = 1; }); } };
  }

  /* Motion: only where it carries information ------------------------------ */
  function motion(days, shotApi) {
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Hero: the headline lines slide up once, the photo settles.
    const title = $('.hero__title');
    if (title) {
      const lines = $$('.ln > span', title);
      gsap.set(lines, { yPercent: 105 });
      gsap.set(title, { opacity: 1 });
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      const photo = $('.hero .ph__fill');
      if (photo) intro.fromTo(photo, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0);
      intro.to(lines, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.15)
        .to($$('[data-hero-in]'), { opacity: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.55);
    }

    // Countdown digits roll down to today's number.
    const odo = $('[data-odo]');
    if (odo && days) {
      const cols = buildOdometer(odo, days);
      ScrollTrigger.create({
        trigger: odo, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to(odo, { opacity: 1, duration: 0.4, ease: 'power2.out' });
          cols.forEach(({ strip, stop }, i) => {
            gsap.fromTo(strip, { yPercent: 0 }, { yPercent: stripY(stop), duration: 1.4 + i * 0.25, ease: 'expo.out', delay: i * 0.05 });
          });
        },
      });
    }

    // Booking confirmation: the door code types itself in, then the door unlocks.
    $$('[data-ticket]').forEach((ticket) => {
      const digits = $$('.ticket__code span', ticket);
      const done = $('.ticket__done', ticket);
      ScrollTrigger.create({
        trigger: ticket, start: 'top 72%', once: true,
        onEnter: () => gsap.timeline({ delay: 0.3 })
          .to(digits, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.32 })
          .to(done, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '+=0.25'),
      });
    });

    // Rate bars grow to their hourly cost.
    $$('[data-bars]').forEach((list) => {
      ScrollTrigger.create({
        trigger: list, start: 'top 80%', once: true,
        onEnter: () => gsap.to($$('.rate__bar', list), { scaleX: 1, duration: 1.2, ease: 'expo.out', stagger: 0.12 }),
      });
    });

    // Members-only hours fill in across the day.
    $$('[data-day]').forEach((chart) => {
      ScrollTrigger.create({
        trigger: chart, start: 'top 82%', once: true,
        onEnter: () => gsap.to($$('.day__seg', chart), { scaleX: 1, duration: 1, ease: 'expo.out', stagger: 0.25 }),
      });
    });

    // Punch pass: holes punch in as you scroll.
    $$('[data-punch]').forEach((card) => {
      const fills = $$('.punch__dot.is-punched > span', card);
      gsap.set(fills, { scale: 0 });
      gsap.to(fills, {
        scale: 1, ease: 'back.out(2)', stagger: 0.2,
        scrollTrigger: { trigger: card, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
      });
    });

    // Sample drive fires when the plot is fully in view.
    if (shotApi) {
      shotApi.prime();
      ScrollTrigger.create({ trigger: '.shot__plot', start: 'bottom 92%', once: true, onEnter: shotApi.play });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* Static fallback: reduced motion, or the libraries did not load ---------- */
  function staticPage(days, shotApi) {
    if (window.gsap) gsap.set('.hero__title, .hero__title .ln > span, [data-hero-in], .odo, .ticket__code span, .ticket__done, .rate__bar, .day__seg', { clearProps: 'all' });
    root.classList.remove('js');
    const odo = $('[data-odo]');
    if (odo && days) {
      buildOdometer(odo, days).forEach(({ strip, stop }) => { strip.style.transform = `translateY(${stripY(stop)}%)`; });
    }
    if (shotApi) shotApi.final();
  }

  function init() {
    wireLinks();
    const days = founding();
    const menuApi = menu();
    anchors(menuApi);
    navState();
    faq();
    forms();
    occasions();
    const shotApi = shot();

    const canAnimate = !reduceMotion && window.gsap && window.ScrollTrigger && root.classList.contains('js');
    if (canAnimate) {
      try {
        motion(days, shotApi);
        motionOn = true;
      } catch (err) {
        console.error(err);
        staticPage(days, shotApi);
      }
    } else {
      staticPage(days, shotApi);
    }
    root.classList.add('is-ready');
    landOnHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
