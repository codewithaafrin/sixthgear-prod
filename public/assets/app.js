/* Sixth Gear: site interactions (vanilla JS, no dependencies).
   All content is in the HTML; this file only adds motion and behaviour.
   - Hero: gear-shift intro (headline widens 1→6), rev band tachometer, cursor throttle
   - Logo knob and final-section gear gate
   - Cursor ember glow, card spotlight
   - Scroll reveals + odometer numbers (replay every visit)
   - Resources dropdown, lead form, workshop form, "book a call" fallback popups
*/
(function () {
  'use strict';

  var LEADS_EMAIL = 'aswin@codevantage.io';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var E = {};
  $$('[data-ref]').forEach(function (el) { E[el.getAttribute('data-ref')] = el; });
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- gear gate geometry ---------------- */
  var V = [[10,6],[10,32],[10,58],[10,32],[50,32],[50,6],[50,32],[50,58],[50,32],[90,32],[90,6],[90,32],[90,58]];
  var L = [0];
  for (var i = 1; i < V.length; i++) L.push(L[i-1] + Math.abs(V[i][0]-V[i-1][0]) + Math.abs(V[i][1]-V[i-1][1]));
  var STOPS = [0,2,5,7,10,12];
  function ease(u) { return u < .5 ? 4*u*u*u : 1 - Math.pow(-2*u + 2, 3) / 2; }
  function gate(gt) {
    if (gt <= 0) return { x: V[0][0], y: V[0][1], s: 0 };
    if (gt >= 5) return { x: V[12][0], y: V[12][1], s: L[12] };
    var k = Math.floor(gt), f = ease(gt - k);
    var s = L[STOPS[k]] + (L[STOPS[k+1]] - L[STOPS[k]]) * f;
    for (var j = 1; j < V.length; j++) {
      if (s <= L[j]) {
        var t = (s - L[j-1]) / Math.max(1e-6, L[j] - L[j-1]);
        return { x: V[j-1][0] + (V[j][0]-V[j-1][0]) * t, y: V[j-1][1] + (V[j][1]-V[j-1][1]) * t, s: s };
      }
    }
    return { x: V[12][0], y: V[12][1], s: L[12] };
  }
  function setGate(knob, trail, halo, gt) {
    var p = gate(gt);
    if (knob) { knob.setAttribute('cx', p.x.toFixed(2)); knob.setAttribute('cy', p.y.toFixed(2)); }
    if (halo) { halo.setAttribute('cx', p.x.toFixed(2)); halo.setAttribute('cy', p.y.toFixed(2)); }
    if (trail) trail.setAttribute('stroke-dasharray', p.s.toFixed(2) + ' 400');
  }

  /* ---------------- hero headline + gear readout ---------------- */
  var GEAR_WORDS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];
  var gear = 1, logoGT = 0, logoTarget = 0;
  function vs(g) {
    var w = E.kinWrap ? E.kinWrap.clientWidth : 1200;
    var W = w >= 700 ? [60,76,92,108,122,136] : [56,68,80,92,104,114];
    var Wt = [360,400,440,480,520,560];
    return "'wdth' " + W[g-1] + ", 'wght' " + Wt[g-1];
  }
  function setGear(g) {
    gear = g;
    if (E.kin) E.kin.style.fontVariationSettings = vs(g);
    if (E.gearNum) E.gearNum.textContent = GEAR_WORDS[g-1];
    for (var q = 1; q <= 6; q++) { var seg = E['rv' + q]; if (seg) seg.style.opacity = q <= g ? '1' : '.18'; }
    logoTarget = g - 1;
  }
  function fit() {
    var k = E.kin, w = E.kinWrap;
    if (!k || !w) return;
    var prevT = k.style.transition, prevV = k.style.fontVariationSettings;
    k.style.transition = 'none';
    k.style.setProperty('--kfit', '1');
    k.style.fontVariationSettings = vs(6);
    var nat = k.getBoundingClientRect().width, avail = w.clientWidth * 0.97;
    if (nat > avail && nat > 0) k.style.setProperty('--kfit', (avail / nat).toFixed(4));
    k.style.fontVariationSettings = prevV || vs(gear);
    void k.offsetWidth;
    k.style.transition = prevT;
  }

  /* ---------------- rev band (canvas tachometer) ---------------- */
  var ctx = null, bw = 0, bh = 0, r = 0.8, heroVis = true;
  function resize() {
    if (!E.band || !E.bandWrap) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    bw = E.bandWrap.clientWidth; bh = E.bandWrap.clientHeight;
    E.band.width = Math.round(bw * dpr); E.band.height = Math.round(bh * dpr);
    ctx = E.band.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
    draw();
  }
  function draw() {
    var c = ctx; if (!c) return;
    var w = bw, h = bh;
    c.clearRect(0, 0, w, h);
    var N = Math.max(36, Math.min(150, Math.round(w / 9)));
    var step = w / N, barW = Math.max(1.5, step * 0.36);
    var base = h - 24, maxH = base - 6, minH = maxH * 0.16;
    var rp = r / 8 * (N - 1), lead = Math.floor(rp);
    for (var n = 0; n < N; n++) {
      var v = n / (N - 1) * 8, red = v >= 6.5;
      var barH = minH + (maxH - minH) * Math.pow(n / (N - 1), 1.35);
      var x = n * step + (step - barW) / 2;
      if (n === lead) {
        c.shadowColor = '#fe7802'; c.shadowBlur = 16; c.fillStyle = '#ffaf38'; c.globalAlpha = 1;
        c.fillRect(x - 0.5, base - barH - 8, barW + 1, barH + 8); c.shadowBlur = 0;
      } else if (n < rp) {
        if (red) { c.fillStyle = '#fe7802'; c.globalAlpha = 1; }
        else { c.fillStyle = '#f2ece4'; c.globalAlpha = 0.16 + 0.7 * Math.pow(n / Math.max(rp, 1), 2.2); }
        c.fillRect(x, base - barH, barW, barH);
      } else {
        c.fillStyle = red ? '#fe7802' : '#f2ece4'; c.globalAlpha = red ? 0.2 : 0.075;
        c.fillRect(x, base - barH, barW, barH);
      }
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(242,236,228,.12)'; c.fillRect(0, base + 4, w, 1);
    c.font = '500 10px "Martian Mono", ui-monospace, monospace'; c.textBaseline = 'top';
    for (var k = 0; k <= 8; k++) {
      var tx = (k / 8) * (N - 1) * step + step / 2;
      c.textAlign = k === 0 ? 'left' : (k === 8 ? 'right' : 'center');
      c.fillStyle = k >= 7 ? 'rgba(254,120,2,.85)' : 'rgba(242,236,228,.36)';
      c.fillText(String(k), k === 0 ? 0 : (k === 8 ? w : tx), base + 10);
    }
  }

  /* ---------------- intro timeline ---------------- */
  var intro = !reduced, introDone = !intro, t0 = null;
  var SEGS = [
    { g: 1, a: 0.8, b: 6.9, d: 1050 }, { g: 2, a: 3.7, b: 6.9, d: 640 }, { g: 3, a: 4.3, b: 6.9, d: 590 },
    { g: 4, a: 4.8, b: 6.9, d: 550 }, { g: 5, a: 5.2, b: 6.9, d: 520 }, { g: 6, a: 5.5, b: 2.2, d: 1500, out: true }
  ];
  if (intro) setGear(1); else { setGear(6); r = 2.2; logoGT = logoTarget = 5; }
  setGate(E.logoKnob, E.logoTrail, null, logoGT);
  setGate(E.gateKnob, E.gateTrail, E.gateHalo, 0);
  function startIntro() { if (intro && t0 == null) { fit(); t0 = performance.now() + 380; } }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); startIntro(); });
  setTimeout(startIntro, 1600);

  /* ---------------- pointer: ember glow + throttle ---------------- */
  var glow = { x: 0, y: 0, tx: 0, ty: 0, on: false }, hover = false, throttle = 0.2;
  window.addEventListener('pointermove', function (e) {
    if (!E.root) return;
    var rr = E.root.getBoundingClientRect();
    glow.tx = e.clientX - rr.left; glow.ty = e.clientY - rr.top;
    if (!glow.on && e.pointerType !== 'touch') { glow.on = true; glow.x = glow.tx; glow.y = glow.ty; if (E.glow) E.glow.style.opacity = '1'; }
    if (E.hero && E.bandWrap) {
      var hr = E.hero.getBoundingClientRect(), br = E.bandWrap.getBoundingClientRect();
      var inside = e.clientY >= hr.top && e.clientY <= hr.bottom && e.clientX >= hr.left && e.clientX <= hr.right;
      hover = inside && introDone && !reduced;
      if (inside) throttle = Math.max(0, Math.min(1, (e.clientX - br.left) / Math.max(1, br.width)));
    }
  }, { passive: true });
  document.addEventListener('pointerout', function (e) {
    if (!e.relatedTarget) { hover = false; glow.on = false; if (E.glow) E.glow.style.opacity = '0'; }
  });

  /* ---------------- final-section gear gate ---------------- */
  var gateGT = 0, gateTarget = 0, gateArmed = false, gateLit = -1, gateDrawn = false;

  /* ---------------- animation loop ---------------- */
  var lastT = 0, lastRpm = -1;
  function frame(t) {
    var dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    if (intro && !introDone) {
      if (t0 == null || t < t0) r = 0.8 + Math.sin(t / 300) * 0.04;
      else {
        var el = t - t0, acc = 0, done = true;
        for (var s = 0; s < SEGS.length; s++) {
          var sg = SEGS[s];
          if (el < acc + sg.d) {
            var u = (el - acc) / sg.d;
            var e = sg.out ? 1 - Math.pow(1 - u, 3) : Math.pow(u, 0.9);
            r = sg.a + (sg.b - sg.a) * e;
            if (gear !== sg.g) setGear(sg.g);
            done = false; break;
          }
          acc += sg.d;
        }
        if (done) { introDone = true; r = 2.2; if (gear !== 6) setGear(6); }
      }
    } else {
      var target = hover ? 0.9 + throttle * 6.95 : 2.2 + Math.sin(t / 650) * 0.05 + Math.sin(t / 233) * 0.025;
      r += (target - r) * Math.min(1, dt * 4.2);
      if (r > 7.55) r = 7.55 - Math.random() * 0.22;
    }
    if (E.heat) E.heat.style.opacity = (0.2 + Math.pow(r / 8, 1.8) * 0.85).toFixed(3);
    if (heroVis) draw();

    var d = logoTarget - logoGT;
    if (Math.abs(d) > 0.0005) { logoGT += Math.sign(d) * Math.min(Math.abs(d), dt * 3.2); setGate(E.logoKnob, E.logoTrail, null, logoGT); }

    if (gateArmed) {
      var d2 = gateTarget - gateGT;
      if (Math.abs(d2) > 0.0005 || !gateDrawn) {
        gateGT += Math.sign(d2) * Math.min(Math.abs(d2), dt * 1.9);
        setGate(E.gateKnob, E.gateTrail, E.gateHalo, gateGT);
        gateDrawn = true;
        var near = Math.round(gateGT), on = Math.abs(gateGT - near) < 0.06 ? near + 1 : 0;
        if (on !== gateLit) {
          gateLit = on;
          for (var n = 1; n <= 6; n++) {
            var lab = E['gl' + n]; if (!lab) continue;
            lab.setAttribute('fill', n === on ? '#ffaf38' : '#f2ece4');
            lab.setAttribute('fill-opacity', n === on ? '1' : '.3');
          }
        }
      }
    }
    if (E.glow && glow.on) {
      glow.x += (glow.tx - glow.x) * Math.min(1, dt * 9);
      glow.y += (glow.ty - glow.y) * Math.min(1, dt * 9);
      E.glow.style.transform = 'translate3d(' + (glow.x - 320).toFixed(1) + 'px,' + (glow.y - 320).toFixed(1) + 'px,0)';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (window.ResizeObserver && E.bandWrap) new ResizeObserver(resize).observe(E.bandWrap);
  window.addEventListener('resize', resize);
  resize();

  /* ---------------- odometer columns (HTML holds the plain number; we build the roll) ---------------- */
  if (!reduced) {
    $$('.sg-odo').forEach(function (el) {
      var num = el.getAttribute('data-odo'), dur = el.getAttribute('data-dur') || '2', base = +el.getAttribute('data-base') || 0;
      el.setAttribute('aria-label', num);
      el.textContent = '';
      el.style.display = 'inline-flex';
      num.split('').forEach(function (ch, i) {
        var d = parseInt(ch, 10);
        var col = document.createElement('span');
        col.setAttribute('aria-hidden', 'true');
        col.style.cssText = 'display:inline-block;height:1em;overflow:hidden';
        var strip = document.createElement('span');
        strip.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translateY(calc(var(--odo, 0) * -' + (10 + d) + 'em));transition:transform ' + dur + 's cubic-bezier(.16,1,.3,1) ' + (base + i * 140) + 'ms';
        for (var k = 0; k < 20; k++) {
          var n = document.createElement('span');
          n.style.cssText = 'display:block;height:1em;line-height:1';
          n.textContent = String(k % 10);
          strip.appendChild(n);
        }
        col.appendChild(strip);
        el.appendChild(col);
      });
    });
  }

  /* ---------------- scroll reveals + odometers ---------------- */
  function reveal(k, on) {
    if (k === 'proof' && E.proof) E.proof.classList.toggle('on', on || E.proof.classList.contains('on'));
    if (k === 'stats' && E.stats) { E.stats.classList.add('on'); E.stats.style.setProperty('--odo', on ? '1' : '0'); }
    if (k === 'work' && E.work && on) E.work.classList.add('on');
    if (k === 'cards' && E.cards) E.cards.style.setProperty('--odo', on ? '1' : '0');
    if (k === 'go' && on && !gateArmed) { gateGT = 0; gateTarget = 5; gateArmed = true; }
  }
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var k = en.target.getAttribute('data-k');
        if (en.isIntersecting) reveal(k, true);
        else if (k === 'stats' || k === 'cards') reveal(k, false); // reset so numbers roll again next visit
      });
    }, { threshold: 0.2 });
    // The film is clipped to zero width until revealed, so observe its (unclipped) parent row instead.
    var proofTarget = E.proof && E.proof.parentElement;
    if (proofTarget) { E.proof.removeAttribute('data-k'); proofTarget.setAttribute('data-k', 'proof'); io.observe(proofTarget); }
    ['stats', 'work', 'cards', 'go'].forEach(function (k) { if (E[k]) io.observe(E[k]); });
    if (E.hero) new IntersectionObserver(function (en) { heroVis = en[0].isIntersecting; }, { threshold: 0 }).observe(E.hero);
  } else {
    ['proof', 'stats', 'work', 'cards', 'go'].forEach(function (k) { reveal(k, true); });
  }

  /* ---------------- forms ---------------- */
  function errors(f, withNeeds) {
    var e = {};
    var n = (f.name || '').trim();
    if (!n) e.name = 'Please enter your name.';
    else if (n.length < 2) e.name = 'That looks too short. Please enter your full name.';
    else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'’-]*$/.test(n)) e.name = 'Please use letters only.';
    var m = (f.email || '').trim().toLowerCase();
    if (!m) e.email = 'Please enter your email.';
    else if (m.length > 254 || !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/.test(m) || /\.\./.test(m) || /^\.|\.@/.test(m)) e.email = 'Enter a valid email, like you@company.com.';
    var c = (f.company || '').trim();
    if (!c) e.company = 'Please enter your company name.';
    else if (c.length < 2) e.company = 'That looks too short.';
    if (withNeeds) {
      var d = (f.needs || '').trim();
      if (!d) e.needs = 'Tell us what you’d like to solve.';
      else if (d.length < 20) e.needs = 'A little more detail helps us prepare (at least 20 characters).';
    }
    return e;
  }
  var FORMS = {
    form: { fields: { name: 'fName', email: 'fEmail', company: 'fCompany', needs: 'fNeeds' }, err: { name: 'sg-e-name', email: 'sg-e-email', company: 'sg-e-company', needs: 'sg-e-needs' }, needs: true, touched: {}, tried: false },
    ws: { fields: { name: 'wName', company: 'wCompany', email: 'wEmail' }, err: { name: 'sg-we-name', company: 'sg-we-company', email: 'sg-we-email' }, needs: false, touched: {}, tried: false }
  };
  function values(kind) {
    var F = FORMS[kind], v = {};
    Object.keys(F.fields).forEach(function (k) { var el = E[F.fields[k]]; v[k] = el ? el.value : ''; });
    return v;
  }
  function paint(kind) {
    var F = FORMS[kind], v = values(kind), er = errors(v, F.needs);
    Object.keys(F.fields).forEach(function (k) {
      var show = (F.tried || F.touched[k]) && er[k];
      var el = E[F.fields[k]], msg = document.getElementById(F.err[k]);
      if (el) { el.setAttribute('aria-invalid', show ? 'true' : 'false'); el.style.borderColor = show ? '#ff6b57' : ''; }
      if (msg) msg.textContent = show ? er[k] : '';
    });
    if (kind === 'form') { var cnt = $('[data-bind="needsCount"]'); if (cnt) cnt.textContent = String(v.needs.length); }
    return er;
  }
  function mailto(subject, body) {
    return 'mailto:' + LEADS_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function submit(kind) {
    var F = FORMS[kind], v = values(kind), er = errors(v, F.needs);
    var first = Object.keys(F.fields).filter(function (k) { return er[k]; })[0];
    if (first) { F.tried = true; paint(kind); var el = E[F.fields[first]]; if (el) el.focus(); return; }
    var name = v.name.trim(), firstName = name.split(/\s+/)[0] || 'there', href;
    if (kind === 'form') {
      href = mailto('Sixth Gear enquiry: ' + v.company.trim() + ' (' + name + ')',
        'Name: ' + name + '\nEmail: ' + v.email.trim() + '\nCompany: ' + v.company.trim() + '\n\nWhat specific needs are you looking to solve?\n' + v.needs.trim() + '\n');
      $$('[data-bind="formFirst"]').forEach(function (s) { s.textContent = firstName; });
      openModal('done');
    } else {
      href = mailto('Worksheet request: ' + v.company.trim() + ' (' + name + ')',
        'Please email me a copy of the Sixth Gear workshop worksheet.\n\nName: ' + name + '\nCompany: ' + v.company.trim() + '\nEmail: ' + v.email.trim() + '\n');
      $$('[data-bind="wsFirst"]').forEach(function (s) { s.textContent = firstName; });
      $$('[data-bind="wsEmail"]').forEach(function (s) { s.textContent = v.email.trim(); });
      var fv = $('[data-ws-view="form"]'), dv = $('[data-ws-view="done"]');
      if (fv) fv.hidden = true; if (dv) dv.hidden = false;
      if (E.wsDone) E.wsDone.focus();
    }
    // Production tip: replace this with a POST to your form service (Formspree, FormSubmit, HubSpot…).
    try { window.dispatchEvent(new CustomEvent('sixthgear:' + (kind === 'form' ? 'lead' : 'worksheet'), { detail: v })); } catch (x) {}
    setTimeout(function () { window.location.href = href; }, 150);
  }

  /* ---------------- modals ---------------- */
  var current = null, opener = null;
  function openModal(name) {
    $$('[data-modal]').forEach(function (m) { m.hidden = m.getAttribute('data-modal') !== name; });
    current = name;
    document.documentElement.style.overflow = 'hidden';
    var target = name === 'form' ? E.fName : name === 'book' ? E.bookBtn : name === 'done' ? E.doneBtn : name === 'ws' ? E.wName : null;
    if (target) setTimeout(function () { target.focus(); }, 60);
  }
  function closeModal(next) {
    if (next) return openModal(next);
    $$('[data-modal]').forEach(function (m) { m.hidden = true; });
    current = null;
    document.documentElement.style.overflow = '';
    if (opener && opener.focus) { var o = opener; setTimeout(function () { o.focus(); }, 30); }
  }
  function resetForm(kind) {
    var F = FORMS[kind]; F.touched = {}; F.tried = false;
    Object.keys(F.fields).forEach(function (k) { var el = E[F.fields[k]]; if (el) el.value = ''; });
    paint(kind);
  }
  // Leaving the lead form without submitting offers a call with the founder instead.
  function dismiss() { closeModal(current === 'form' ? 'book' : null); }

  /* ---------------- resources menu ---------------- */
  var menu = $('.sg-menu'), menuBtn = $('.sg-dd button');
  function setMenu(open) {
    if (menu) menu.classList.toggle('open', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  document.addEventListener('click', function (e) { if (menu && !e.target.closest('.sg-dd')) setMenu(false); });

  /* ---------------- action table ---------------- */
  var A = {
    'form.open': function (e) { e.preventDefault(); opener = document.activeElement; resetForm('form'); openModal('form'); },
    'form.close': function () { dismiss(); },
    'form.backdrop': function (e) { if (e.target === e.currentTarget) dismiss(); },
    'form.keydown': function (e) { if (e.key === 'Escape') { e.stopPropagation(); dismiss(); } },
    'form.booked': function () { closeModal(null); },
    'form.submit': function (e) { e.preventDefault(); submit('form'); },
    'form.enter': function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit('form'); } },
    'ws.open': function (e) {
      e.preventDefault(); opener = document.activeElement; resetForm('ws');
      var fv = $('[data-ws-view="form"]'), dv = $('[data-ws-view="done"]'); if (fv) fv.hidden = false; if (dv) dv.hidden = true;
      openModal('ws');
    },
    'ws.close': function () { closeModal(null); },
    'ws.backdrop': function (e) { if (e.target === e.currentTarget) closeModal(null); },
    'ws.keydown': function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeModal(null); } },
    'ws.submit': function (e) { e.preventDefault(); submit('ws'); },
    'ws.enter': function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit('ws'); } },
    'res.toggle': function () { setMenu(!(menu && menu.classList.contains('open'))); },
    'res.close': function () { setMenu(false); if (document.activeElement) document.activeElement.blur(); },
    'res.toCases': function (e) {
      e.preventDefault(); setMenu(false); if (document.activeElement) document.activeElement.blur();
      if (E.workSec) E.workSec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#work');
    },
    'toFirst': function () { if (gateArmed) gateTarget = 0; },
    'toSixth': function () { if (gateArmed) gateTarget = 5; },
    'cardMove': function (e) {
      var el = e.currentTarget, rc = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - rc.left) + 'px');
      el.style.setProperty('--my', (e.clientY - rc.top) + 'px');
    }
  };
  ['form', 'ws'].forEach(function (kind) {
    Object.keys(FORMS[kind].fields).forEach(function (k) {
      A[kind + '.set.' + k] = function () { paint(kind); };
      A[kind + '.blur.' + k] = function (e) { if (e.target.value.trim()) { FORMS[kind].touched[k] = true; paint(kind); } };
    });
  });
  var EVENT = { change: 'input', click: 'click', keydown: 'keydown', submit: 'submit', blur: 'blur', focus: 'focus', pointermove: 'pointermove', pointerenter: 'pointerenter', pointerleave: 'pointerleave' };
  Object.keys(EVENT).forEach(function (attr) {
    $$('[data-on-' + attr + ']').forEach(function (el) {
      var fn = A[el.getAttribute('data-on-' + attr)];
      if (fn) el.addEventListener(EVENT[attr], fn);
    });
  });
})();
