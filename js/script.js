/* ============================================================
   СтройДом — интерактив: меню, кнопка наверх, новости,
   калькулятор площади/периметра, валидация формы, авторизация
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Мобильное меню (бургер) ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Кнопка возвращения на главный экран ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Подсветка активного пункта меню при скролле ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && byId[en.target.id]) {
          navLinks.forEach(function (a) { a.classList.remove('is-active'); });
          byId[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Заглушка проигрывания видео в новостях ---------- */
  document.querySelectorAll('.news-card__play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      alert('Здесь откроется видео с объекта. В демонстрационном макете плеер не подключён.');
    });
  });

  /* ============================================================
     Калькулятор периметра и площади застройки
     Периметр = 2 × (длина + ширина); Площадь = длина × ширина × этажи
     ============================================================ */
  var calc = document.getElementById('orderForm');
  if (calc) {
    var lenEl = document.getElementById('f-length');
    var widEl = document.getElementById('f-width');
    var floorsEl = document.getElementById('f-floors');
    var outPerim = document.getElementById('calc-perimeter');
    var outArea = document.getElementById('calc-area');
    var outTotal = document.getElementById('calc-total');
    var outPrice = document.getElementById('calc-price');
    var PRICE = { house: 32000, banya: 28000, hozblok: 18000 };
    var typeEl = document.getElementById('f-type');

    function num(el) {
      var v = parseFloat(String(el && el.value).replace(',', '.'));
      return isFinite(v) && v > 0 ? v : 0;
    }
    function fmt(n) { return n.toLocaleString('ru-RU'); }

    function recalc() {
      var L = num(lenEl), W = num(widEl);
      var floors = floorsEl ? (parseInt(floorsEl.value, 10) || 1) : 1;
      var perim = 2 * (L + W);
      var footprint = L * W;
      var total = footprint * floors;
      var rate = (typeEl && PRICE[typeEl.value]) ? PRICE[typeEl.value] : PRICE.house;
      if (outPerim) outPerim.textContent = perim ? perim.toFixed(1) + ' м' : '— м';
      if (outArea) outArea.textContent = footprint ? footprint.toFixed(1) + ' м²' : '— м²';
      if (outTotal) outTotal.textContent = total ? total.toFixed(1) + ' м²' : '— м²';
      if (outPrice) outPrice.textContent = total ? 'от ' + fmt(Math.round(total * rate)) + ' ₽' : 'от — ₽';
    }
    [lenEl, widEl, floorsEl, typeEl].forEach(function (el) {
      if (el) el.addEventListener('input', recalc);
      if (el) el.addEventListener('change', recalc);
    });
    recalc();

    /* ---------- Предзаполнение вида застройки из ссылки (?type=) ---------- */
    var qType = new URLSearchParams(location.search).get('type');
    if (qType && typeEl && PRICE[qType]) { typeEl.value = qType; recalc(); }

    /* ---------- Валидация и отправка формы ---------- */
    calc.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstInvalid = null;
      calc.querySelectorAll('[required]').forEach(function (field) {
        var wrap = field.closest('.field');
        var valid = field.value.trim() !== '';
        if (field.type === 'tel') valid = valid && /[\d]{6,}/.test(field.value.replace(/\D/g, ''));
        if (field.type === 'checkbox') valid = field.checked;
        if (wrap) wrap.classList.toggle('has-error', !valid);
        field.classList.toggle('is-invalid', !valid);
        if (!valid && !firstInvalid) firstInvalid = field;
        if (!valid) ok = false;
      });
      if (!ok) { if (firstInvalid) firstInvalid.focus(); return; }
      var success = document.getElementById('formSuccess');
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('role', 'status');
      }
      calc.reset();
      recalc();
      if (success) success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    /* убираем ошибку при вводе */
    calc.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('has-error') && e.target.value.trim() !== '') {
        wrap.classList.remove('has-error');
        e.target.classList.remove('is-invalid');
      }
    });
  }

  /* ============================================================
     Модальное окно входа / регистрации
     ============================================================ */
  var modal = document.getElementById('authModal');
  if (modal) {
    var lastFocus = null;
    function openModal(tab) {
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      if (tab) switchTab(tab);
      var first = modal.querySelector('.modal__tab.is-active');
      if (first) first.focus();
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function switchTab(name) {
      modal.querySelectorAll('.modal__tab').forEach(function (t) {
        t.classList.toggle('is-active', t.dataset.tab === name);
      });
      var title = modal.querySelector('[data-modal-title]');
      if (title) title.textContent = name === 'register' ? 'Регистрация' : 'Вход в личный кабинет';
    }
    document.querySelectorAll('[data-open-auth]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        openModal(b.dataset.openAuth || 'login');
      });
    });
    modal.querySelectorAll('.modal__tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.dataset.tab); });
    });
    modal.querySelectorAll('[data-close-modal]').forEach(function (b) {
      b.addEventListener('click', closeModal);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
    var authForm = modal.querySelector('form');
    if (authForm) authForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Демо-режим: авторизация имитируется. Заявку можно оформить и без входа.');
      closeModal();
    });
  }
})();
