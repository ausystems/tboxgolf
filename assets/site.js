/* ==========================================================================
   Thibodaux T-Box: shared script for the inner pages
   (memberships, events, gift cards, about, 404).
   The homepage (index.html) keeps its own inline copy of BOOKING_URL,
   MEMBER_LOGIN_URL and FOUNDING_DEADLINE. Keep both in sync.
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
  const STRIP = '98765432109876543210';
  const stripY = (index) => -index * 5;
  function buildOdometer(el, value) {
    const digits = String(value).split('').map(Number);
    const cells = [...STRIP].map((n) => `<span>${n}</span>`).join('');
    el.innerHTML = digits.map(() => `<span class="odo__col"><span class="odo__strip">${cells}</span></span>`).join('');
    return $$('.odo__strip', el).map((strip, i) => ({ strip, stop: 10 + (9 - digits[i]) }));
  }

  /* Nav turns dark over dark sections --------------------------------------- */
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
    if (lenis) lenis.scrollTo(target, { offset: navOffset(), duration: immediate ? 0 : 1.5, immediate: !!immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
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

  /* Arriving at /memberships#eagle: land on the plan and light it up -------- */
  function landOnHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    const go = () => {
      // Measure where the plan will rest, not where its fade-up animation starts.
      const rising = target.closest('[data-reveal]');
      if (rising && window.gsap) gsap.set(rising, { y: 0 });
      glideTo(target, true);
      if (target.classList.contains('tier')) {
        target.classList.add('is-target');
        setTimeout(() => target.classList.remove('is-target'), 3200);
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
            height: 0, duration: 0.5, ease: 'power3.inOut',
            onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); },
          });
        } else {
          d.open = true;
          gsap.fromTo(body, { height: 0 }, {
            height: body.scrollHeight, duration: 0.6, ease: 'power3.out',
            onComplete: () => { gsap.set(body, { clearProps: 'height' }); ScrollTrigger.refresh(); },
          });
        }
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
          say(`That did not go through. Please try again, or call us at ${SITE.PHONE}.`, 'error');
        } finally {
          submit.disabled = false;
          submit.textContent = label;
        }
      });
    });
  }

  /* Split a headline into masked words, keeping <em> and line spans -------- */
  function splitWords(el) {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    const wrap = (text) => text.split(/(\s+)/).map((t) => {
      if (!t) return '';
      if (/^\s+$/.test(t)) return ' ';
      return `<span class="w" aria-hidden="true"><span>${t}</span></span>`;
    }).join('');
    [...el.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        const holder = document.createElement('span');
        holder.innerHTML = wrap(node.textContent);
        node.replaceWith(...holder.childNodes);
      } else if (node.nodeType === 1) {
        node.innerHTML = wrap(node.textContent);
      }
    });
    return $$('.w > span', el);
  }

  /* Motion ----------------------------------------------------------------- */
  function motion(days) {
    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Headlines rise word by word.
    const heroTitle = $('.hero__title');
    let heroWords = [];
    if (heroTitle) {
      heroWords = splitWords(heroTitle);
      gsap.set(heroWords, { yPercent: 118 });
      gsap.set(heroTitle, { opacity: 1 });
    }
    $$('[data-split]').filter((el) => el !== heroTitle).forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 118 });
      gsap.set(el, { opacity: 1 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 }),
      });
    });

    // Hero entrance.
    const [heroKicker, ...heroRest] = $$('.hero [data-hero-el]');
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if ($('.hero .ph__fill')) intro.fromTo('.hero .ph__fill', { scale: 1.16 }, { scale: 1, duration: 2.8, ease: 'power3.out' }, 0);
    if (heroKicker) intro.to(heroKicker, { opacity: 1, y: 0, duration: 1.3 }, 0.25);
    if (heroWords.length) intro.to(heroWords, { yPercent: 0, duration: 1.5, stagger: 0.1 }, 0.3);
    if (heroRest.length) intro.to(heroRest, { opacity: 1, y: 0, duration: 1.4, stagger: 0.12 }, 0.75);

    // Photo heroes settle into a rounded card as you scroll away.
    if ($('.hero--page')) {
      gsap.to('.hero--page .hero__media', {
        scale: 0.94, borderRadius: 28, ease: 'none',
        scrollTrigger: { trigger: '.hero--page', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero--page .hero__content', {
        y: -80, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero--page', start: 'top top', end: '60% top', scrub: true },
      });
    }

    // Fade up everything marked data-reveal, in small staggered batches.
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (els) => gsap.to(els, {
        opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true,
        onComplete: () => els.forEach((el) => { el.removeAttribute('data-reveal'); gsap.set(el, { clearProps: 'opacity,transform' }); }),
      }),
    });

    // Countdown digits roll down to today's number.
    const odo = $('[data-odo]');
    if (odo && days) {
      const cols = buildOdometer(odo, days);
      ScrollTrigger.create({
        trigger: odo, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to(odo, { opacity: 1, duration: 0.5, ease: 'power2.out' });
          cols.forEach(({ strip, stop }, i) => {
            gsap.fromTo(strip, { yPercent: 0 }, { yPercent: stripY(stop), duration: 2.4 + i * 0.35, ease: 'expo.out', delay: i * 0.06 });
          });
        },
      });
    }

    // Step icons draw themselves; the keypad taps in a code.
    const steps = $$('.step');
    if (steps.length) {
      steps.forEach((step) => {
        gsap.set($$('.d', step), { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set($$('.k', step), { opacity: 0, scale: 0.3, transformOrigin: '50% 50%' });
      });
      ScrollTrigger.create({
        trigger: steps[0].closest('ul, ol') || steps[0], start: 'top 80%', once: true,
        onEnter: () => {
          const tl = gsap.timeline({ delay: 0.2 });
          steps.forEach((step, i) => {
            const at = i * 0.3;
            tl.to($$('.d', step), { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, at)
              .to($$('.k', step), { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.035 }, at + 0.5);
            const code = $$('.k[data-code]', step).sort((a, b) => a.dataset.code - b.dataset.code);
            if (code.length) tl.to(code, { keyframes: [{ scale: 1.75, duration: 0.14 }, { scale: 1, duration: 0.32 }], ease: 'power2.out', stagger: 0.2 }, at + 1.15);
          });
        },
      });
    }

    // Dark bands widen to full bleed as they arrive.
    const insetX = () => (window.innerWidth < 640 ? 10 : 28);
    const radius = () => (window.innerWidth < 640 ? 20 : 32);
    $$('.band__bg').forEach((bg) => {
      gsap.fromTo(bg,
        { clipPath: () => `inset(0px ${insetX()}px 0px ${insetX()}px round ${radius()}px)` },
        {
          clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'none',
          scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'top 12%', scrub: true, invalidateOnRefresh: true },
        });
    });

    // Photos ease out of a slight zoom as they pass.
    $$('[data-parallax]').forEach((el) => {
      gsap.fromTo($('.ph__fill', el), { scale: 1.14 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom 35%', scrub: true },
      });
    });

    // Members-only hours: the day fills in, segment by segment.
    $$('[data-day]').forEach((chart) => {
      const segs = $$('.day__seg', chart);
      ScrollTrigger.create({
        trigger: chart, start: 'top 82%', once: true,
        onEnter: () => gsap.to(segs, { scaleX: 1, duration: 1.1, ease: 'expo.out', stagger: 0.28 }),
      });
    });

    // Big numbers count up.
    $$('[data-count]').forEach((el) => {
      const to = Number(el.dataset.count);
      const from = el.dataset.from !== undefined ? Number(el.dataset.from) : 0;
      const o = { v: from };
      el.textContent = from;
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); } }),
      });
    });

    // Gift card punch: dots fill in as you scroll.
    $$('[data-punch]').forEach((card) => {
      const fills = $$('.punch__dot > span', card);
      gsap.set(fills, { scale: 0 });
      gsap.to(fills, {
        scale: 1, ease: 'back.out(2)', stagger: 0.2,
        scrollTrigger: { trigger: card, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
      });
    });

    // Gift card: resting 3D pose, a slow float, and a tilt that follows the pointer.
    const stage = $('[data-tilt]');
    if (stage) {
      const card = $('.gcard', stage);
      const shine = $('.gcard__shine', card);
      const rest = { x: 8, y: -16 };
      gsap.set(card, { transformPerspective: 1400, rotationX: rest.x, rotationY: rest.y });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      gsap.to(stage, { y: -12, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      if (shine) gsap.to(shine, { xPercent: 140, duration: 2.2, ease: 'power2.inOut', delay: 1.1 });
      const area = stage.closest('.hero') || stage;
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        area.addEventListener('pointermove', (e) => {
          const r = stage.getBoundingClientRect();
          const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
          ry((x - 0.5) * 24);
          rx(-(y - 0.5) * 18);
          card.style.setProperty('--mx', `${x * 100}%`);
          card.style.setProperty('--my', `${y * 100}%`);
        });
        area.addEventListener('pointerleave', () => { rx(rest.x); ry(rest.y); });
      } else {
        gsap.to(card, { rotationY: rest.y + 10, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      }
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  /* Static fallback: reduced motion, or the libraries did not load ---------- */
  function staticPage(days) {
    if (window.gsap) gsap.set('[data-reveal], [data-hero-el], [data-split], [data-split] .w > span, .odo, .step .d, .step .k, .day__seg', { clearProps: 'all' });
    root.classList.remove('js');
    const odo = $('[data-odo]');
    if (odo && days) {
      buildOdometer(odo, days).forEach(({ strip, stop }) => { strip.style.transform = `translateY(${stripY(stop)}%)`; });
    }
  }

  function init() {
    wireLinks();
    const days = founding();
    const menuApi = menu();
    anchors(menuApi);
    navState();
    faq();
    forms();

    const canAnimate = !reduceMotion && window.gsap && window.ScrollTrigger && root.classList.contains('js');
    if (canAnimate) {
      try {
        motion(days);
        motionOn = true;
      } catch (err) {
        console.error(err);
        staticPage(days);
      }
    } else {
      staticPage(days);
    }
    root.classList.add('is-ready');
    landOnHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
