/* Всплывающие окна [data-modal]. Открываются кнопками с data-modal-open="id".
   data-modal-route="new|template|help" заранее выбирает вариант «Какой сайт нужен?». */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var active = null;
  var lastFocus = null;
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, [tabindex]:not([tabindex="-1"])';

  function open(modal, route) {
    if (active === modal) return;
    if (active) close(active, true);
    active = modal;
    lastFocus = document.activeElement;

    if (route) {
      var chip = modal.querySelector('[data-route-value="' + route + '"]');
      if (chip) chip.checked = true;
    }

    modal.hidden = false;
    root.classList.add('modal-open');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { modal.classList.add('is-open'); });
    });

    setTimeout(function () {
      var form = modal.querySelector('form');
      var first = form && !form.classList.contains('is-done') ? form.querySelector('input[type="tel"]') : null;
      (first || modal.querySelector('.modal__panel')).focus({ preventScroll: true });
    }, reduceMotion ? 0 : 350);
  }

  function close(modal, instant) {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    root.classList.remove('modal-open');
    active = null;

    var finish = function () {
      modal.hidden = true;
      // после успешной заявки в следующий раз показываем чистую форму
      var form = modal.querySelector('form.is-done');
      if (form) { form.reset(); form.classList.remove('is-done'); }
    };
    if (instant || reduceMotion) finish(); else setTimeout(finish, 450);

    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal-open]');
    if (opener) {
      var modal = document.getElementById(opener.getAttribute('data-modal-open'));
      if (modal) {
        e.preventDefault();
        open(modal, opener.getAttribute('data-modal-route'));
      }
      return;
    }
    if (active && e.target.closest('[data-modal-close]')) close(active);
  });

  document.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.key === 'Escape') { close(active); return; }
    if (e.key !== 'Tab') return;

    // фокус не уходит за пределы окна
    var items = Array.prototype.filter.call(active.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // Ссылка вида catalog.html#order сразу открывает форму
  var fromHash = null;
  try { fromHash = window.location.hash && document.querySelector(window.location.hash + '[data-modal]'); } catch (e) { /* не id */ }
  if (fromHash) setTimeout(function () { open(fromHash); }, 300);
})();
