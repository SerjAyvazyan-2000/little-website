/* Общие скрипты для всех страниц: шапка, меню, появление блоков, cookie, нижняя панель */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Шапка ---------- */
  var header = document.querySelector('[data-header]');
  var lastY = window.scrollY;

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 10);
    }
    lastY = y;
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-menu]');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (burger) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(!body.classList.contains('menu-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && body.classList.contains('menu-open')) {
        setMenu(false);
        burger.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* ---------- Появление при прокрутке ---------- */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    el.querySelectorAll('.line > span').forEach(function (s, i) { s.style.setProperty('--i', i); });
  });

  var revealTargets = document.querySelectorAll('[data-reveal], [data-split], [data-checklist], [data-paybar]');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Cookie ---------- */
  var cookie = document.querySelector('[data-cookie]');
  var COOKIE_KEY = 'saitika-cookie-ok';

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* хранилище недоступно */ }
  }

  var setCookieShift = function (on) {
    if (on && cookie) {
      root.style.setProperty('--cookie-h', (cookie.offsetHeight + 12) + 'px');
    } else {
      root.style.removeProperty('--cookie-h');
    }
  };

  if (cookie && !storageGet(COOKIE_KEY)) {
    // Показываем плашку, когда человек уже начал листать, — первый экран и его кнопки не закрываем
    var cookieShown = false;
    var showCookie = function () {
      if (cookieShown) return;
      cookieShown = true;
      window.removeEventListener('scroll', onFirstScroll);
      cookie.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cookie.classList.add('is-visible');
          setCookieShift(true);
        });
      });
    };
    var onFirstScroll = function () {
      if (window.scrollY > window.innerHeight * 0.5) setTimeout(showCookie, 400);
    };
    window.addEventListener('scroll', onFirstScroll, { passive: true });
    setTimeout(showCookie, 20000); // если не листают — покажем позже

    window.addEventListener('resize', function () {
      if (!cookie.hidden) setCookieShift(true);
    });

    cookie.querySelector('[data-cookie-accept]').addEventListener('click', function () {
      storageSet(COOKIE_KEY, '1');
      cookie.classList.remove('is-visible');
      setCookieShift(false);
      setTimeout(function () { cookie.hidden = true; }, 700);
    });
  }

  /* ---------- Нижняя панель на телефоне ---------- */
  var dock = document.querySelector('[data-dock]');
  var hero = document.querySelector('.hero');
  var contact = document.querySelector('#contacts');

  if (dock && 'IntersectionObserver' in window) {
    var heroVisible = true;
    var contactVisible = false;
    var update = function () {
      dock.classList.toggle('is-visible', !heroVisible && !contactVisible);
    };
    if (hero) {
      new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
    }
    if (contact) {
      new IntersectionObserver(function (e) { contactVisible = e[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(contact);
    }
  }

  /* ---------- Наверх и год ---------- */
  var toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  root.classList.add('is-ready');
})();
