/* Страница шаблона: template.html?slug=golden-hands
   Данные берутся из assets/js/templates-data.js */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATA = window.TEMPLATES || {};
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11L11 5M6 5h5v5"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  /* ==========================================================
     1. Какой шаблон открыт
     ========================================================== */
  var slug = '';
  try { slug = new URLSearchParams(window.location.search).get('slug') || ''; } catch (e) { /* без параметров */ }
  if (!slug) {
    var h = window.location.hash.replace('#', '');
    if (DATA[h]) slug = h;
  }
  var t = DATA[slug];

  if (!t) {
    document.querySelectorAll('[data-tp] > section').forEach(function (s) {
      s.hidden = !s.hasAttribute('data-missing');
    });
    var bb = document.querySelector('[data-buybar]');
    if (bb) bb.remove();
    document.title = 'Шаблон не найден — Сайтика';
    return;
  }

  var host = t.demo.replace(/^https?:\/\//, '').replace(/\/$/, '');
  var img = 'assets/images/catalog/' + slug + '.webp';
  var values = {
    title: t.title, categoryName: t.categoryName, styleName: t.styleName, desc: t.desc,
    price: t.price.replace(' ', ' '), about: t.about, host: host
  };

  document.title = 'Шаблон сайта «' + t.title + '» — ' + t.h1.split(' — ')[1] + ' | Сайтика';
  var meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', t.h1 + '. ' + t.desc + ' Изучите живую демоверсию и закажите настройку под свой бизнес.');

  /* ==========================================================
     2. Заполняем страницу
     ========================================================== */
  document.querySelectorAll('[data-f]').forEach(function (el) {
    var v = values[el.getAttribute('data-f')];
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-f-img]').forEach(function (el) {
    el.src = img;
    el.alt = el.closest('.tp-shot') ? 'Главный экран шаблона ' + t.title : '';
  });
  document.querySelectorAll('[data-v]').forEach(function (el) {
    var k = el.getAttribute('data-v');
    el.value = k === 'slug' ? slug : k === 'demo' ? t.demo : k === 'price' ? t.price + ' ₽' : t.title;
  });
  document.querySelectorAll('[data-demo-link]').forEach(function (a) { a.href = t.demo; });

  // Заголовок: название + оранжевая плашка с типом сайта
  var h1 = document.querySelector('[data-f-h1]');
  var parts = t.h1.split(' — ');
  h1.setAttribute('aria-label', t.h1);
  h1.innerHTML = '<span class="line"><span>' + esc(parts[0]) + '</span></span>' +
    '<span class="line"><span>' + esc(parts[1] || '') + '</span></span>';

  // Списки
  var lookIcons = [
    '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
  ];
  var lookEl = document.querySelector('[data-list="demoList"]');
  lookEl.innerHTML = t.demoList.map(function (s, i) {
    return '<li data-reveal style="--d:' + i + '"><span class="tp-look__icon" aria-hidden="true">' + lookIcons[i % 3] + '</span>' + esc(s) + '</li>';
  }).join('');

  var changeIcons = [
    '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
    '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>'
  ];
  var changeEl = document.querySelector('[data-list="change"]');
  changeEl.innerHTML = t.change.map(function (s, i) {
    return '<li class="spot" data-reveal style="--d:' + i + '"><span class="tp-change__icon" aria-hidden="true">' + changeIcons[i % 3] + '</span><p>' + esc(s) + '</p></li>';
  }).join('');

  // Вопросы
  var faqEl = document.querySelector('[data-faq]');
  faqEl.innerHTML = t.faq.map(function (f) {
    return '<details class="qa"><summary>' + esc(f.q) + '<span class="qa__icon" aria-hidden="true"></span></summary>' +
      '<div class="qa__body"><p>' + esc(f.a) + '</p></div></details>';
  }).join('');

  // Похожие шаблоны — те же карточки, что в каталоге
  var relEl = document.querySelector('[data-related]');
  relEl.innerHTML = t.related.filter(function (s) { return DATA[s]; }).map(function (s, i) {
    var r = DATA[s];
    var rhost = r.demo.replace(/^https?:\/\//, '').replace(/\/$/, '');
    var href = 'template.html?slug=' + s;
    return '<article class="tpl" data-reveal style="--d:' + i + '">' +
      '<a class="tpl__shot" href="' + href + '" data-cursor="Подробнее" data-tilt tabindex="-1" aria-hidden="true">' +
      '<span class="tpl__bar"><i></i><i></i><i></i><span>' + esc(rhost) + '</span></span>' +
      '<span class="tpl__img"><img src="assets/images/catalog/' + s + '.webp" width="1008" height="672" loading="lazy" decoding="async" alt=""></span></a>' +
      '<div class="tpl__body"><div class="tpl__head"><h3><a href="' + href + '">' + esc(r.title) + '</a></h3>' +
      '<a class="tpl__demo" href="' + r.demo + '" target="_blank" rel="noopener" aria-label="Демо ' + esc(r.title) + ' — откроется в новой вкладке">Демо ' + ARROW + '</a></div>' +
      '<p class="tpl__meta"><span>' + esc(r.categoryName) + '</span><span class="tpl__style">' + esc(r.styleName) + '</span></p>' +
      '<p class="tpl__desc">' + esc(r.desc) + '</p>' +
      '<div class="tpl__foot"><p class="tpl__price"><b>' + r.price.replace(' ', ' ') + ' ₽</b><span>Стандартная настройка</span></p>' +
      '<a class="btn btn--signal tpl__more" href="' + href + '">Подробнее</a></div></div></article>';
  }).join('') +
    '<a class="tp-allcard" href="catalog.html#templates" data-reveal style="--d:2">' +
    '<span class="tp-allcard__fan" aria-hidden="true">' +
    ['tork-one', 'mirelle', 'pulse-eight'].map(function (s, i) {
      return '<img src="assets/images/catalog/' + s + '.webp" alt="" loading="lazy" style="--i:' + (i - 1) + '">';
    }).join('') + '</span>' +
    '<span class="tp-allcard__text"><b>18 готовых дизайнов</b>Красота, автосервисы, строительство, фитнес и сервисы</span>' +
    '<span class="btn btn--light">Весь каталог</span></a>';

  /* ==========================================================
     3. Просмотр на устройствах
     ========================================================== */
  var viewer = document.querySelector('[data-viewer]');
  var device = viewer.querySelector('.device');
  var screen = viewer.querySelector('[data-screen]');
  var frame = viewer.querySelector('[data-frame]');
  var loader = viewer.querySelector('[data-loader]');
  var tabs = Array.prototype.slice.call(viewer.querySelectorAll('[data-device-btn]'));
  var pill = viewer.querySelector('.viewer__pill');
  var stage = viewer.querySelector('[data-stage-view]');
  var expandBtn = viewer.querySelector('[data-expand]');
  var expandLabel = viewer.querySelector('[data-expand-label]');
  var helpBtn = viewer.querySelector('[data-help]');
  var helpPop = viewer.querySelector('#viewer-help');

  // «Виртуальный» размер окна, в котором открывается демо
  var VIRTUAL = { desktop: [1440, 900], laptop: [1280, 800], phone: [390, 844] };
  var current = 'desktop';
  var frameLoaded = false;
  var slowTimer;

  frame.title = 'Сайт «' + t.title + '» — интерактивное демо';
  loader.style.setProperty('--poster', 'url("' + new URL(img, window.location.href).href + '")');

  var fit = function () {
    var v = VIRTUAL[current];
    var w = screen.clientWidth;
    if (!w) return;
    var k = w / v[0];
    frame.style.width = v[0] + 'px';
    frame.style.height = v[1] + 'px';
    frame.style.transform = 'scale(' + k + ')';
  };

  var movePill = function () {
    var a = viewer.querySelector('[aria-selected="true"]');
    if (!a || !pill) return;
    pill.style.setProperty('--x', a.offsetLeft + 'px');
    pill.style.setProperty('--w', a.offsetWidth + 'px');
  };

  var setDevice = function (name) {
    if (current !== name && !reduceMotion) {
      device.classList.remove('is-switching');
      void device.offsetWidth;
      device.classList.add('is-switching');
    }
    current = name;
    device.setAttribute('data-device', name);
    tabs.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-device-btn') === name)); });
    movePill();
    fit();
  };

  var loadFrame = function () {
    loader.classList.remove('is-hidden', 'is-slow');
    frameLoaded = false;
    clearTimeout(slowTimer);
    slowTimer = setTimeout(function () {
      if (!frameLoaded) loader.classList.add('is-slow');
    }, 9000);
    frame.src = t.demo;
  };

  frame.addEventListener('load', function () {
    if (!frame.getAttribute('src')) return;
    frameLoaded = true;
    clearTimeout(slowTimer);
    loader.classList.add('is-hidden');
  });

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { setDevice(b.getAttribute('data-device-btn')); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      next.click();
    });
  });

  viewer.querySelectorAll('[data-reload]').forEach(function (b) {
    b.addEventListener('click', function () {
      frame.removeAttribute('src');
      requestAnimationFrame(loadFrame);
    });
  });

  // Развернуть на весь экран
  var isExpanded = function () { return document.fullscreenElement === stage || stage.classList.contains('is-expanded'); };
  var setExpandUi = function () {
    var on = isExpanded();
    expandLabel.textContent = on ? 'Свернуть' : 'Развернуть';
    document.documentElement.classList.toggle('viewer-open', stage.classList.contains('is-expanded'));
    setTimeout(fit, 60);
  };

  var closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'viewer__close';
  closeBtn.innerHTML = '<span>Свернуть</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  stage.appendChild(closeBtn);

  var collapse = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      stage.classList.remove('is-expanded');
      setExpandUi();
    }
  };

  expandBtn.addEventListener('click', function () {
    if (isExpanded()) { collapse(); return; }
    var req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (req) {
      try {
        var p = req.call(stage);
        if (p && p.catch) p.catch(function () { stage.classList.add('is-expanded'); setExpandUi(); });
      } catch (e) {
        stage.classList.add('is-expanded');
        setExpandUi();
      }
    } else {
      stage.classList.add('is-expanded');
      setExpandUi();
    }
  });
  closeBtn.addEventListener('click', collapse);
  document.addEventListener('fullscreenchange', setExpandUi);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stage.classList.contains('is-expanded')) collapse();
  });

  // «Не видно сайт?»
  helpBtn.addEventListener('click', function () {
    var open = helpPop.hidden;
    helpPop.hidden = !open;
    helpBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (!helpPop.hidden && !e.target.closest('.viewer__help')) {
      helpPop.hidden = true;
      helpBtn.setAttribute('aria-expanded', 'false');
    }
  });
  loader.addEventListener('click', function () {
    if (loader.classList.contains('is-slow')) helpBtn.click();
  });

  if (window.ResizeObserver) {
    new ResizeObserver(fit).observe(screen);
  } else {
    window.addEventListener('resize', fit);
  }
  window.addEventListener('resize', movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  setDevice(window.innerWidth < 700 ? 'phone' : 'desktop');

  // Демо грузим, только когда до него почти доскроллили
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { loadFrame(); io.disconnect(); }
    }, { rootMargin: '300px 0px' });
    io.observe(viewer);
  } else {
    loadFrame();
  }

  /* ==========================================================
     4. Вопросы: плавное раскрытие
     ========================================================== */
  faqEl.querySelectorAll('.qa').forEach(function (details) {
    var summary = details.querySelector('summary');
    var content = details.querySelector('.qa__body');
    var anim = null;
    summary.addEventListener('click', function (e) {
      if (reduceMotion || !content.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (!details.open) {
        details.open = true;
        anim = content.animate([{ height: '0px', opacity: 0 }, { height: content.scrollHeight + 'px', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else {
        anim = content.animate([{ height: content.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 320, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
        anim.onfinish = function () { details.open = false; };
      }
    });
  });

  /* ==========================================================
     5. Прокрутка: устройство выпрямляется, шаги едут вбок,
        панель покупки появляется
     ========================================================== */
  var journey = document.querySelector('[data-journey]');
  var track = document.querySelector('[data-journey-track]');
  var jBar = document.querySelector('[data-journey-bar]');
  var jSteps = track ? Array.prototype.slice.call(track.children) : [];
  var buybar = document.querySelector('[data-buybar]');
  var hero = document.querySelector('.tp-hero');
  var request = document.getElementById('request');
  var horizontal = false;
  var shift = 0;

  var layoutJourney = function () {
    horizontal = window.innerWidth > 900 && !reduceMotion;
    journey.classList.toggle('is-horizontal', horizontal);
    if (horizontal) {
      shift = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
      journey.style.height = (window.innerHeight + shift) + 'px';
    } else {
      journey.style.height = '';
      track.style.transform = '';
    }
  };

  var onScroll = function () {
    var vh = window.innerHeight;

    // устройство: из наклона в ровное положение
    if (!reduceMotion) {
      var r = stage.getBoundingClientRect();
      var p = clamp((vh - r.top) / (vh * 0.75), 0, 1);
      device.style.setProperty('--rx', ((1 - p) * 22).toFixed(2) + 'deg');
      device.style.setProperty('--sc', (0.86 + p * 0.14).toFixed(3));
    }

    // шаги
    if (journey) {
      var jr = journey.getBoundingClientRect();
      var jp;
      if (horizontal) {
        jp = clamp(-jr.top / Math.max(1, shift), 0, 1);
        track.style.transform = 'translate3d(' + (-jp * shift).toFixed(1) + 'px,0,0)';
        jSteps.forEach(function (s, i) {
          s.classList.toggle('is-active', jp >= i / jSteps.length - 0.02);
        });
      } else {
        jp = clamp((vh * 0.7 - jr.top) / jr.height, 0, 1);
        jSteps.forEach(function (s) {
          s.classList.toggle('is-active', s.getBoundingClientRect().top < vh * 0.75);
        });
      }
      if (jBar) jBar.style.setProperty('--p', jp.toFixed(3));
    }

    // панель покупки
    if (buybar && hero && request) {
      var show = hero.getBoundingClientRect().bottom < 0 && request.getBoundingClientRect().top > vh * 0.6;
      buybar.classList.toggle('is-visible', show);
      buybar.setAttribute('aria-hidden', String(!show));
      buybar.querySelector('a').tabIndex = show ? 0 : -1;
    }
  };

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', function () { layoutJourney(); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutJourney(); onScroll(); });
  window.addEventListener('load', function () { layoutJourney(); onScroll(); });
  layoutJourney();
  onScroll();
})();
