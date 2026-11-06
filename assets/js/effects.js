/* Эффекты: вступление, свой курсор, магнитные кнопки, параллакс, наклон, бегущая лента */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ==========================================================
     1. Вступление
     ========================================================== */
  var intro = document.querySelector('[data-intro]');

  // Заголовок первого экрана — по буквам
  var heroTitle = document.querySelector('.hero__title');
  if (heroTitle && !reduceMotion) {
    var c = 0;
    heroTitle.querySelectorAll('.line > span').forEach(function (lineSpan) {
      var text = lineSpan.textContent;
      lineSpan.textContent = '';
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          lineSpan.appendChild(document.createTextNode(' '));
          return;
        }
        var w = document.createElement('span');
        w.className = 'w';
        Array.prototype.forEach.call(part, function (ch) {
          var s = document.createElement('span');
          s.className = 'ch';
          s.style.setProperty('--c', c++);
          s.textContent = ch;
          w.appendChild(s);
        });
        lineSpan.appendChild(w);
      });
    });
    heroTitle.setAttribute('aria-label', 'Создадим современный сайт для вашего бизнеса за 2 дня');
  }

  var finishIntro = function () {
    root.classList.remove('is-intro');
    document.dispatchEvent(new CustomEvent('intro:done'));
  };

  if (intro && root.classList.contains('is-intro')) {
    var countEl = intro.querySelector('[data-intro-count]');
    var statusEl = intro.querySelector('[data-intro-status]');
    var barEl = intro.querySelector('[data-intro-bar]');
    var statuses = [
      [0, 'Собираем структуру'],
      [34, 'Подбираем оформление'],
      [68, 'Адаптируем под телефон'],
      [100, 'Готово']
    ];
    var lastStatus = '';
    var DURATION = 1500;
    var fontsReady = false;
    var start = null;

    window.scrollTo(0, 0);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fontsReady = true; });
    } else {
      fontsReady = true;
    }
    setTimeout(function () { fontsReady = true; }, 2500); // не держим дольше

    var tick = function (t) {
      if (!start) start = t;
      var k = clamp((t - start) / DURATION, 0, 1);
      if (!fontsReady) k = Math.min(k, 0.92);
      var e = 1 - Math.pow(1 - k, 3);
      var n = Math.round(e * 100);
      countEl.textContent = n;
      barEl.style.setProperty('--p', e);

      for (var i = statuses.length - 1; i >= 0; i--) {
        if (n >= statuses[i][0]) {
          if (lastStatus !== statuses[i][1]) {
            lastStatus = statuses[i][1];
            statusEl.textContent = lastStatus;
            statusEl.style.animation = 'none';
            void statusEl.offsetWidth;
            statusEl.style.animation = '';
          }
          break;
        }
      }

      if (k < 1 || !fontsReady) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(function () {
          intro.classList.add('is-leaving');
          setTimeout(finishIntro, 380);
          setTimeout(function () { intro.remove(); }, 1500);
        }, 220);
      }
    };
    requestAnimationFrame(tick);
  } else {
    root.classList.remove('is-intro');
    if (intro) intro.remove();
  }

  if (reduceMotion) return;

  /* ==========================================================
     2. Полоса прокрутки сверху
     ========================================================== */
  var progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  /* ==========================================================
     3. Бегущая лента: скорость зависит от прокрутки
     ========================================================== */
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-ticker-row]')).map(function (row) {
    var track = row.querySelector('.ticker__track');
    // дублируем, чтобы лента была бесконечной
    var html = track.innerHTML;
    track.innerHTML = html + html + html + html;
    return { row: row, track: track, dir: Number(row.getAttribute('data-ticker-row')), x: 0, width: 0 };
  });
  var measureRows = function () {
    rows.forEach(function (r) { r.width = r.track.scrollWidth / 4; });
  };
  measureRows();
  window.addEventListener('resize', measureRows);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureRows);

  /* ==========================================================
     4. Параллакс при прокрутке
     ========================================================== */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]')).map(function (el) {
    return { el: el, speed: Number(el.getAttribute('data-parallax')) || 0 };
  });
  var parallaxX = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-x]')).map(function (el) {
    return { el: el, speed: Number(el.getAttribute('data-parallax-x')) || 0 };
  });

  var scrollY = window.scrollY;
  var lastScrollY = scrollY;
  var velocity = 0;
  var scrollDir = 1;

  var onScroll = function () {
    scrollY = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);

    var vh = window.innerHeight;
    if (scrollY < vh * 1.6) {
      parallaxEls.forEach(function (p) { p.el.style.setProperty('--sy', (scrollY * p.speed).toFixed(1)); });
    }

    parallaxX.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      var k = clamp((vh - r.top) / (vh + r.height), 0, 1);
      p.el.style.setProperty('--sx', ((0.5 - k) * 40 * p.speed).toFixed(2));
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ==========================================================
     5. Мышка: курсор, магнитные кнопки, параллакс фигур, наклон
     ========================================================== */
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  var cursor = null;
  var ring = { x: mouse.x, y: mouse.y };
  var dotEl;
  var ringEl;
  var labelEl;

  if (finePointer) {
    root.classList.add('has-pointer', 'has-cursor');

    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
    document.body.appendChild(cursor);
    dotEl = cursor.querySelector('.cursor__dot');
    ringEl = cursor.querySelector('.cursor__ring');
    labelEl = cursor.querySelector('.cursor__label');
    cursor.classList.add('is-hidden');

    var darkZones = '.projects, .footer, .mobile-menu, .about__questions, .ticker__row:not(.ticker__row--alt), .plan:has(input:checked)';

    document.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      cursor.classList.remove('is-hidden');

      var t = e.target;
      var labelled = t.closest && t.closest('[data-cursor]');
      var link = t.closest && t.closest('a, button, label, summary, [role="tab"]');
      var text = t.closest && t.closest('input[type="tel"], input[type="text"], textarea');

      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-link', !labelled && !!link);
      cursor.classList.toggle('is-text', !!text);
      cursor.classList.toggle('is-dark', !!(t.closest && t.closest(darkZones)));
      if (labelled) labelEl.textContent = labelled.getAttribute('data-cursor');
    }, { passive: true });

    document.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.documentElement.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
  }

  // Магнитные кнопки
  var magnets = finePointer
    ? Array.prototype.slice.call(document.querySelectorAll('.btn, .to-top, .qa__icon')).map(function (el) {
        return { el: el, x: 0, y: 0, tx: 0, ty: 0, power: el.classList.contains('btn') ? 0.32 : 0.22 };
      })
    : [];

  magnets.forEach(function (m) {
    var host = m.el.classList.contains('qa__icon') ? m.el.closest('summary') : m.el;
    host.addEventListener('pointermove', function (e) {
      var r = m.el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2)) * m.power;
      m.ty = (e.clientY - (r.top + r.height / 2)) * m.power;
    });
    host.addEventListener('pointerleave', function () { m.tx = 0; m.ty = 0; });
  });

  // Фигуры первого экрана и 3D-сцена следуют за мышкой
  var hero = document.querySelector('.hero');
  var heroSpot = document.querySelector('.hero__spot');
  var decor = Array.prototype.slice.call(document.querySelectorAll('.deco[data-depth]')).map(function (el) {
    return { el: el, depth: Number(el.getAttribute('data-depth')) || 1, x: 0, y: 0 };
  });
  var frame = document.querySelector('[data-tilt-target]');
  var scene = { rx: 0, ry: 0 };
  var heroVisible = true;

  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; }).observe(hero);
  }

  if (hero && heroSpot && finePointer) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      heroSpot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      heroSpot.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  // Наклон карточек и подсветка за курсором
  if (finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', px * 100 + '%');
        el.style.setProperty('--my', py * 100 + '%');
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 8).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 10).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    document.querySelectorAll('.plan, .calc__total, .about__questions, .lead').forEach(function (el) {
      el.classList.add('spot');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ==========================================================
     6. Один общий цикл анимации
     ========================================================== */
  var loop = function () {
    // курсор
    if (cursor) {
      ring.x = lerp(ring.x, mouse.x, 0.18);
      ring.y = lerp(ring.y, mouse.y, 0.18);
      dotEl.style.transform = 'translate3d(' + mouse.x + 'px,' + mouse.y + 'px,0)';
      ringEl.style.transform = 'translate3d(' + ring.x.toFixed(1) + 'px,' + ring.y.toFixed(1) + 'px,0)';
    }

    // магниты
    for (var i = 0; i < magnets.length; i++) {
      var m = magnets[i];
      if (Math.abs(m.tx - m.x) > 0.05 || Math.abs(m.ty - m.y) > 0.05) {
        m.x = lerp(m.x, m.tx, 0.2);
        m.y = lerp(m.y, m.ty, 0.2);
        m.el.style.translate = m.x.toFixed(2) + 'px ' + m.y.toFixed(2) + 'px';
      }
    }

    // первый экран за мышкой
    if (heroVisible && finePointer) {
      var nx = mouse.x / window.innerWidth - 0.5;
      var ny = mouse.y / window.innerHeight - 0.5;
      for (var j = 0; j < decor.length; j++) {
        var d = decor[j];
        d.x = lerp(d.x, -nx * d.depth * 26, 0.08);
        d.y = lerp(d.y, -ny * d.depth * 26, 0.08);
        d.el.style.setProperty('--px', d.x.toFixed(2));
        d.el.style.setProperty('--py', d.y.toFixed(2));
      }
      if (frame) {
        scene.ry = lerp(scene.ry, nx * 9, 0.07);
        scene.rx = lerp(scene.rx, -ny * 7, 0.07);
        frame.style.transform = 'rotateX(' + scene.rx.toFixed(2) + 'deg) rotateY(' + scene.ry.toFixed(2) + 'deg)';
      }
    }

    // бегущая лента
    var delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    if (delta !== 0) scrollDir = delta > 0 ? 1 : -1;
    velocity = lerp(velocity, Math.abs(delta), 0.1);
    var speed = 0.6 + Math.min(velocity, 60) * 0.35;
    for (var k = 0; k < rows.length; k++) {
      var r = rows[k];
      if (!r.width) continue;
      r.x -= speed * r.dir * scrollDir;
      if (r.x <= -r.width) r.x += r.width;
      if (r.x > 0) r.x -= r.width;
      r.track.style.transform = 'translate3d(' + r.x.toFixed(1) + 'px,0,0)';
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
