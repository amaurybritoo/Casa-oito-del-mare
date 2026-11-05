// Bottom navigation do painel (celular/tablet). Reaproveita os botões da barra lateral:
// cada toque aqui "clica" no botão equivalente do <aside>, então render(), estado ativo e tutorial seguem iguais.
(() => {
  const bar = document.getElementById('bottomNav');
  const sheet = document.getElementById('bnSheet');
  const backdrop = document.getElementById('bnBackdrop');
  const moreBtn = document.getElementById('bnMore');
  const aside = document.querySelector('#app>aside');
  if (!bar || !sheet || !backdrop || !moreBtn || !aside) return;

  const tabs = [...bar.querySelectorAll('[data-tab]')];
  const items = [...sheet.querySelectorAll('[data-go]')];
  const mq = window.matchMedia('(max-width:850px)');
  const sideBtn = view => aside.querySelector(`nav button[data-view="${view}"]`);
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
  function openSheet() {
    sheetOpen = true;
    sheet.style.transform = '';
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('show');
    moreBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('bn-lock');
    document.body.classList.add('bn-lock');
  }
  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    sheet.style.transform = '';
    sheet.classList.remove('open', 'is-dragging');
    sheet.setAttribute('aria-hidden', 'true');
    backdrop.classList.remove('show');
    moreBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('bn-lock');
    document.body.classList.remove('bn-lock');
  }

  function go(view) {
    const btn = sideBtn(view);
    if (!btn) return;
    closeSheet();
    if (btn.classList.contains('active')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    btn.click();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  tabs.forEach(t => t.addEventListener('click', () => go(t.dataset.tab)));
  items.forEach(i => i.addEventListener('click', () => go(i.dataset.go)));
  moreBtn.addEventListener('click', () => (sheetOpen ? closeSheet() : openSheet()));
  backdrop.addEventListener('click', closeSheet);
  document.getElementById('bnLogout')?.addEventListener('click', () => { closeSheet(); document.getElementById('logout')?.click(); });
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  mq.addEventListener?.('change', e => { if (!e.matches) closeSheet(); });

  // Arrastar a folha para baixo fecha.
  let startY = 0, dy = 0, dragging = false;
  sheet.addEventListener('touchstart', e => {
    if (sheet.scrollTop > 0) return;
    startY = e.touches[0].clientY; dy = 0; dragging = true;
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (!dragging) return;
    dy = e.touches[0].clientY - startY;
    if (dy <= 0) { sheet.style.transform = ''; return; }
    sheet.classList.add('is-dragging');
    sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    sheet.classList.remove('is-dragging');
    if (dy > 90) closeSheet(); else sheet.style.transform = '';
  };
  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);

  // Teclado aberto: esconde a barra para ela não subir junto com o teclado.
  const typing = el => el && (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' ||
    (el.tagName === 'INPUT' && !/^(checkbox|radio|range|file|button|submit|reset|color)$/i.test(el.type)));
  document.addEventListener('focusin', e => { if (mq.matches && typing(e.target)) bar.classList.add('is-hidden'); });
  document.addEventListener('focusout', () => setTimeout(() => { if (!typing(document.activeElement)) bar.classList.remove('is-hidden'); }, 80));

  // Mantém a aba marcada igual ao botão ativo da barra lateral (inclui os atalhos da Visão geral e o tutorial).
  new MutationObserver(sync).observe(aside, { subtree: true, attributes: true, attributeFilter: ['class'] });
  sync();
})();
