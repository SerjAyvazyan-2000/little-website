/* ==========================================================
   Формы заявки [data-lead] — на главной и на странице шаблона.
   Данные сейчас никуда не уходят: показывается экран «Заявка отправлена».
   CRM подключается в функции sendLead() ниже.
   ========================================================== */
(function () {
  'use strict';

  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /*
    Сюда подключается CRM. Адрес можно указать в data-endpoint у формы.
    Пример:
      return fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { if (!r.ok) throw new Error('Ошибка ' + r.status); });
  */
  function sendLead(data, endpoint) {
    void data; void endpoint;
    return wait(700); // пока имитируем короткую отправку
  }

  var digitsOf = function (v) {
    var d = v.replace(/\D/g, '');
    if (d.charAt(0) === '8') d = '7' + d.slice(1);
    if (d && d.charAt(0) !== '7') d = '7' + d;
    return d.slice(0, 11);
  };

  var maskPhone = function (v) {
    var d = digitsOf(v);
    if (!d) return '';
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    return out;
  };

  document.querySelectorAll('[data-lead]').forEach(function (form) {
    var phone = form.querySelector('input[name="phone"]');
    var phoneField = phone.closest('.field');
    var phoneError = phoneField.querySelector('.field__error');
    var consent = form.querySelector('input[name="consent"]');
    var consentError = form.querySelector('[data-consent-error]');
    var trap = form.querySelector('input[name="website"]');

    phone.addEventListener('input', function () {
      phone.value = maskPhone(phone.value);
      if (phoneField.classList.contains('is-error') && digitsOf(phone.value).length === 11) {
        phoneField.classList.remove('is-error');
        phoneError.textContent = '';
      }
    });
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 ('; });
    phone.addEventListener('blur', function () { if (digitsOf(phone.value).length <= 1) phone.value = ''; });

    consent.addEventListener('change', function () {
      if (consent.checked) {
        consent.closest('.check').classList.remove('is-error');
        consentError.textContent = '';
      }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      if (digitsOf(phone.value).length !== 11) {
        ok = false;
        phoneField.classList.add('is-error');
        phoneError.textContent = 'Введите номер полностью: +7 и ещё 10 цифр.';
      }
      if (!consent.checked) {
        ok = false;
        consent.closest('.check').classList.add('is-error');
        consentError.textContent = 'Отметьте согласие на обработку данных.';
      }
      if (!ok) {
        (phoneField.classList.contains('is-error') ? phone : consent).focus();
        return;
      }

      // ловушка для ботов: человек это поле не видит
      if (trap && trap.value) return;

      var data = {};
      new FormData(form).forEach(function (value, key) {
        if (key === 'website' || key === 'consent') return;
        data[key] = typeof value === 'string' ? value.trim() : value;
      });
      data.phone = '+' + digitsOf(phone.value);
      data.page = window.location.href;

      form.classList.add('is-sending');
      sendLead(data, form.getAttribute('data-endpoint')).then(function () {
        form.classList.remove('is-sending');
        form.classList.add('is-done');
        var done = form.querySelector('.lead__done');
        if (done) done.focus({ preventScroll: true });
      }).catch(function () {
        form.classList.remove('is-sending');
        phoneError.textContent = 'Заявка не отправилась. Проверьте интернет и попробуйте ещё раз.';
      });
    });

    var reset = form.querySelector('[data-lead-reset]');
    if (reset) {
      reset.addEventListener('click', function () {
        form.reset();
        form.classList.remove('is-done');
        phone.focus();
      });
    }
  });
})();
