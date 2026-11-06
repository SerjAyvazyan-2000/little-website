/* Скрипты главной страницы */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var vh = function () { return window.innerHeight || document.documentElement.clientHeight; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ==========================================================
     1. Сцена: сайт собирается на глазах
     ========================================================== */
  var NICHES = {
    coffee: {
      url: 'kroshka.ru',
      brand: 'Крошка',
      kicker: 'Кофейня у дома',
      title: 'Хороший день начинается здесь.',
      ptitle: 'Хороший день начинается с маленькой чашки.',
      btn: 'Посмотреть меню',
      c1: 'Эспрессо', c2: 'Завтраки', c3: 'Как пройти',
      caption: 'Демо-проект. Тёплый лендинг с меню и атмосферой места.'
    },
    beauty: {
      url: 'len-beauty.ru',
      brand: 'Лён',
      kicker: 'Студия красоты',
      title: 'Уход, после которого хочется улыбаться.',
      ptitle: 'Уход, после которого хочется улыбаться.',
      btn: 'Записаться онлайн',
      c1: 'Маникюр', c2: 'Брови', c3: 'Прайс',
      caption: 'Демо-проект. Сайт салона с прайсом и онлайн-записью.'
    },
    master: {
      url: 'remont-rovno.ru',
      brand: 'Ровно',
      kicker: 'Частный мастер по ремонту',
      title: 'Плитка и сантехника без сюрпризов в смете.',
      ptitle: 'Плитка и сантехника без сюрпризов.',
      btn: 'Вызвать мастера',
      c1: 'Плитка', c2: 'Сантехника', c3: 'Отзывы',
      caption: 'Демо-проект. Сайт-визитка мастера с услугами и контактами.'
    }
  };
  var ORDER = ['coffee', 'beauty', 'master'];

  var stage = document.querySelector('[data-stage]');

  if (stage) {
    var frame = stage.querySelector('.stage__frame');
    var tabs = Array.prototype.slice.call(stage.querySelectorAll('[data-niche-btn]'));
    var pill = stage.querySelector('.stage__pill');
    var blocks = Array.prototype.slice.call(stage.querySelectorAll('.browser .b'));
    var phoneBlocks = Array.prototype.slice.call(stage.querySelectorAll('.phone .b'));
    var stepEls = Array.prototype.slice.call(stage.querySelectorAll('[data-step]'));
    var progress = stage.querySelector('[data-progress]');
    var current = 'coffee';
    var runId = 0;
    var autoTimer = null;
    var userPaused = false;
    var stageVisible = true;

    var movePill = function () {
      var active = stage.querySelector('[aria-selected="true"]');
      if (!active || !pill) return;
      pill.style.setProperty('--x', active.offsetLeft + 'px');
      pill.style.setProperty('--w', active.offsetWidth + 'px');
    };

    var fill = function (key) {
      var data = NICHES[key];
      stage.querySelectorAll('[data-f]').forEach(function (el) {
        var f = el.getAttribute('data-f');
        if (data[f] !== undefined) el.textContent = data[f];
      });
    };

    var setStep = function (n, p) {
      stepEls.forEach(function (el, i) {
        el.classList.toggle('is-done', i < n);
        el.classList.toggle('is-now', i === n);
      });
      if (progress) progress.style.setProperty('--p', p);
    };

    var build = async function (key) {
      var id = ++runId;
      current = key;

      tabs.forEach(function (t) {
        t.setAttribute('aria-selected', String(t.getAttribute('data-niche-btn') === key));
      });
      movePill();

      if (reduceMotion) {
        stage.setAttribute('data-niche', key);
        fill(key);
        setStep(3, 1);
        return;
      }

      // Шаг 1: каркас
      frame.classList.add('is-wire');
      blocks.concat(phoneBlocks).forEach(function (b) { b.classList.remove('is-on'); });
      setStep(0, 0.12);
      await wait(650);
      if (id !== runId) return;

      // Шаг 2: оформление — меняем палитру и тексты, блоки проявляются по очереди
      stage.setAttribute('data-niche', key);
      fill(key);
      setStep(1, 0.3);
      for (var i = 0; i < blocks.length; i++) {
        await wait(150);
        if (id !== runId) return;
        blocks[i].classList.add('is-on');
        if (progress) progress.style.setProperty('--p', 0.3 + (i / blocks.length) * 0.4);
      }

      // Шаг 3: адаптация под телефон
      setStep(2, 0.75);
      for (var j = 0; j < phoneBlocks.length; j++) {
        await wait(170);
        if (id !== runId) return;
        phoneBlocks[j].classList.add('is-on');
      }

      await wait(250);
      if (id !== runId) return;
      setStep(3, 1);
      frame.classList.remove('is-wire');
    };

    var scheduleAuto = function () {
      clearTimeout(autoTimer);
      if (reduceMotion || userPaused) return;
      autoTimer = setTimeout(function () {
        if (stageVisible && !document.hidden) {
          var next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
          build(next).then(scheduleAuto);
        } else {
          scheduleAuto();
        }
      }, 5200);
    };

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        userPaused = true;
        clearTimeout(autoTimer);
        build(tab.getAttribute('data-niche-btn'));
        // после паузы снова включаем автопоказ
        setTimeout(function () { userPaused = false; scheduleAuto(); }, 15000);
      });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        next.click();
      });
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { stageVisible = e[0].isIntersecting; }, { threshold: 0.2 }).observe(stage);
    }

    window.addEventListener('resize', movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
    movePill();

    // Первая сборка при загрузке
    if (!reduceMotion) {
      frame.classList.add('is-wire');
      var startBuild = function () {
        setTimeout(function () { build('coffee').then(scheduleAuto); }, 500);
      };
      // ждём окончания вступительной анимации
      if (document.documentElement.classList.contains('is-intro')) {
        document.addEventListener('intro:done', startBuild, { once: true });
      } else {
        startBuild();
      }
    } else {
      build('coffee');
    }
  }

  /* ==========================================================
     2. Сравнение «соцсети / сайт»
     ========================================================== */
  var compare = document.querySelector('[data-compare]');
  if (compare) {
    var range = compare.querySelector('.compare__range');
    var touched = false;
    var setPos = function (v) { compare.style.setProperty('--pos', v + '%'); };

    range.addEventListener('input', function () {
      touched = true;
      setPos(range.value);
    });

    // Подсказка: ползунок сам немного «гуляет», пока его не трогали
    if (!reduceMotion && 'IntersectionObserver' in window) {
      var hinted = false;
      new IntersectionObserver(function (entries, obs) {
        if (!entries[0].isIntersecting || hinted) return;
        hinted = true;
        obs.disconnect();
        var keys = [50, 22, 78, 50];
        var start = null;
        var dur = 2600;
        var tick = function (t) {
          if (touched) return;
          if (!start) start = t;
          var k = clamp((t - start) / dur, 0, 1);
          var seg = Math.min(Math.floor(k * 3), 2);
          var local = k * 3 - seg;
          var ease = local < 0.5 ? 4 * local * local * local : 1 - Math.pow(-2 * local + 2, 3) / 2;
          var v = keys[seg] + (keys[seg + 1] - keys[seg]) * ease;
          setPos(v);
          range.value = Math.round(v);
          if (k < 1) requestAnimationFrame(tick);
        };
        setTimeout(function () { requestAnimationFrame(tick); }, 500);
      }, { threshold: 0.5 }).observe(compare);
    }
  }

  /* ==========================================================
     3. Калькулятор стоимости
     ========================================================== */
  var calc = document.querySelector('[data-calc]');
  var totalEl = calc && calc.querySelector('[data-total]');
  var shown = 10000;

  var formatRub = function (n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
  };

  var animateTotal = function (to) {
    if (!totalEl) return;
    if (reduceMotion) { shown = to; totalEl.textContent = formatRub(to); return; }
    var from = shown;
    var start = null;
    var dur = 600;
    var step = function (t) {
      if (!start) start = t;
      var k = clamp((t - start) / dur, 0, 1);
      var e = 1 - Math.pow(1 - k, 4);
      shown = from + (to - from) * e;
      totalEl.textContent = formatRub(shown);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var currentRoute = 'new';

  if (calc) {
    var recalc = function () {
      var plan = calc.querySelector('input[name="plan"]:checked');
      var hosting = calc.querySelector('[data-hosting]');
      var sum = Number(plan.value) + (hosting.checked ? Number(hosting.value) : 0);
      currentRoute = plan.getAttribute('data-route');
      animateTotal(sum);
    };
    calc.addEventListener('change', recalc);

    calc.querySelector('[data-calc-cta]').addEventListener('click', function () {
      selectRoute(currentRoute);
      var plan = calc.querySelector('input[name="plan"]:checked');
      var hosting = calc.querySelector('[data-hosting]');
      var comment = document.getElementById('lead-comment');
      if (comment && !comment.value) {
        comment.value = 'Интересует: ' + plan.closest('.plan').querySelector('.plan__name').textContent +
          (hosting.checked ? ', с размещением на моём хостинге' : '') + '.';
      }
    });
  }

  /* Кнопки форматов заранее выбирают нужный вариант в форме */
  function selectRoute(route) {
    var input = document.querySelector('[data-route-value="' + route + '"]');
    if (input) input.checked = true;
  }
  document.querySelectorAll('.format__cta[data-route]').forEach(function (a) {
    a.addEventListener('click', function () { selectRoute(a.getAttribute('data-route')); });
  });

  /* ==========================================================
     4. Работы: макет прокручивается при наведении
        (на телефоне — сам, когда карточка на экране)
     ========================================================== */
  var shots = document.querySelectorAll('.project__shot');
  var setShotHeights = function () {
    shots.forEach(function (s) { s.style.setProperty('--shot-h', s.clientHeight + 'px'); });
  };
  setShotHeights();
  window.addEventListener('resize', setShotHeights);

  if (!canHover && !reduceMotion && 'IntersectionObserver' in window) {
    var projectIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var card = entry.target;
        if (entry.isIntersecting) {
          card._timer = setInterval(function () { card.classList.toggle('is-playing'); }, 3600);
          setTimeout(function () { card.classList.add('is-playing'); }, 400);
        } else {
          clearInterval(card._timer);
          card.classList.remove('is-playing');
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.project').forEach(function (p) { projectIO.observe(p); });
  }

  /* ==========================================================
     5. Связано с прокруткой: этапы и три вопроса
     ========================================================== */
  var stepsSection = document.querySelector('[data-steps]');
  var stepsBar = document.querySelector('[data-steps-bar]');
  var stepItems = document.querySelectorAll('.step');
  var questions = document.querySelectorAll('.about__questions .q');

  var onScroll = function () {
    var h = vh();

    if (stepsSection) {
      var r = stepsSection.getBoundingClientRect();
      var p = clamp((h * 0.8 - r.top) / (r.height * 0.75), 0, 1);
      if (stepsBar) stepsBar.style.setProperty('--p', p.toFixed(3));
      stepItems.forEach(function (s, i) {
        var threshold = window.innerWidth <= 560 ? null : (i + 0.4) / stepItems.length;
        if (threshold === null) {
          s.classList.toggle('is-active', s.getBoundingClientRect().top < h * 0.7);
        } else {
          s.classList.toggle('is-active', p >= threshold);
        }
      });
    }

    questions.forEach(function (q) {
      q.classList.toggle('is-lit', q.getBoundingClientRect().top < h * 0.72);
    });
  };

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });
  onScroll();

  /* ==========================================================
     6. Вопросы и ответы: плавное раскрытие
     ========================================================== */
  document.querySelectorAll('.qa').forEach(function (details) {
    var summary = details.querySelector('summary');
    var content = details.querySelector('.qa__body');
    var anim = null;

    summary.addEventListener('click', function (e) {
      if (reduceMotion || !content.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();

      if (!details.open) {
        details.open = true;
        var h = content.scrollHeight;
        anim = content.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      } else {
        var start = content.offsetHeight;
        anim = content.animate([{ height: start + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 320, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
        anim.onfinish = function () { details.open = false; };
      }
    });
  });

})();
