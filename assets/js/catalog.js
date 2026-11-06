/* Каталог шаблонов: фильтры, поиск, анимация перестройки сетки */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var form = document.querySelector('[data-filters]');
  var grid = document.querySelector('[data-grid]');
  if (!form || !grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.tpl'));
  var search = form.querySelector('input[name="q"]');
  var clearBtn = form.querySelector('[data-clear]');
  var countEl = document.querySelector('[data-count]');
  var emptyEl = document.querySelector('[data-empty]');
  var resetBtns = document.querySelectorAll('[data-reset]');
  var resetInline = document.querySelector('.results-bar [data-reset]');

  var normalize = function (s) { return (s || '').toLowerCase().replace(/ё/g, 'е').trim(); };

  /* ==========================================================
     1. Выпадающие списки
     ========================================================== */
  var selects = {};

  Array.prototype.forEach.call(form.querySelectorAll('[data-select]'), function (root) {
    var name = root.getAttribute('data-select');
    var btn = root.querySelector('.select__btn');
    var list = root.querySelector('.select__list');
    var input = root.querySelector('input[type="hidden"]');
    var valueEl = root.querySelector('[data-select-value]');
    var options = Array.prototype.slice.call(list.querySelectorAll('[role="option"]'));
    var active = 0;

    var setActive = function (i) {
      active = (i + options.length) % options.length;
      options.forEach(function (o, k) { o.classList.toggle('is-active', k === active); });
      list.setAttribute('aria-activedescendant', options[active].id);
    };

    var open = function () {
      closeAll(name);
      root.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      var sel = options.findIndex(function (o) { return o.getAttribute('aria-selected') === 'true'; });
      setActive(sel < 0 ? 0 : sel);
      list.focus({ preventScroll: true });
    };

    var close = function (focusBtn) {
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus({ preventScroll: true });
    };

    var choose = function (value, silent) {
      var opt = options.find(function (o) { return o.getAttribute('data-value') === value; }) || options[0];
      options.forEach(function (o) { o.setAttribute('aria-selected', String(o === opt)); });
      input.value = opt.getAttribute('data-value');
      valueEl.textContent = opt.textContent;
      root.classList.toggle('has-value', !!input.value);
      if (!silent) apply();
    };

    btn.addEventListener('click', function () {
      root.classList.contains('is-open') ? close(true) : open();
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });

    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
      else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose(options[active].getAttribute('data-value'));
        close(true);
      }
      else if (e.key === 'Escape' || e.key === 'Tab') { close(e.key === 'Escape'); }
    });

    options.forEach(function (o, i) {
      o.addEventListener('mousemove', function () { setActive(i); });
      o.addEventListener('click', function () {
        choose(o.getAttribute('data-value'));
        close(true);
      });
    });

    selects[name] = { root: root, choose: choose, close: close, input: input };
  });

  function closeAll(except) {
    Object.keys(selects).forEach(function (k) { if (k !== except) selects[k].close(false); });
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-select]')) closeAll();
  });

  /* ==========================================================
     2. Фильтрация с плавной перестройкой (FLIP)
     ========================================================== */
  var shownCount = cards.length;
  var animating = [];

  var animateCount = function (to) {
    if (reduceMotion) { countEl.textContent = to; shownCount = to; return; }
    var from = shownCount;
    var start = null;
    var step = function (t) {
      if (!start) start = t;
      var k = Math.min((t - start) / 450, 1);
      countEl.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    shownCount = to;
    requestAnimationFrame(step);
  };

  var getState = function () {
    return {
      q: normalize(search.value),
      category: selects.category ? selects.category.input.value : '',
      style: selects.style ? selects.style.input.value : ''
    };
  };

  var matches = function (card, st) {
    if (st.category && card.getAttribute('data-category') !== st.category) return false;
    if (st.style && card.getAttribute('data-style') !== st.style) return false;
    if (st.q) {
      var words = st.q.split(/\s+/);
      var hay = card.getAttribute('data-search');
      for (var i = 0; i < words.length; i++) {
        if (hay.indexOf(words[i]) === -1) return false;
      }
    }
    return true;
  };

  var syncUrl = function (st) {
    try {
      var params = new URLSearchParams();
      if (st.q) params.set('q', search.value.trim());
      if (st.category) params.set('category', st.category);
      if (st.style) params.set('style', st.style);
      var qs = params.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + '#templates');
    } catch (e) { /* адресная строка недоступна — не страшно */ }
  };

  function apply(opts) {
    opts = opts || {};
    var st = getState();
    var active = !!(st.q || st.category || st.style);

    animating.forEach(function (a) { a.cancel(); });
    animating = [];

    // запоминаем, где карточки были
    var before = new Map();
    cards.forEach(function (c) {
      if (!c.hidden) before.set(c, c.getBoundingClientRect());
    });

    var visible = 0;
    cards.forEach(function (c) {
      var ok = matches(c, st);
      c.hidden = !ok;
      if (ok) visible++;
    });

    emptyEl.hidden = visible !== 0;
    animateCount(visible);
    if (resetInline) resetInline.hidden = !active;
    clearBtn.hidden = !search.value;
    if (!opts.skipUrl) syncUrl(st);

    if (reduceMotion || opts.instant) return;

    // играем перестройку
    var n = 0;
    cards.forEach(function (c) {
      if (c.hidden) return;
      var after = c.getBoundingClientRect();
      var prev = before.get(c);
      c.classList.add('is-in'); // карточка уже не ждёт появления при прокрутке
      if (prev) {
        var dx = prev.left - after.left;
        var dy = prev.top - after.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          animating.push(c.animate(
            [{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }],
            { duration: 650, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
          ));
        }
      } else {
        animating.push(c.animate(
          [
            { opacity: 0, transform: 'translateY(40px) scale(0.94) rotate(-1.5deg)' },
            { opacity: 1, transform: 'none' }
          ],
          { duration: 700, delay: Math.min(n++, 8) * 60, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' }
        ));
      }
    });
  }

  /* ==========================================================
     3. События
     ========================================================== */
  var debounce;
  search.addEventListener('input', function () {
    clearBtn.hidden = !search.value;
    clearTimeout(debounce);
    debounce = setTimeout(apply, 160);
  });

  clearBtn.addEventListener('click', function () {
    search.value = '';
    apply();
    search.focus();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    closeAll();
    apply();
    var top = document.querySelector('.results-bar').getBoundingClientRect().top + window.scrollY - 200;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  Array.prototype.forEach.call(resetBtns, function (b) {
    b.addEventListener('click', function () {
      search.value = '';
      Object.keys(selects).forEach(function (k) { selects[k].choose('', true); });
      apply();
    });
  });

  // Тень у панели фильтров, когда она прилипла
  if ('IntersectionObserver' in window) {
    var sentinel = document.createElement('div');
    sentinel.style.cssText = 'height:1px;margin-bottom:-1px';
    form.parentNode.insertBefore(sentinel, form);
    new IntersectionObserver(function (e) {
      form.classList.toggle('is-stuck', !e[0].isIntersecting && e[0].boundingClientRect.top < 0);
    }, { rootMargin: '-97px 0px 0px 0px' }).observe(sentinel);
  }

  /* ==========================================================
     4. Фильтры из адреса: catalog.html?category=auto&style=bold
     ========================================================== */
  (function readUrl() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    var q = params.get('q') || '';
    var cat = params.get('category') || '';
    var style = params.get('style') || '';
    if (!q && !cat && !style) return;
    search.value = q;
    if (selects.category) selects.category.choose(cat, true);
    if (selects.style) selects.style.choose(style, true);
    apply({ instant: true, skipUrl: true });
  })();

  /* ==========================================================
     5. Цена в первом экране считается от нуля
     ========================================================== */
  var priceEl = document.querySelector('[data-count-to]');
  if (priceEl && !reduceMotion) {
    var target = Number(priceEl.getAttribute('data-count-to'));
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    priceEl.textContent = '0';
    var run = function () {
      setTimeout(function () {
        var start = null;
        var step = function (t) {
          if (!start) start = t;
          var k = Math.min((t - start) / 1200, 1);
          priceEl.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 4)) / 10) * 10);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, 700);
    };
    if (document.documentElement.classList.contains('is-intro')) {
      document.addEventListener('intro:done', run, { once: true });
    } else {
      run();
    }
  }
})();
