/* Your Dealership · demo by AutoUpscale
   One owner of time: the stage director. Native scroll, transform and opacity only, no blur in motion. */
(() => {
  'use strict';
  const D = document, H = D.documentElement, W = window;
  const $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
  const CFG = JSON.parse($('#cfg')?.textContent || '{}');
  const CENAS = JSON.parse($('#scenes')?.textContent || '{}');
  const RMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const FINO = matchMedia('(hover: hover) and (pointer: fine)');
  const calma = () => H.classList.contains('sem-movimento');
  const flashes = () => !RMQ.matches && !calma();
  const E = 'cubic-bezier(.16,1,.3,1)', EIN = 'cubic-bezier(.7,0,.84,0)', EIO = 'cubic-bezier(.76,0,.24,1)';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const retrato = () => innerHeight > innerWidth;
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

  /* ---------- first gesture (videos wait for it) ---------- */
  let gesto = false; const aoGesto = [];
  const marcaGesto = () => { if (gesto) return; gesto = true; aoGesto.splice(0).forEach((f) => f()); };
  ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach((ev) => addEventListener(ev, marcaGesto, { passive: true }));
  addEventListener('scroll', () => { if (scrollY > 8) marcaGesto(); }, { passive: true });

  /* ---------- the intro: the logo assembles over the drone film and flies to the header with the dive ---------- */
  const depoisIntro = [];
  function intro() {
    if (!H.classList.contains('abre')) { H.classList.add('aberto'); return; }
    if (scrollY) scrollTo(0, 0);
    const raiz = $('.yd-abertura');
    let feito = false, voou = false, raf = 0;
    const fim = () => {
      if (feito) return; feito = true; cancelAnimationFrame(raf);
      H.classList.remove('abre', 'voa', 'yd-go'); H.classList.add('aberto');
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => removeEventListener(ev, fim));
      depoisIntro.splice(0).forEach((f) => f());
    };
    if (!raiz) { fim(); return; }
    // the name's letters are born spread from the centre, like a name tightening its tracking
    const letras = $$('.yd-a-nome .yd-letra', raiz), meio = (letras.length - 1) / 2;
    letras.forEach((l, k) => { l.style.setProperty('--x', `${(k - meio) * 9}px`); l.style.setProperty('--d', Math.abs(k - meio).toFixed(1)); });
    // FLIP: each piece flies from the middle of the screen to its twin in the header
    const voar = (de, para, atraso) => {
      const a = de.getBoundingClientRect(), b = para.getBoundingClientRect();
      if (!a.width || !b.width) return null;
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      return de.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${b.width / a.width})` }], { duration: 760, delay: atraso, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'forwards' });
    };
    const voa = () => {
      if (voou || feito) return; voou = true;
      H.classList.add('voa');
      const mono = $('.yd-a-mono', raiz), nome = $('.yd-a-nome', raiz), tag = $('.yd-a-tag', raiz);
      const cm = $('.cab-marca .yd-c-mono'), cn = $('.cab-marca .yd-c-nome');
      tag?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      const a1 = cm && voar(mono, cm, 0), a2 = cn && voar(nome, cn, 40), ult = a2 || a1;
      if (!ult) { fim(); return; }
      ult.onfinish = () => { cm.style.opacity = cn.style.opacity = '1'; mono.style.visibility = nome.style.visibility = 'hidden'; setTimeout(fim, 450); };
    };
    // the logo is cut to the hero film's beats (120 BPM, 0.5 s): it starts with the film (or on its own after 0.9 s,
    // if the film is late) and leaves on the downbeat at 2 s, the white flash and the first fast cut
    const t0 = window.__yd0 || 0, CORTE = 1.98;
    let go = 0;
    const espera = () => {
      const agora = performance.now(), t = agora - t0, v = SC.get(cenaDe(0))?.video;
      const filme = v && v.classList.contains('toca') && !v.paused;
      if (!go && (filme || t >= 900)) { go = agora; H.classList.add('yd-go'); }
      const tg = go ? agora - go : 0;
      if (t >= 4500 || (go && tg >= 1950 && (!filme || v.currentTime >= CORTE))) voa(); else raf = requestAnimationFrame(espera);
    };
    raf = requestAnimationFrame(espera);
    // nobody is held: any wheel, touch or key lands the intro at its end state
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, fim, { passive: true }));
    setTimeout(fim, 6000);
  }

  /* ---------- media choice ---------- */
  function escolhe(lista, port = retrato(), leve = false) {
    if (!lista || !lista.length) return null;
    const dpr = Math.min(devicePixelRatio || 1, 3) / (leve ? 1.25 : 1);
    let alvo;
    if (port) alvo = innerHeight * dpr >= 2400 ? 1440 : innerWidth * dpr >= 800 ? 1080 : 720;
    else { const px = innerWidth * dpr; alvo = px >= 2600 ? 3840 : px >= 1700 ? 2560 : px >= 1100 ? 1920 : 1280; }
    const asc = [...lista].sort((a, b) => a[0] - b[0]);
    let pick = asc[0];
    for (const it of asc) if (it[0] <= alvo) pick = it;
    return pick[1];
  }

  /* ---------- the stage ---------- */
  const stage = $('#stage');
  const cenasEl = stage && $('.cenas', stage);
  const mt = stage && $('.matte.top', stage), mb = stage && $('.matte.bottom', stage), veu = stage && $('.veu-palco', stage);
  const strips = stage ? $$('.strips i', stage) : [];
  // the whip-pan streaks and the burn bloom are decorative: created at the first gesture, never in the first paint
  let streak = null, burn = null;
  const camadas = () => {
    if (!stage || streak) return;
    const mk = (cls, src, w, h) => { const i = new Image(w, h); i.className = cls; i.alt = ''; i.decoding = 'async'; i.src = src; i.setAttribute('aria-hidden', 'true'); stage.insertBefore(i, $('.grain', stage)); return i; };
    streak = mk('streak', CFG.streak, 1024, 256); burn = mk('burn', CFG.burn, 512, 512);
  };
  const monoCab = $('.cab-marca .yd-c-mono');
  const SC = new Map();

  function novaImg(cls) { const i = new Image(); i.alt = ''; i.decoding = 'async'; if (cls) i.className = cls; return i; }
  function poe(img, url) { if (url && img.getAttribute('src') !== url) img.src = url; }
  const decod = (img) => (img.getAttribute('src') ? (img.decode ? img.decode().catch(() => {}) : Promise.resolve()) : Promise.resolve());

  function cria(id) {
    if (SC.has(id)) return SC.get(id);
    const def = CENAS[id]; if (!def) return null;
    const el = D.createElement('div');
    el.className = `sc ${def.k}`; el.dataset.id = id;
    const s = { id, def, el, imgs: [], carregada: false };
    if (def.k === 'img' || def.k === 'lantern') {
      s.ph = novaImg('ph'); s.ph.style.objectPosition = retrato() ? def.posP || '50% 50%' : def.pos || '50% 50%'; el.append(s.ph); s.imgs.push(s.ph);
      if (def.k === 'lantern') { s.lamp = novaImg('lamp'); s.lamp.src = def.lamp; el.append(s.lamp); }
    } else if (def.k === 'video') {
      s.ph = novaImg('ph'); el.append(s.ph); s.imgs.push(s.ph);
      const v = D.createElement('video'); v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.disablePictureInPicture = true;
      v.addEventListener('playing', () => v.classList.add('toca'));
      v.addEventListener('canplay', () => tocaSe(s));
      el.append(v); s.video = v;
    } else if (def.k === 'film') {
      const shots = def.shots.filter((x) => !retrato() || x.P);
      const caixa = D.createElement('div'); caixa.className = 'shots'; el.append(caixa);
      s.shots = shots.map((x, k) => {
        const d = D.createElement('div'); d.className = `shot ${x.cam}`;
        d.style.setProperty('--cam', x.cam); d.style.setProperty('--o', { c1: '30% 45%', c2: '50% 0%', c3: '50% 50%', c4: '50% 60%', c5: '40% 55%' }[x.cam]);
        const im = novaImg(); d.append(im); caixa.append(d);
        return { def: x, el: d, img: im, k };
      });
      s.imgs = s.shots.map((x) => x.img);
    } else if (def.k === 'light') {
      const g = novaImg('glow'); g.src = def.glow; el.append(g);
    }
    if (def.veil > 0) { const v = D.createElement('i'); v.className = 'veil'; el.style.setProperty('--v', def.veil); el.append(v); }
    if (def.grad) { const g = D.createElement('i'); g.className = `grad ${def.grad}`; el.append(g); }
    cenasEl.append(el);
    SC.set(id, s);
    laços.forEach((l) => l.cena === id && l.agora());
    return s;
  }

  function carrega(s) {
    if (!s) return Promise.resolve();
    const d = s.def, port = retrato();
    if (s.carregada === port && s.pronta) return s.pronta;
    s.carregada = port;
    if (d.k === 'img' || d.k === 'lantern') poe(s.ph, escolhe(port ? d.P || d.L : d.L, port));
    else if (d.k === 'video') poe(s.ph, escolhe(port ? d.posterP : d.posterL, port));
    else if (d.k === 'film') { s.shots.slice(0, 2).forEach((x) => poe(x.img, escolhe(port ? x.def.P : x.def.L, port))); }
    const alvo = d.k === 'film' ? [s.shots[0].img] : s.imgs;
    s.pronta = Promise.all(alvo.map(decod)).then(() => true);
    return s.pronta;
  }
  function solta(s) {
    if (!s || s.id === cenaAtual) return;
    s.imgs.forEach((i) => i.removeAttribute('src'));
    if (s.video) { s.video.pause(); s.video.classList.remove('toca'); if (s.video.getAttribute('src')) { s.video.removeAttribute('src'); s.video.load(); } }
    s.carregada = false; s.pronta = null;
  }
  const pronta = (s, ms) => Promise.race([carrega(s).then(() => true), sleep(ms).then(() => false)]);

  /* videos: fetched only after the first gesture and when their block is within one screen */
  const perto = new Set();
  // the hero film (cedo) is fetched once the page has loaded AND its main paint is on screen (the LCP entry), so it
  // never queues in front of the title; without the LCP API (older Safari), two frames after load
  let carregou = D.readyState === 'complete', pintou = false;
  const lcpApi = !!window.PerformanceObserver && (PerformanceObserver.supportedEntryTypes || []).includes('largest-contentful-paint');
  if (lcpApi) new PerformanceObserver((l, o) => { o.disconnect(); pintou = true; SC.forEach(videoSrc); }).observe({ type: 'largest-contentful-paint', buffered: true });
  const depoisDeCarregar = () => { carregou = true; requestAnimationFrame(() => requestAnimationFrame(() => { if (!lcpApi) pintou = true; SC.forEach(videoSrc); })); };
  if (carregou) depoisDeCarregar(); else addEventListener('load', depoisDeCarregar, { once: true });
  function videoSrc(s) {
    if (!s?.video || (!gesto && !(s.def.cedo && carregou && pintou)) || !perto.has(s.id) || calma()) return;
    const url = escolhe(retrato() ? s.def.P : s.def.L, retrato(), !!s.def.cedo);
    if (s.video.getAttribute('src') !== url) { s.video.src = url; s.video.load(); }
    tocaSe(s);
  }
  function tocaSe(s) {
    const v = s?.video; if (!v || !v.getAttribute('src')) return;
    if (s.id === cenaAtual && !D.hidden && !calma()) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
  }
  aoGesto.push(() => SC.forEach(videoSrc), () => camadas());
  addEventListener('pageshow', () => SC.forEach(tocaSe));
  D.addEventListener('visibilitychange', () => { SC.forEach(tocaSe); film.pausa(D.hidden); });

  /* ---------- the film of the house (stills with camera moves) ---------- */
  const film = {
    s: null, k: -1, t: 0, on: false,
    liga(s) { this.s = s; if (this.on) return; this.on = true; if (this.k < 0) this.mostra(0, true); this.agenda(); },
    desliga() { this.on = false; clearTimeout(this.t); },
    pausa(h) { if (h) clearTimeout(this.t); else if (this.on) this.agenda(); },
    agenda() { clearTimeout(this.t); if (!this.on || calma() || !this.s) return; this.t = setTimeout(() => this.proximo(), 6500); },
    proximo() {
      const s = this.s; if (!s || !this.on) return;
      const n = (this.k + 1) % s.shots.length;
      const nx = s.shots[n], port = retrato();
      poe(nx.img, escolhe(port ? nx.def.P : nx.def.L, port));
      decod(nx.img).then(() => { if (this.on) { this.mostra(n); const a = s.shots[(n + 1) % s.shots.length]; poe(a.img, escolhe(port ? a.def.P : a.def.L, port)); } this.agenda(); });
    },
    mostra(n, primeiro) {
      const s = this.s; const velho = s.shots[this.k], novo = s.shots[n];
      this.k = n;
      novo.el.style.zIndex = String(++this.z || (this.z = 1));
      novo.el.classList.remove('run'); void novo.el.offsetWidth;
      novo.el.classList.add('on', 'run');
      if (primeiro) { novo.el.style.transition = 'none'; void novo.el.offsetWidth; novo.el.style.transition = ''; }
      if (velho && velho !== novo) setTimeout(() => { if (this.k !== velho.k) velho.el.classList.remove('on', 'run'); }, 1000);
    },
  };

  /* ---------- the director ---------- */
  const blocos = $$('main [data-scene]');
  let atual = -1, cenaAtual = null, corrida = null;
  const cenaDe = (i) => blocos[i]?.dataset.scene;

  function gere(i) {
    const need = new Set();
    for (let j = i - 1; j <= i + 1; j++) { const c = cenaDe(j); if (c) need.add(c); }
    for (const id of need) carrega(cria(id));
    for (const [id, s] of SC) if (!need.has(id) && id !== cenaAtual) solta(s);
  }
  function mostraSo(id) {
    for (const [k, s] of SC) { s.el.classList.toggle('on', k === id); s.el.classList.remove('vem'); s.el.style.zIndex = ''; }
    const anterior = cenaAtual; cenaAtual = id;
    const s = SC.get(id);
    H.classList.toggle('claro', s?.def.tone === 'light');
    if (s?.def.k === 'film') film.liga(s); else film.desliga();
    SC.forEach(tocaSe);
    if (anterior !== id) laços.forEach((l) => l.cena === id && l.agora());
  }
  function pulso() { if (monoCab && !calma() && !H.classList.contains('abre')) monoCab.animate([{ opacity: 0.7 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' }); }

  // each cut is written from "upper scene shown" (0) to "lower scene shown" (1); going up plays it reversed
  const so = (o) => [{ opacity: 0 }, { opacity: 0, offset: o }, { opacity: 1, offset: o }, { opacity: 1 }];
  const CORTES = {
    crossfade: { dur: 300, f: (A, B) => [[B, [{ opacity: 0 }, { opacity: 1 }]]] },
    shutter: { dur: 940, f: (A, B) => {
      const m = [{ transform: 'scaleY(0)', easing: EIN }, { transform: 'scaleY(1)', offset: 0.45 }, { transform: 'scaleY(1)', offset: 0.5, easing: E }, { transform: 'scaleY(0)' }];
      return [[mt, m], [mb, m], [B, [{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 0, transform: 'scale(1.04)', offset: 0.47 }, { opacity: 1, transform: 'scale(1.04)', offset: 0.47, easing: E }, { opacity: 1, transform: 'scale(1)' }]]];
    } },
    beat: { dur: 720, f: (A, B) => {
      const m = [{ transform: 'scaleY(0)', easing: E }, { transform: 'scaleY(.17)', offset: 0.1, easing: E }, { transform: 'scaleY(0)' }];
      const r = [[B, [{ opacity: 0, transform: 'scale(1.07)' }, { opacity: 1, transform: 'scale(1.07)', offset: 0.02, easing: E }, { opacity: 1, transform: 'scale(1)' }]], [mt, m], [mb, m]];
      if (flashes()) strips.forEach((s, k) => r.push([s, [{ opacity: 0, transform: 'scaleY(0)' }, { opacity: 0.32, transform: 'scaleY(1)', offset: 0.05 + k * 0.012 }, { opacity: 0, transform: 'scaleY(1)', offset: 0.34 }, { opacity: 0, transform: 'scaleY(0)' }]]));
      return r;
    } },
    lightsout: { dur: 1300, f: (A, B) => [
      [veu, [{ opacity: 0 }, { opacity: 0, offset: 0.08 }, { opacity: 0.45, offset: 0.08 }, { opacity: 0.45, offset: 0.22 }, { opacity: 0.8, offset: 0.22 }, { opacity: 0.8, offset: 0.36 }, { opacity: 1, offset: 0.36 }, { opacity: 1, offset: 0.55, easing: E }, { opacity: 0 }]],
      [B, so(0.5)],
    ] },
    posterdrop: { dur: 920, f: (A, B) => [
      [B, [{ transform: 'translateY(-100%)', easing: EIN }, { transform: 'translateY(1.6%)', offset: 0.66, easing: E }, { transform: 'translateY(0)' }]],
      [A, [{ transform: 'translateY(0)', opacity: 1, easing: EIN }, { transform: 'translateY(5%)', opacity: 0.5, offset: 0.66, easing: E }, { transform: 'translateY(4%)', opacity: 0.4 }]],
    ] },
    whippan: { dur: 640, f: (A, B) => [
      [A, [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], EIO],
      [B, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], EIO],
      [streak, [{ visibility: 'visible', opacity: 0, transform: 'translateX(35%) scaleX(.6)' }, { visibility: 'visible', opacity: 0.85, transform: 'translateX(0) scaleX(1.25)', offset: 0.5 }, { visibility: 'visible', opacity: 0, transform: 'translateX(-35%) scaleX(.6)' }]],
    ] },
    frameslip: { dur: 780, f: (A, B) => [
      [A, [{ transform: 'translateY(0)', easing: EIN }, { transform: 'translateY(-104%)', offset: 0.6, easing: E }, { transform: 'translateY(-99%)', offset: 0.8 }, { transform: 'translateY(-100%)' }]],
      [B, [{ transform: 'translateY(100%)', easing: EIN }, { transform: 'translateY(-4%)', offset: 0.6, easing: E }, { transform: 'translateY(1%)', offset: 0.8 }, { transform: 'translateY(0)' }]],
    ] },
    burn: { dur: 1250, f: (A, B) => [
      [burn, [{ visibility: 'visible', opacity: 0, transform: 'scale(.2)', easing: EIN }, { visibility: 'visible', opacity: 1, transform: 'scale(2.6)', offset: 0.42 }, { visibility: 'visible', opacity: 1, transform: 'scale(4.4)', offset: 0.58, easing: E }, { visibility: 'visible', opacity: 0, transform: 'scale(5.2)' }]],
      [B, so(0.5)],
    ] },
    fade: { dur: 1100, f: (A, B) => [
      [veu, [{ opacity: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 1, offset: 0.55, easing: E }, { opacity: 0 }]],
      [B, so(0.5)],
    ] },
  };
  const CLASSE = { posterdrop: 'caindo', frameslip: 'fotograma' };

  function corte(nome, cimaId, baixoId, rev, forca) {
    let n = forca || nome;
    if (n === 'burn' && !flashes()) n = 'crossfade';
    if (calma()) n = 'crossfade';
    const spec = CORTES[n] || CORTES.crossfade;
    const A = SC.get(cimaId)?.el, B = SC.get(baixoId)?.el;
    const novoId = rev ? cimaId : baixoId;
    if (!A || !B) { mostraSo(novoId); return Promise.resolve(); }
    A.classList.add('vem'); B.classList.add('vem'); A.style.zIndex = '1'; B.style.zIndex = '2';
    if (CLASSE[n]) B.classList.add(CLASSE[n]);
    const tone = SC.get(novoId)?.def.tone === 'light';
    const tt = setTimeout(() => H.classList.toggle('claro', tone), spec.dur * 0.45);
    pulso();
    const anims = spec.f(A, B).filter(([el]) => el).map(([el, kf, easing]) => el.animate(kf, { duration: spec.dur, easing: easing || 'linear', fill: 'both', direction: rev ? 'reverse' : 'normal' }));
    const c = { anims, feito: false };
    c.limpa = () => {
      if (c.feito) return; c.feito = true; clearTimeout(tt);
      mostraSo(novoId);
      if (CLASSE[n]) B.classList.remove(CLASSE[n]);
      anims.forEach((a) => a.cancel());
      if (corrida === c) corrida = null;
    };
    c.acaba = () => { anims.forEach((a) => { try { a.finish(); } catch (e) { /* already done */ } }); c.limpa(); };
    corrida = c;
    return Promise.all(anims.map((a) => a.finished)).then(c.limpa, c.limpa);
  }

  async function ativa(i, modo) {
    if (i < 0 || i === atual) return;
    const prev = atual; atual = i;
    gere(i);
    blocos.forEach((b, j) => b.classList.toggle('ativo', j === i));
    aoBloco(blocos[i], prev);
    const alvo = cenaDe(i);
    if (alvo === cenaAtual && !corrida) return;
    if (corrida) corrida.acaba();
    if (alvo === cenaAtual) return;
    const s = SC.get(alvo);
    if (prev < 0 || modo === 'ja') { await pronta(s, 1500); if (atual === i) mostraSo(alvo); return; }
    const ok = await pronta(s, 250);
    if (atual !== i) return;
    const de = cenaAtual;
    if (!ok) { await carrega(s); if (atual !== i || cenaAtual !== de) return; return corte('crossfade', de, alvo, false); }
    if (corrida) corrida.acaba();
    if (modo === 'suave' || Math.abs(i - prev) >= 2) return corte('crossfade', cenaAtual, alvo, false);
    const desce = i > prev;
    const nome = desce ? blocos[i].dataset.cut : blocos[prev].dataset.cut;
    return desce ? corte(nome, cenaAtual, alvo, false) : corte(nome, alvo, cenaAtual, true);
  }

  function blocoNoCentro() {
    const y = innerHeight / 2; let best = 0;
    blocos.forEach((b, j) => { const r = b.getBoundingClientRect(); if (r.top <= y) best = j; });
    return best;
  }

  /* ---------- per block: marques (colour, hairline, town line, one glint) ---------- */
  function aoBloco(b) {
    if (b.classList.contains('nome')) glint(b);
  }
  function glint(li) {
    if (calma()) return;
    const g = $('.glint', li), gt = $('.gt', g), n = $('.nt', li);
    if (!g || !n) return;
    const w = n.getBoundingClientRect().width, gw = g.getBoundingClientRect().width || innerWidth * 0.14;
    const x0 = -gw * 1.3, x1 = w + gw * 0.3;
    g.getAnimations().forEach((a) => a.cancel()); gt.getAnimations().forEach((a) => a.cancel());
    g.classList.add('vai');
    const op = { duration: 1400, easing: EIO, fill: 'both', delay: 140 };
    g.style.transformOrigin = '0 0'; gt.style.transformOrigin = '0 0';
    const a = g.animate([{ transform: `translateX(${x0}px) skewX(-18deg)` }, { transform: `translateX(${x1}px) skewX(-18deg)` }], op);
    gt.animate([{ transform: `skewX(18deg) translateX(${-x0}px)` }, { transform: `skewX(18deg) translateX(${-x1}px)` }], op);
    a.finished.then(() => g.classList.remove('vai'), () => {});
  }

  /* ---------- scroll-bound loops: the lantern (S3) ---------- */
  const laços = [];
  function laco(sec, cena, fn) {
    const L = { sec, cena, p: 0, alvo: 0, raf: 0, vis: false };
    const prog = () => fn.prog(sec.getBoundingClientRect());
    const passo = () => {
      L.raf = 0;
      L.alvo = prog();
      L.p += (L.alvo - L.p) * 0.12;
      if (Math.abs(L.alvo - L.p) < 0.0005) L.p = L.alvo;
      fn.desenha(L.p, SC.get(cena));
      if (L.vis && !D.hidden && Math.abs(L.alvo - L.p) > 0) L.raf = requestAnimationFrame(passo);
    };
    L.agora = () => { L.p = L.alvo = prog(); fn.desenha(L.p, SC.get(cena)); };
    L.acorda = () => { if (!L.raf && L.vis && !D.hidden) L.raf = requestAnimationFrame(passo); };
    new IntersectionObserver((e) => { L.vis = e[0].isIntersecting; L.acorda(); }).observe(sec);
    addEventListener('scroll', L.acorda, { passive: true });
    laços.push(L);
    return L;
  }
  const lantern = $('[data-scene="lantern"]');
  if (lantern) {
    let mx = 0, my = 0, lx = 0, ly = 0;
    if (FINO.matches) addEventListener('pointermove', (e) => { mx = (e.clientX - innerWidth / 2) * 0.5; my = (e.clientY - innerHeight / 2) * 0.5; const l = laços.find((x) => x.sec === lantern); l?.acorda(); }, { passive: true });
    laco(lantern, 'lantern', {
      prog: (r) => clamp((innerHeight * 0.5 - r.top) / r.height, 0, 1),
      desenha(p, s) {
        if (!s?.lamp) return;
        if (calma()) { s.lamp.style.transform = 'scale(26)'; return; }
        // a pool of light that wanders with the visitor, then the whole room switches on near the end
        const e = p < 0.6 ? p / 0.6 : 1;
        const b0 = retrato() ? 0.62 : 1, b1 = retrato() ? 0.55 : 1.3;
        const sc = p < 0.6 ? b0 + b1 * e : b0 + b1 + 24 * Math.pow((p - 0.6) / 0.4, 2);
        const dx = retrato() ? 0 : mx * (1 - e), dy = retrato() ? (0.08 - 0.12 * e) * innerHeight : my * (1 - e);
        lx += (dx - lx) * 0.2; ly += (dy - ly) * 0.2;
        s.lamp.style.transform = `translate(${lx.toFixed(1)}px, ${ly.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      },
    });
  }

  /* ---------- the marques (S2): a camera over the silk travels from one marque to the next ----------
     Scroll (smoothed by the loop) drives one camera; each frame writes 5 transforms and nothing else.
     Plan: rest on 1, fly to 2, rest, fly to 3, rest. Mid-flight the camera pulls back a little, like a crane. */
  const viagem = $('[data-mc-viagem]');
  if (viagem) {
    const palco = $('.mc-palco', viagem), ests = $$('.mc-est', viagem), fundo = $('.mc-fundo', viagem), luzes = $$('.mc-luz', viagem);
    const nEl = $('[data-mc-n]', viagem), cta = $('.mc-acts [data-sheet]', viagem), tit = $('.mc-t', viagem);
    const POS = ests.map((e) => ({ l: e.dataset.l.split(',').map(Number), p: e.dataset.p.split(',').map(Number) }));
    const PLANO = [0.1, 0.43, 0.57, 0.9];
    const io3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let foco = -1;
    const limpa = () => { [...ests, fundo, ...luzes, tit].forEach((e) => { if (e) { e.style.transform = ''; e.style.opacity = ''; } }); };
    laco(viagem, 'black', {
      prog: (r) => clamp(-r.top / Math.max(1, r.height - palco.clientHeight), 0, 1),
      desenha(p) {
        if (calma()) { limpa(); return; }
        const k = retrato() ? 'p' : 'l', W = innerWidth, Hh = palco.clientHeight;
        let a = 0, t = 0;
        if (p > PLANO[0] && p < PLANO[1]) t = io3((p - PLANO[0]) / (PLANO[1] - PLANO[0]));
        else if (p >= PLANO[1] && p <= PLANO[2]) a = 1;
        else if (p > PLANO[2] && p < PLANO[3]) { a = 1; t = io3((p - PLANO[2]) / (PLANO[3] - PLANO[2])); } else if (p >= PLANO[3]) a = 2;
        const A = POS[a][k], B = POS[Math.min(a + 1, POS.length - 1)][k];
        const cx = A[2] + (B[2] - A[2]) * t, cy = A[3] + (B[3] - A[3]) * t;
        const z = 1 - 0.16 * Math.sin(Math.PI * t);
        ests.forEach((e, i) => {
          const [x, y, ex, ey] = POS[i][k];
          const f = clamp(1 - Math.hypot(cx - ex, cy - ey) / 0.75, 0, 1);
          const sx = W / 2 + (x - cx) * W * z, sy = Hh / 2 + (y - cy) * Hh * z;
          // focus is scale only: the text keeps its full contrast, the vignette darkens the edges
          e.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(z * (0.88 + 0.12 * f)).toFixed(4)})`;
        });
        // the silk drifts at a fifth of the camera; the lights slide the other way: the satin catches the move
        // the title belongs to the first rest: it leaves as the camera does
        if (tit) { const o = clamp(1 - (p - PLANO[0] * 0.5) / (PLANO[0] * 0.9), 0, 1); tit.style.opacity = o.toFixed(3); tit.style.transform = `translate3d(0, ${((o - 1) * 24).toFixed(1)}px, 0)`; }
        const ox = cx - 0.5, oy = cy - 0.5;
        fundo.style.transform = `translate3d(${(-ox * W * 0.2).toFixed(1)}px, ${(-oy * Hh * 0.2).toFixed(1)}px, 0) scale(${(1 + 0.08 * (1 - z)).toFixed(4)})`;
        luzes.forEach((l, j) => {
          const v = [0.55, -0.35, 0.8][j] || 0.5;
          l.style.transform = `translate3d(${(-ox * W * v).toFixed(1)}px, ${(-oy * Hh * v * 0.6).toFixed(1)}px, 0)`;
        });
        const idx = p < (PLANO[0] + PLANO[1]) / 2 ? 0 : p < (PLANO[2] + PLANO[3]) / 2 ? 1 : 2;
        if (idx !== foco) {
          foco = idx;
          ests.forEach((e, i) => e.classList.toggle('foco', i === idx));
          if (nEl) nEl.textContent = `0${idx + 1}`;
          if (cta) cta.dataset.intent = `Private viewing: ${ests[idx].dataset.nome}`;
        }
      },
    }).agora();
  }

  /* ---------- reveals ---------- */
  function revela() {
    $$('main h1, main h2, main .fonte-t').forEach((h) => $$('.ln', h).forEach((l, k) => l.style.setProperty('--l', k)));
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -16% 0px' });
    $$('main > section').forEach((s, k) => { if (k === 0) { s.classList.add('vis'); return; } s.classList.add('rv'); io.observe(s); });
  }

  /* ---------- rails (posters, gallery) ---------- */
  function trilhos() {
    $$('[data-trilho], [data-gal]').forEach((t) => {
      const pista = $('[data-pista]', t), prev = $('[data-prev]', t), next = $('[data-next]', t), n = $('[data-n]', t);
      if (!pista) return;
      const itens = () => [...pista.children].filter((x) => x.offsetParent !== null);
      const idx = () => { const l = pista.getBoundingClientRect().left + pista.clientWidth / 2; let best = 0, bd = 1e9; itens().forEach((it, k) => { const r = it.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - l); if (d < bd) { bd = d; best = k; } }); return best; };
      const vai = (k) => { const it = itens()[clamp(k, 0, itens().length - 1)]; if (!it) return; pista.scrollTo({ left: it.offsetLeft - (pista.clientWidth - it.clientWidth) / 2, behavior: calma() ? 'auto' : 'smooth' }); };
      const atualiza = () => { const k = idx(); if (n) n.textContent = String(k + 1); if (prev) prev.disabled = k === 0; if (next) next.disabled = k >= itens().length - 1; };
      prev?.addEventListener('click', () => vai(idx() - 1));
      next?.addEventListener('click', () => vai(idx() + 1));
      let raf = 0; pista.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; atualiza(); }); }, { passive: true });
      t.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { vai(idx() + 1); e.preventDefault(); } if (e.key === 'ArrowLeft') { vai(idx() - 1); e.preventDefault(); } });
      atualiza(); t._vai = vai; t._idx = idx;
    });
  }

  /* gallery full screen */
  function zoom() {
    const dlg = $('[data-zoom-dlg]'); if (!dlg) return;
    const fotos = $$('.gal-b img'); const im = $('[data-zoom-img]', dlg), n = $('[data-zoom-n]', dlg);
    let k = 0;
    const maior = (img) => (img.getAttribute('srcset') || '').split(',').map((x) => x.trim().split(' ')).sort((a, b) => parseInt(b[1], 10) - parseInt(a[1], 10))[0]?.[0] || img.src;
    const mostra = (j) => { k = (j + fotos.length) % fotos.length; im.src = maior(fotos[k]); im.alt = fotos[k].alt; n.textContent = String(k + 1); };
    $$('[data-zoom]').forEach((b) => b.addEventListener('click', () => { mostra(+b.dataset.zoom); dlg.showModal(); }));
    $('[data-zoom-close]', dlg).addEventListener('click', () => dlg.close());
    $('[data-zoom-prev]', dlg).addEventListener('click', () => mostra(k - 1));
    $('[data-zoom-next]', dlg).addEventListener('click', () => mostra(k + 1));
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') mostra(k + 1); if (e.key === 'ArrowLeft') mostra(k - 1); });
    let x0 = null;
    dlg.addEventListener('pointerdown', (e) => { x0 = e.clientX; }, { passive: true });
    dlg.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) mostra(k + (dx < 0 ? 1 : -1)); }, { passive: true });
  }

  /* ---------- living images and magnetic buttons (fine pointers only) ---------- */
  function rato() {
    if (!FINO.matches) return;
    $$('.cartaz a').forEach((a) => {
      const li = a.parentElement;
      a.addEventListener('pointermove', (e) => { if (calma()) return; const r = a.getBoundingClientRect(); li.style.setProperty('--px', `${(((e.clientX - r.left) / r.width - 0.5) * -14).toFixed(1)}px`); li.style.setProperty('--py', `${(((e.clientY - r.top) / r.height - 0.5) * -14).toFixed(1)}px`); }, { passive: true });
      a.addEventListener('pointerleave', () => { li.style.setProperty('--px', '0px'); li.style.setProperty('--py', '0px'); });
    });
    const mags = $$('main .btn, .cab-book');
    let mx = -1e4, my = -1e4, raf = 0;
    const passo = () => {
      raf = 0;
      for (const b of mags) {
        const r = b.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) continue;
        const dx = mx - clamp(mx, r.left, r.right), dy = my - clamp(my, r.top, r.bottom), d = Math.hypot(dx, dy);
        let tx = 0, ty = 0;
        if (d < 80 && !calma()) { const k = 1 - d / 80; tx = clamp((mx - (r.left + r.width / 2)) * 0.1, -6, 6) * k; ty = clamp((my - (r.top + r.height / 2)) * 0.18, -6, 6) * k; }
        const ox = b._mx || 0, oy = b._my || 0;
        if (Math.abs(ox - tx) > 0.2 || Math.abs(oy - ty) > 0.2) { b._mx = tx; b._my = ty; b.style.setProperty('--mx', `${tx.toFixed(1)}px`); b.style.setProperty('--my', `${ty.toFixed(1)}px`); }
      }
    };
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(passo); }, { passive: true });
  }

  /* ---------- menu ---------- */
  function menuSetup() {
    const m = $('#menu'), abre = $('[data-menu-open]'), fecha = $('[data-menu-close]');
    if (!m || !abre) return;
    let t = 0;
    const open = () => {
      clearTimeout(t); m.hidden = false; m.classList.remove('fechando');
      requestAnimationFrame(() => requestAnimationFrame(() => m.classList.add('aberto')));
      abre.setAttribute('aria-expanded', 'true'); H.style.overflow = 'hidden';
      setTimeout(() => $('.menu-nav a', m)?.focus({ preventScroll: true }), 320);
    };
    const close = (foco = true) => {
      if (m.hidden) return;
      m.classList.remove('aberto'); m.classList.add('fechando');
      abre.setAttribute('aria-expanded', 'false'); H.style.overflow = '';
      t = setTimeout(() => { m.hidden = true; m.classList.remove('fechando'); }, calma() ? 10 : 640);
      if (foco) abre.focus({ preventScroll: true });
    };
    abre.addEventListener('click', open);
    fecha?.addEventListener('click', () => close());
    // Escape closes the menu wherever the focus is (before the first link takes it, too)
    D.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !m.hidden) close(); });
    m.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); });
    menuSetup.close = close;
  }

  /* ---------- the demo sheet ---------- */
  function folha() {
    const d = $('#folha'); if (!d) return () => {};
    const mg = $('.mg', d), txt = $('[data-mg-txt]', d), card = $('[data-mg-card]', d), num = $('[data-mg-n]', d);
    let t = 0;
    $('[data-folha-close]', d)?.addEventListener('click', () => d.close());
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    return (intent) => {
      menuSetup.close?.(false);
      const s = (intent || 'Private viewing').slice(0, 64);
      txt.textContent = s; card.textContent = s; num.textContent = '3';
      if (!d.open) d.showModal();
      mg.classList.remove('joga'); void mg.offsetWidth; mg.classList.add('joga');
      clearTimeout(t); t = setTimeout(() => { num.textContent = '4'; }, calma() ? 0 : 1150);
    };
  }

  /* ---------- forms: validate, then the sheet (nothing is sent) ---------- */
  const MSG = { name: 'Please tell us your name.', phone: 'Please add a number we can reach on WhatsApp.', marque: 'Please choose a marque.', car: 'Please write the make and model.', year: 'Please write the year, for example 2021.', km: 'Please write the mileage in km.' };
  function snap() {
    if (calma() || !mt) return Promise.resolve();
    const k = [{ transform: 'scaleY(0)', easing: EIN }, { transform: 'scaleY(1)', offset: 0.35 }, { transform: 'scaleY(1)', offset: 0.45, easing: E }, { transform: 'scaleY(0)' }];
    pulso();
    const a = mt.animate(k, { duration: 620 }); mb.animate(k, { duration: 620 });
    return a.finished.catch(() => {});
  }
  function formularios(abreFolha) {
    D.addEventListener('submit', (e) => {
      const f = e.target.closest('form[data-form]'); if (!f) return;
      e.preventDefault();
      let primeiro = null;
      $$('input, select, textarea', f).forEach((el) => {
        const c = el.closest('.campo'); c?.classList.remove('erro'); c?.querySelector('.msg')?.remove(); el.removeAttribute('aria-invalid');
        if (el.type === 'hidden' || el.checkValidity()) return;
        c?.classList.add('erro'); el.setAttribute('aria-invalid', 'true');
        const m = D.createElement('span'); m.className = 'msg'; m.textContent = MSG[el.name] || 'Please check this field.'; m.id = `m-${el.name}-${Math.random().toString(36).slice(2, 7)}`;
        c?.append(m); el.setAttribute('aria-describedby', m.id);
        primeiro ||= el;
      });
      if (primeiro) { primeiro.focus(); return; }
      const v = Object.fromEntries(new FormData(f));
      const intent = f.dataset.form === 'trade' ? `Trade-in · ${v.car}, ${v.year}` : `Viewing · ${v.car || v.marque || 'Private viewing'}`;
      (f.dataset.form === 'trade' ? snap() : Promise.resolve()).then(() => abreFolha(intent));
    });
    D.addEventListener('input', (e) => { const c = e.target.closest?.('.campo.erro'); if (c && e.target.checkValidity()) { c.classList.remove('erro'); c.querySelector('.msg')?.remove(); e.target.removeAttribute('aria-invalid'); } });
  }

  /* ---------- Dubai time (digits rolled by CSS) ---------- */
  function relogio() {
    const hs = $$('[data-hora]'); if (!hs.length) return;
    let fmt; try { fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Dubai' }); } catch (e) { return; }
    const tick = () => {
      const t = fmt.format(new Date()), d = t.replace(/\D/g, '').padStart(4, '0');
      hs.forEach((h) => { $$('.dig i', h).forEach((i, k) => i.style.setProperty('--d', d[k])); const s = $('[data-hora-txt]', h); if (s) s.textContent = `Dubai time ${t}`; h.classList.add('on'); });
    };
    tick(); setInterval(() => { if (!D.hidden) tick(); }, 10000);
  }

  /* ---------- fixed WhatsApp and pill: out when a section CTA is on screen, they land on the footer ---------- */
  function fixos() {
    const wa = $('.wa-fixo'); if (!wa) return;
    const vistos = new Set();
    const hero = $('main > section:first-child');
    let heroFora = false;
    const pill = $('.pill-demo');
    // the WhatsApp button shows when no button, link or form is in view; the demo pill steps aside for any of them
    // past the hero (it never sits on top of a CTA or a field), and the header darkens once the hero has gone
    const decide = () => {
      wa.classList.toggle('mostra', heroFora && vistos.size === 0);
      pill?.classList.toggle('fora', [...vistos].some((x) => !hero.contains(x)));
      H.classList.toggle('rolou', heroFora);
    };
    new IntersectionObserver((e) => { heroFora = !e[0].isIntersecting; decide(); }).observe($('.acts', hero) || hero);
    const io = new IntersectionObserver((ents) => { ents.forEach((e) => (e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target))); decide(); });
    $$('main .acts, main form, main .btn, main .link, main .servs, main .contactos, main .grade-pe, main .seta-btn').forEach((x) => io.observe(x));
    const pe = $('.pe'); let raf = 0;
    const sobe = () => { raf = 0; const r = pe.getBoundingClientRect(); const o = Math.max(0, innerHeight - r.top); H.style.setProperty('--sobe', `${-o}px`); };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(sobe); }, { passive: true });
    sobe();
  }

  /* ---------- reduce motion switch (footer) ---------- */
  function movimento() {
    $$('[data-mov]').forEach((b) => {
      b.setAttribute('aria-checked', String(calma()));
      b.addEventListener('click', () => {
        const v = !calma();
        H.classList.toggle('sem-movimento', v); save('yd-calma', v ? '1' : '0');
        $$('[data-mov]').forEach((x) => x.setAttribute('aria-checked', String(v)));
        if (v) { corrida?.acaba(); film.desliga(); SC.forEach((s) => s.video?.pause()); H.classList.remove('abre'); H.classList.add('aberto'); }
        else { const s = SC.get(cenaAtual); if (s?.def.k === 'film') film.liga(s); SC.forEach(videoSrc); }
        laços.forEach((l) => l.agora());
      });
    });
  }

  /* ---------- page transitions (never a dry navigation) ---------- */
  function transicoes(abreFolha) {
    D.addEventListener('click', (e) => {
      const sh = e.target.closest('[data-sheet]');
      if (sh) { e.preventDefault(); abreFolha(sh.dataset.intent); return; }
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
      const url = new URL(a.getAttribute('href'), location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) {
        if (url.hash) {
          const t = D.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (t || url.hash === '#top') {
            e.preventDefault(); (t || D.body).scrollIntoView({ behavior: calma() ? 'auto' : 'smooth' });
            // the default jump would move the focus there too (skip link, keyboard users): do it by hand
            if (t) { if (!t.matches('a[href], button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
          }
        }
        return;
      }
      e.preventDefault();
      try { sessionStorage.setItem('yd-corte', '1'); } catch (err) { /* ignore */ }
      H.classList.add('sai');
      setTimeout(() => { location.href = url.href; }, calma() ? 450 : 400);
    });
    addEventListener('pageshow', (e) => { if (e.persisted) H.classList.remove('sai'); });
    setTimeout(() => H.classList.remove('chega'), 900);
  }

  /* ---------- collection: chips and the stage behind the hovered car ---------- */
  function colecao() {
    const chips = $$('[data-chip]'); if (!chips.length) return;
    const cards = $$('.grade .cartaz[data-marque]');
    const aplica = (m) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.chip === m)));
      cards.forEach((c) => c.classList.toggle('fora', m !== 'all' && c.dataset.marque !== m));
      const u = new URL(location.href); if (m === 'all') u.searchParams.delete('marque'); else u.searchParams.set('marque', m);
      history.replaceState(null, '', u);
    };
    chips.forEach((c) => c.addEventListener('click', () => aplica(c.dataset.chip)));
    const q = new URLSearchParams(location.search).get('marque');
    if (q && chips.some((c) => c.dataset.chip === q)) aplica(q);
    if (FINO.matches) cards.forEach((c) => c.addEventListener('pointerenter', () => ativa(blocos.indexOf(c), 'suave')));
  }

  /* ---------- showreel (?showreel=1): the page scrolls itself, for meetings ---------- */
  function showreel() {
    if (!H.classList.contains('showreel')) return;
    let parar = false, y = scrollY, ultimo = performance.now(), pausa = 0, ultimoBloco = -1;
    const para = () => { parar = true; };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, para, { passive: true, once: true }));
    const passo = (t) => {
      if (parar) return;
      const dt = Math.min(50, t - ultimo); ultimo = t;
      if (atual !== ultimoBloco) { ultimoBloco = atual; pausa = 1500; }
      if (pausa > 0) pausa -= dt; else { y += dt * 0.24; scrollTo(0, y); }
      if (y < D.documentElement.scrollHeight - innerHeight - 2) requestAnimationFrame(passo);
    };
    setTimeout(() => { ultimo = performance.now(); requestAnimationFrame(passo); }, 1200);
  }

  /* ---------- boot ---------- */
  function arranca() {
    intro();
    revela();
    menuSetup();
    const abreFolha = folha();
    transicoes(abreFolha);
    formularios(abreFolha);
    trilhos(); zoom(); rato(); relogio(); fixos(); movimento(); colecao();
    if (stage && blocos.length) {
      const io = new IntersectionObserver((ents) => { for (const e of ents) if (e.isIntersecting) ativa(blocos.indexOf(e.target)); }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
      blocos.forEach((b) => io.observe(b));
      // videos: the block within one screen
      const io2 = new IntersectionObserver((ents) => ents.forEach((e) => { const id = e.target.dataset.scene; if (!CENAS[id] || CENAS[id].k !== 'video') return; if (e.isIntersecting) perto.add(id); else perto.delete(id); videoSrc(cria(id)); }), { rootMargin: '100% 0px 100% 0px' });
      blocos.forEach((b) => io2.observe(b));
      ativa(blocoNoCentro(), 'ja');
      let ori = retrato(), rt = 0;
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (retrato() !== ori) { ori = retrato(); SC.forEach((s) => { const era = s.id === cenaAtual; s.el.remove(); SC.delete(s.id); if (era) { cenaAtual = null; } }); film.k = -1; film.on = false; const i = atual; atual = -1; ativa(i, 'ja'); } laços.forEach((l) => l.agora()); }, 250); }, { passive: true });
    }
    if (H.classList.contains('aberto')) showreel(); else depoisIntro.push(showreel);
    H.classList.add('pronto');
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', arranca); else arranca();
})();
