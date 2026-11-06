// Navegação inferior mobile. Inicializada pelo módulo principal após registrar a navegação central.
export function initBottomNavigation(navigate) {
  const bar = document.getElementById('bottomNav');
  const sheet = document.getElementById('bnSheet');
  const backdrop = document.getElementById('bnBackdrop');
  const moreBtn = document.getElementById('bnMore');
  const aside = document.querySelector('#app>aside');
  if (!bar || !sheet || !backdrop || !moreBtn || !aside) return;

  // Mede a altura real da barra (incluindo safe-area do iPhone) para manter
  // a folha Mais sempre acima dela, sem cobrir os cinco atalhos.
  const measureBottomBar = () => {
    const height = Math.ceil(bar.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--bn-bar-height', `${height}px`);
  };
  measureBottomBar();
  if ('ResizeObserver' in window) new ResizeObserver(measureBottomBar).observe(bar);
  window.addEventListener('resize', measureBottomBar, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(measureBottomBar, 120), { passive: true });

  const tabs = [...bar.querySelectorAll('[data-tab]')];
  const items = [...sheet.querySelectorAll('[data-go]')];
  const mq = window.matchMedia('(max-width:850px)');
  const initialView = () => sessionStorage.getItem('adminViewAfterReload') || new URLSearchParams(location.search).get('view') || 'overview';

  const activeView = () => aside.querySelector('nav button[data-view].active')?.dataset.view || initialView();

  function sync() {
    const active = activeView();
    const inTabs = tabs.some(t => t.dataset.tab === active);
    tabs.forEach(t => {
      const on = t.dataset.tab === active;
      t.classList.toggle('on', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    moreBtn.classList.toggle('on', !inTabs);
    items.forEach(i => i.classList.toggle('on', i.dataset.go === active));
  }

  let sheetOpen = false;
  let lockedScrollY = 0;
  let previousBodyStyles = null;
  const preventBackgroundTouch = event => {
    if (sheetOpen && !sheet.contains(event.target) && event.cancelable) event.preventDefault();
  };
  function openSheet() {
    if (sheetOpen) return;
    sheetOpen = true;
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.addEventListener('touchmove', preventBackgroundTouch, { capture: true, passive: false });
    sheet.style.transform = '';
    measureBottomBar();
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.setAttribute('aria-modal', 'true');
    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden', 'false');
    moreBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => sheet.querySelector('[data-sheet-close]')?.focus({ preventScroll: true }));
    document.documentElement.classList.add('bn-lock');
    document.body.classList.add('bn-lock');
  }
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.style.transform = '';
    sheet.classList.remove('open', 'is-dragging');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.removeAttribute('aria-modal');
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden', 'true');
    moreBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('bn-lock');
    document.body.classList.remove('bn-lock');
    document.removeEventListener('touchmove', preventBackgroundTouch, true);
    if (previousBodyStyles) {
      Object.assign(document.body.style, previousBodyStyles);
      previousBodyStyles = null;
    }
    window.scrollTo(0, lockedScrollY);
    if (mq.matches) requestAnimationFrame(() => moreBtn.focus({ preventScroll: true }));
  }

  function go(view) {
    closeSheet();
    // Usa exclusivamente a navegação central do painel. Não simula cliques em
    // elementos da sidebar, que fica oculta no mobile.
    if (typeof navigate !== 'function') {
      console.error('[BottomNav] Navegação central não foi inicializada.');
      return;
    }
    const navigated = navigate(view);
    if (!navigated) {
      console.warn(`[BottomNav] A tela "${view}" não foi encontrada.`);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    sync();
  }

  tabs.forEach(t => t.addEventListener('click', () => go(t.dataset.tab)));
  items.forEach(i => i.addEventListener('click', () => go(i.dataset.go)));
  moreBtn.addEventListener('click', () => (sheetOpen ? closeSheet() : openSheet()));
  sheet.querySelectorAll('[data-sheet-close]').forEach(button => button.addEventListener('click', closeSheet));
  backdrop.addEventListener('click', closeSheet);
  document.getElementById('bnLogout')?.addEventListener('click', () => { closeSheet(); document.getElementById('logout')?.click(); });
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  mq.addEventListener?.('change', e => { if (!e.matches) closeSheet(); });

  // Só o puxador fecha a folha por gesto. Rolar a lista nunca arrasta o painel.
  const grab = sheet.querySelector('.bn-grab');
  let startY = 0, dy = 0, dragging = false;
  grab?.addEventListener('touchstart', e => {
    if (!e.touches.length) return;
    startY = e.touches[0].clientY; dy = 0; dragging = true;
  }, { passive: true });
  grab?.addEventListener('touchmove', e => {
    if (!dragging || !e.touches.length) return;
    dy = Math.max(0, e.touches[0].clientY - startY);
    if (dy > 0) {
      sheet.classList.add('is-dragging');
      sheet.style.transform = `translateY(${dy}px)`;
    }
  }, { passive: true });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    if (dy > 90) closeSheet();
    else sheet.style.transform = '';
  };
  grab?.addEventListener('touchend', endDrag);
  grab?.addEventListener('touchcancel', endDrag);

  // Teclado aberto: esconde a barra para ela não subir junto com o teclado.
  const typing = el => el && (el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && !/^(checkbox|radio|range|file|button|submit|reset|color)$/i.test(el.type)));
  document.addEventListener('focusin', e => { if (mq.matches && typing(e.target)) bar.classList.add('is-hidden'); });
  document.addEventListener('focusout', () => setTimeout(() => { if (!typing(document.activeElement)) bar.classList.remove('is-hidden'); }, 80));

  // Mantém a aba marcada igual ao botão ativo da barra lateral (inclui os atalhos da Visão geral e o tutorial).
  new MutationObserver(sync).observe(aside, { subtree: true, attributes: true, attributeFilter: ['class'] });
  sync();
}
