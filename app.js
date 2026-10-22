'use strict';
// Saltmere tanıtım sitesi. İçerik JS olmadan da tam görünür; hareket ve 3D yalnızca süsleme.

// Mağaza bağlantıları: uygulama yayınlanınca adresi yaz, "Yakında" etiketi kendiliğinden kalkar.
const STORE = {
  ios: '',      // ör. https://apps.apple.com/tr/app/saltmere/id0000000000
  android: '',  // https://play.google.com/store/apps/details?id=com.saltmere.app
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ——— Mağaza düğmeleri ———
(() => {
  for (const a of $$('.store')) {
    const url = STORE[a.dataset.store];
    if (!url) continue;
    a.href = url;
    a.rel = 'noopener';
    a.classList.add('live');
  }
  if (STORE.ios || STORE.android) {
    const p = $('[data-store-text]');
    if (p) p.textContent = 'İlk vaka, ilk kelime, ilk ipucu. Saltmere şimdi App Store ve Google Play\'de.';
  }
})();

// ——— Üst çubuk ———
(() => {
  const bar = $('#ust');
  const on = () => bar.classList.toggle('solid', scrollY > 40);
  on();
  addEventListener('scroll', on, { passive: true });
})();

// ——— Ses ———
let current;
function play(src, btn) {
  try {
    if (current) { current.pause(); current.btn?.classList.remove('playing'); }
    const a = new Audio(src);
    a.btn = btn;
    current = a;
    btn?.classList.add('playing');
    a.addEventListener('ended', () => btn?.classList.remove('playing'));
    a.play().catch(() => btn?.classList.remove('playing'));
  } catch { /* ses yoksa sessiz devam */ }
}

// ——— Adım 1: dinle ve tamamla ———
(() => {
  const listen = $('.listen');
  const slot = $('#slot');
  const fb = $('#geri-bildirim');
  const btns = $$('.choices button');
  listen.addEventListener('click', () => play(listen.dataset.audio, listen));
  const say = (html) => { fb.innerHTML = html; };
  for (const b of btns) {
    b.addEventListener('click', () => {
      const w = b.dataset.word;
      slot.textContent = w;
      if (w === 'are') {
        btns.forEach(x => x.classList.remove('wrong'));
        b.classList.add('right');
        slot.classList.add('ok');
        play('ses/pip.mp3');
        say('<strong class="ok">✓ Doğru: are.</strong><span class="en" lang="en">My hands are empty. Look!</span><br>Ellerim boş. Bak!<br><span class="word-chip">Defter\'e eklendi · <span lang="en">hand</span> = el</span>');
      } else {
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        play('ses/silas_ipucu.mp3');
        say('<strong class="hint">Silas: <span lang="en">“Hands. Two hands. They are…”</span></strong>İki el var, yani çoğul: <b lang="en">I am · he/she/it is · they/we/you are</b>. Bir daha dene; ceza yok.');
      }
    });
  }
})();

// ——— Adım 2: sahnede bul (oyundaki sahafın gerçek sıcak noktaları) ———
(() => {
  const room = $('#oda');
  const ask = $('#hedef');
  const count = $('#sayac');
  const fb = $('#av-geri');
  // rooms.json → bookshop (x, y oransal; r oda genişliğine göre)
  const spots = {
    window: { tr: 'pencere', pts: [[.62, .46, .06], [.645, .175, .08]] },
    book: { tr: 'kitap', pts: [[.2, .4, .09]] },
    chair: { tr: 'sandalye', pts: [[.645, .665, .05]] },
    table: { tr: 'masa', pts: [[.575, .605, .065], [.8, .775, .055]] },
    bed: { tr: 'yatak', pts: [[.53, .26, .08]] },
  };
  const order = ['window', 'book', 'chair'];
  let i = 0;
  const done = new Set();
  const mark = (x, y, r, cls, text) => {
    const m = document.createElement('span');
    m.className = 'mark ' + cls;
    const w = room.clientWidth;
    m.style.left = x * 100 + '%';
    m.style.top = y * 100 + '%';
    m.style.setProperty('--r', Math.max(44, r * 2 * w) + 'px');
    if (text) { const l = document.createElement('label'); l.textContent = text; l.lang = 'en'; m.append(l); }
    room.append(m);
    if (cls !== 'found') setTimeout(() => m.remove(), 1600);
  };
  room.addEventListener('click', (e) => {
    if (i >= order.length) return;
    const r = room.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const aspect = r.height / r.width;
    // en yakın nesne (oyundaki gibi: dokunuş en yakın merkeze gider)
    let best = null, bd = Infinity;
    for (const [word, s] of Object.entries(spots)) {
      for (const [sx, sy, sr] of s.pts) {
        const d = Math.hypot(x - sx, (y - sy) * aspect);
        const lim = Math.max(sr, 0.07) * 1.15;
        if (d < lim && d < bd) { bd = d; best = { word, sx, sy, sr }; }
      }
    }
    const target = order[i];
    if (best && best.word === target) {
      done.add(target);
      mark(best.sx, best.sy, best.sr, 'found', target);
      i++;
      count.textContent = `${i} / ${order.length}`;
      if (i < order.length) {
        ask.textContent = order[i];
        fb.innerHTML = `<strong class="ok">✓ <span lang="en">${target}</span> = ${spots[target].tr}</strong>Sıradaki: <b lang="en">${order[i]}</b>`;
      } else {
        ask.textContent = '✓';
        fb.innerHTML = '<strong class="ok">Hepsini buldun.</strong>Oyunda kelimeler böyle öğrenilir: bir listeden değil, sahnenin içinden. Bulduğun kelimeler Defter\'ine girer ve sonra tekrar karşına çıkar.';
      }
    } else if (best) {
      mark(best.sx, best.sy, best.sr, 'miss', best.word);
      fb.innerHTML = `Bu bir <b lang="en">${best.word}</b> (${spots[best.word].tr}). Aradığın: <b lang="en">${target}</b>.`;
    } else {
      mark(x, y, .04, 'miss');
      fb.innerHTML = `Orada bir şey yok. Aradığın: <b lang="en">${target}</b> = ${spots[target].tr}.`;
    }
  });
})();

// ——— Kadro kartları ———
for (const b of $$('.flip')) {
  b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
}

// ——— E-postayı kopyala ———
for (const b of $$('.copy')) {
  b.addEventListener('click', async () => {
    const t = b.dataset.copy;
    try { await navigator.clipboard.writeText(t); b.textContent = 'Kopyalandı'; }
    catch {
      const r = document.createRange(); r.selectNodeContents(b.parentNode.firstChild.parentNode);
      getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = 'Seçildi';
    }
    setTimeout(() => (b.textContent = 'Kopyala'), 2000);
  });
}

// ——— 3D sahne halkası ———
(() => {
  const ring = $('#ring3d');
  const clips = $$('.clip', ring);
  const name = $('#sahne-adi');
  let idx = 0;
  const show = (n) => {
    idx = (n + clips.length) % clips.length;
    const len = clips.length;
    clips.forEach((c, i) => {
      let o = i - idx;
      if (o > len / 2) o -= len;
      if (o < -len / 2) o += len;
      c.style.setProperty('--o', o);
      c.style.setProperty('--a', Math.abs(o));
      const on = i === idx;
      c.classList.toggle('on', on);
      const v = c.querySelector('video');
      if (on && !reduced) {
        if (!v) {
          const nv = document.createElement('video');
          Object.assign(nv, { muted: true, loop: true, playsInline: true, autoplay: true });
          for (const [ext, type] of [['mp4', 'video/mp4; codecs="avc1.64001F"'], ['webm', 'video/webm; codecs="vp9"']]) {
            const s = document.createElement('source'); s.src = `medya/${c.dataset.clip}.${ext}`; s.type = type; nv.append(s);
          }
          nv.setAttribute('muted', ''); nv.setAttribute('playsinline', '');
          nv.setAttribute('aria-hidden', 'true');
          nv.poster = c.querySelector('img').src;
          c.insertBefore(nv, c.querySelector('figcaption'));
          nv.play().catch(() => {});
        } else v.play().catch(() => {});
      } else if (v) v.pause();
    });
    name.textContent = clips[idx].querySelector('b').textContent;
  };
  $('#onceki').addEventListener('click', () => show(idx - 1));
  $('#sonraki').addEventListener('click', () => show(idx + 1));
  clips.forEach((c, i) => c.addEventListener('click', () => show(i)));
  // kaydırma ile döndür
  let sx = null;
  const stage = ring.parentNode;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; }, { passive: true });
  stage.addEventListener('pointerup', e => {
    if (sx === null) return;
    const d = e.clientX - sx; sx = null;
    if (Math.abs(d) > 40) show(idx + (d < 0 ? 1 : -1));
  }, { passive: true });
  // yalnızca ekrandayken video
  if ('IntersectionObserver' in window) {
    let seen = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen) { seen = true; show(idx); }
      const v = clips[idx].querySelector('video');
      if (v) e.isIntersecting ? v.play().catch(() => {}) : v.pause();
    }, { threshold: .25 }).observe(stage);
  } else show(0);
  clips.forEach((c, i) => { let o = i > clips.length / 2 ? i - clips.length : i; c.style.setProperty('--o', o); c.style.setProperty('--a', Math.abs(o)); });
  clips[0].classList.add('on');
})();

// Hareket kapalıysa buraya kadar yeter.
if (reduced) {
  const v = $('.phone-video'); v?.pause();
} else {
  document.documentElement.classList.add('motion');

  // ——— Ekranın altındakiler süzülerek gelir (üsttekiler hemen görünür) ———
  (() => {
    const els = $$('.head, .case, .step, .dossier, .flip, .plan, .faq-group, .closing-card, .facts dl');
    const vh = innerHeight;
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' }) : null;
    els.forEach((el, n) => {
      if (!io || el.getBoundingClientRect().top < vh) return;
      el.classList.add('rv');
      el.style.setProperty('--d', `${(n % 4) * 70}ms`);
      io.observe(el);
    });
    setTimeout(() => els.forEach(el => el.classList.add('in')), 6000); // güvenlik ağı
  })();

  // ——— Liman: katmanlı derinlik (fare, telefon eğimi, kaydırma) ———
  (() => {
    const hero = $('.hero');
    const harbor = $('.harbor');
    const layers = $$('[data-depth]', harbor);
    const rig = $('[data-tilt]');
    const setH = () => harbor.style.setProperty('--hh', (innerWidth > 900 ? hero.clientHeight : innerHeight) + 'px');
    setH(); addEventListener('resize', setH, { passive: true });
    let tx = 0, ty = 0, cx = 0, cy = 0, sy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * .07; cy += (ty - cy) * .07;
      const s = Math.min(scrollY, innerHeight);
      for (const l of layers) {
        const d = +l.dataset.depth;
        const x = -cx * 22 * d, y = -cy * 14 * d + s * (.18 * d);
        if (l.classList.contains('plate')) { l.style.setProperty('--px', x + 'px'); l.style.setProperty('--py', y + 'px'); }
        else l.style.transform = `translate3d(${x}px,${y}px,0)`;
      }
      if (rig) { rig.style.setProperty('--ry', cx * 10 + 'deg'); rig.style.setProperty('--rx', -cy * 7 + 'deg'); }
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .001 || sy !== s ? requestAnimationFrame(loop) : 0;
      sy = s;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    if (fine) {
      addEventListener('pointermove', e => {
        if (scrollY > innerHeight) return;
        tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; kick();
      }, { passive: true });
    }
    // Android'de izin gerekmez; iOS izin istediği için orada yalnızca kaydırma derinliği çalışır.
    if ('DeviceOrientationEvent' in window && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      let b0 = null, g0 = null;
      addEventListener('deviceorientation', e => {
        if (e.beta == null || scrollY > innerHeight) return;
        b0 ??= e.beta; g0 ??= e.gamma;
        b0 += (e.beta - b0) * .01; g0 += (e.gamma - g0) * .01;
        tx = Math.max(-1, Math.min(1, (e.gamma - g0) / 14));
        ty = Math.max(-1, Math.min(1, (e.beta - b0) / 14));
        kick();
      }, { passive: true });
    }
    addEventListener('scroll', kick, { passive: true });
    kick();
  })();

  // ——— Toz zerreleri ———
  (() => {
    const cv = $('#tozlar');
    const ctx = cv?.getContext('2d');
    if (!ctx) return;
    const hero = $('.hero');
    let w = 0, h = 0, run = true, last = 0, f = 0;
    const n = fine ? 46 : 22;
    const ps = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: .3 + Math.random() * .7, p: Math.random() * 6 }));
    const size = () => { const dpr = Math.min(devicePixelRatio || 1, 1.5); w = hero.clientWidth; h = hero.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const draw = (t) => {
      if (!run) { f = 0; return; }
      const dt = Math.min(t - last || 16, 40); last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y -= dt * .000012 * p.z; p.x += Math.sin(t * .00025 + p.p) * dt * .000006;
        if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
        const a = .1 + p.z * .35 * (.6 + .4 * Math.sin(t * .002 + p.p));
        ctx.beginPath(); ctx.fillStyle = `rgba(255,233,184,${a})`; ctx.arc(p.x * w, p.y * h, .6 + p.z * 1.4, 0, 6.283); ctx.fill();
      }
      f = requestAnimationFrame(draw);
    };
    size(); addEventListener('resize', size, { passive: true });
    const go = () => { if (run && !f) { last = performance.now(); f = requestAnimationFrame(draw); } };
    new IntersectionObserver(([e]) => { run = e.isIntersecting && !document.hidden; go(); }).observe(hero);
    document.addEventListener('visibilitychange', () => { run = !document.hidden; go(); });
    go();
  })();

  // ——— Kartlar: dokunulan köşeye doğru 3D eğilme + ışık ———
  if (fine) {
    for (const el of $$('[data-tilt-soft]')) {
      let fr = 0;
      el.addEventListener('pointermove', e => {
        cancelAnimationFrame(fr);
        fr = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ty', `${(x - .5) * 8}deg`);
          el.style.setProperty('--tx', `${(.5 - y) * 6}deg`);
          el.style.setProperty('--gx', `${x * 100}%`);
          el.style.setProperty('--gy', `${y * 100}%`);
          el.style.setProperty('--go', 1);
        });
      }, { passive: true });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(fr);
        ['--tx', '--ty'].forEach(k => el.style.setProperty(k, '0deg'));
        el.style.setProperty('--go', 0);
      });
    }
  } else {
    // dokunmatik: kart ekrana girerken kaydırmayla hafifçe doğrulur
    const els = $$('[data-tilt-soft]');
    let fr = 0;
    const upd = () => {
      fr = 0;
      const vh = innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const c = (r.top + r.height / 2) / vh - .5; // -0,5 üst … 0,5 alt
        el.style.setProperty('--tx', `${(-c * 10).toFixed(2)}deg`);
      }
    };
    addEventListener('scroll', () => { if (!fr) fr = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }
}
