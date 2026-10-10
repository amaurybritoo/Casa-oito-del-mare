// Seletor de datas da home (campos "Entrada" e "Saída" do formulário de contato).
// Mesmo calendário e mesma legenda do painel e da página de links; datas reservadas,
// pré-reservadas e bloqueadas aparecem marcadas e não podem ser escolhidas.
import { holidayForKey, monthTitle, monthCrossKey } from './holidays.js?v=20261008-2';

const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = String(k).split('-').map(Number); return new Date(y, m - 1, d); };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brDate = k => k.split('-').reverse().join('/');
const WEEK = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const STATUS_LABEL = { reserved: 'reservado', pre: 'pré-reserva', blocked: 'bloqueado' };

// Mesmo critério da página de links: mapa dia -> status (só dias ocupados entram).
export function buildStatusMap(availability) {
  const map = new Map();
  const addRange = (start, end, status) => {
    if (!start) return;
    const a = parseKey(start), b = parseKey(end || start);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return;
    const from = a <= b ? a : b, to = a <= b ? b : a;
    for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const k = keyOf(d);
      if (!map.has(k)) map.set(k, status);
    }
  };
  (availability?.reservations || []).forEach(r => {
    if (!r) return;
    const start = r.check_in || r.checkIn || r.date;
    const end = r.check_out || r.checkOut || start;
    if (start) addRange(String(start), String(end), r.status || (r.reserved === false ? 'available' : 'reserved'));
  });
  (availability?.reservedDates || []).forEach(d => { if (!map.has(String(d))) map.set(String(d), 'reserved'); });
  return map;
}

export function initStayPicker({ checkin, checkout, getAvailability }) {
  if (!checkin || !checkout) return { open() {} };
  const now = new Date();
  const todayKey = keyOf(now);
  const firstMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let dialog = null, grid = null, titleEl = null, summaryEl = null, infoEl = null, confirmBtn = null, prevBtn = null;
  let map = new Map(), loaded = false, loading = null;
  let month = new Date(firstMonth), start = '', end = '';
  let suppressUntil = 0;

  const statusOf = k => map.get(k) || 'available';
  const isFree = k => k >= todayKey && statusOf(k) === 'available';
  const pathReserved = (a, b) => {
    for (const d = parseKey(a); keyOf(d) <= b; d.setDate(d.getDate() + 1)) { if (statusOf(keyOf(d)) !== 'available') return true; }
    return false;
  };

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'stay-picker';
    dialog.setAttribute('aria-label', 'Escolher as datas da estadia');
    dialog.innerHTML = `<div class="stay-dialog-inner">
      <button type="button" class="stay-picker-close" aria-label="Fechar">×</button>
      <p class="stay-picker-eyebrow">DATAS DA ESTADIA</p>
      <h3 class="stay-picker-title">Escolha a data ou o período</h3>
      <p class="stay-picker-summary" aria-live="polite"></p>
      <div class="calendar-head"><button type="button" data-prev aria-label="Mês anterior">‹</button><strong></strong><button type="button" data-next aria-label="Próximo mês">›</button></div>
      <div class="calendar-week" aria-hidden="true">${WEEK.map(w => `<span>${w}</span>`).join('')}</div>
      <div class="calendar-grid" role="grid"></div>
      <div class="calendar-holiday-info" hidden></div>
      <div class="cal-legend" role="list"><span role="listitem"><i class="cal-dot is-available"></i>disponível</span><span role="listitem"><i class="cal-dot is-pre"></i>pré-reserva</span><span role="listitem"><i class="cal-dot is-reserved"></i>reservado</span><span role="listitem"><i class="cal-dot is-blocked"></i>bloqueado</span><span role="listitem"><i class="cal-dot is-holiday"></i>feriado</span><span role="listitem"><i class="cal-dot is-holiday-rj"></i>feriado RJ</span></div>
      <div class="cal-legend-foot"><span>1 toque = diária · 2 toques = período</span></div>
      <div class="stay-picker-actions"><button type="button" class="stay-picker-clear" data-clear>Limpar</button><button type="button" class="stay-picker-confirm" data-confirm>Confirmar datas</button></div>
    </div>`;
    document.body.appendChild(dialog);
    grid = dialog.querySelector('.calendar-grid');
    titleEl = dialog.querySelector('.calendar-head strong');
    summaryEl = dialog.querySelector('.stay-picker-summary');
    infoEl = dialog.querySelector('.calendar-holiday-info');
    confirmBtn = dialog.querySelector('[data-confirm]');
    prevBtn = dialog.querySelector('[data-prev]');

    dialog.querySelector('.stay-picker-close').addEventListener('click', () => dialog.close());
    // Clicar no fundo escuro fecha; clicar fora das datas (espaço vazio da janela) limpa a seleção.
    dialog.addEventListener('click', e => {
      if (e.target === dialog) { resetSelection(); dialog.close(); return; }
      if (Date.now() < suppressUntil) return;
      if (!e.target.closest('button, .calendar-day:not(.empty), .calendar-holiday-info, .cal-legend')) resetSelection();
    });
    prevBtn.addEventListener('click', () => shift(-1));
    dialog.querySelector('[data-next]').addEventListener('click', () => shift(1));
    dialog.querySelector('[data-clear]').addEventListener('click', resetSelection);
    confirmBtn.addEventListener('click', confirm);
    grid.addEventListener('click', onPick);

    bindGestures();
  }

  // ===== Gestos (iguais aos do painel e da página de links) =====
  // Segurar numa data livre e arrastar seleciona o período; deslizar para o lado troca o mês.
  // Durante o arraste, o mês só troca se não houver data ocupada entre o início da seleção e o outro mês.
  function bindGestures() {
    let holdTimer = null, edgeTimer = null, pointerId = null, dragging = false, swiping = false;
    let startX = 0, startY = 0, dragStartKey = '', dragLastKey = '', edgeHintUntil = 0;
    const stopTimers = () => { clearTimeout(holdTimer); holdTimer = null; clearInterval(edgeTimer); edgeTimer = null; };
    const keyUnder = (x, y) => document.elementFromPoint(x, y)?.closest?.('.stay-picker .calendar-day[data-date]')?.dataset.date || '';
    const firstFree = dir => {
      const free = [...grid.querySelectorAll('.calendar-day[data-date]')].filter(b => isFree(b.dataset.date));
      return free.length ? (dir > 0 ? free[0] : free[free.length - 1]).dataset.date : '';
    };
    const pathBlocked = dir => {
      if (!dragStartKey) return false;
      const dest = monthCrossKey(month, dir), a = dragStartKey;
      return pathReserved(a < dest ? a : dest, a < dest ? dest : a);
    };
    const applyDragKey = key => {
      if (!dragging || !isFree(key) || key === dragLastKey) return;
      const a = dragStartKey, lo = a <= key ? a : key, hi = a <= key ? key : a;
      if (pathReserved(lo, hi)) return;                      // não atravessa data ocupada
      dragLastKey = key; start = lo; end = hi > lo ? hi : '';
      hideInfo(); render();
    };
    const edgeStep = dir => {
      if (!dragging) return;
      if (pathBlocked(dir)) {                                // bloqueio silencioso (só vibração onde houver)
        if (Date.now() >= edgeHintUntil) { edgeHintUntil = Date.now() + 1800; try { navigator.vibrate?.(18); } catch { /* sem vibração */ } }
        return;
      }
      if (!shift(dir)) return;
      const boundary = firstFree(dir);
      if (boundary) applyDragKey(boundary);
    };
    const moveSelection = (x, y) => {
      if (!dragging) return;
      const key = keyUnder(x, y); if (key) applyDragKey(key);
      const r = grid.getBoundingClientRect(), edge = 44;
      if (x > r.right - edge) { if (!edgeTimer) edgeTimer = setInterval(() => edgeStep(1), 300); }
      else if (x < r.left + edge) { if (!edgeTimer) edgeTimer = setInterval(() => edgeStep(-1), 300); }
      else { clearInterval(edgeTimer); edgeTimer = null; }
    };
    const beginLongPress = () => {
      if (!dragStartKey || swiping) return;
      holdTimer = null; dragging = true;
      start = dragStartKey; end = ''; hideInfo();
      if (pointerId !== null) { try { grid.setPointerCapture(pointerId); } catch { /* ok */ } }
      render();
    };
    const finish = () => {
      stopTimers();
      if (pointerId !== null) { try { grid.releasePointerCapture(pointerId); } catch { /* ok */ } }
      pointerId = null; dragging = false; swiping = false; dragStartKey = ''; dragLastKey = '';
    };
    grid.style.touchAction = 'none';
    grid.addEventListener('pointerdown', e => {
      if (pointerId !== null) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const btn = e.target.closest?.('.calendar-day[data-date]');
      if (!btn) return;
      pointerId = e.pointerId; startX = e.clientX; startY = e.clientY; dragging = false; swiping = false; dragStartKey = ''; dragLastKey = '';
      const key = btn.dataset.date || '';
      // Sem captura aqui: capturar no pointerdown redireciona o clique e o toque simples deixa de selecionar.
      if (key && isFree(key)) { dragStartKey = key; dragLastKey = key; holdTimer = setTimeout(beginLongPress, 450); }
    });
    grid.addEventListener('pointermove', e => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging && !swiping && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        if (Math.abs(dx) > Math.abs(dy) * 1.12 && Math.abs(dx) > 26) { swiping = true; clearTimeout(holdTimer); holdTimer = null; }
        else if (Math.abs(dy) > Math.abs(dx)) { clearTimeout(holdTimer); holdTimer = null; }
      }
      if (swiping || dragging) { moveSelection(e.clientX, e.clientY); e.preventDefault(); if (!grid.hasPointerCapture(pointerId)) { try { grid.setPointerCapture(pointerId); } catch { /* ok */ } } }
    });
    grid.addEventListener('pointerup', e => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX, dy = e.clientY - startY, wasDrag = dragging, wasSwipe = swiping;
      stopTimers();
      if (wasDrag) { suppressUntil = Date.now() + 700; render(); finish(); return; }
      if (wasSwipe || (Math.abs(dx) >= 52 && Math.abs(dx) > Math.abs(dy) * 1.12)) { if (shift(dx < 0 ? 1 : -1)) suppressUntil = Date.now() + 700; }
      finish();
    });
    grid.addEventListener('pointercancel', e => { if (pointerId === e.pointerId) finish(); });
    grid.addEventListener('lostpointercapture', () => { if (pointerId !== null && !dragging && !swiping) finish(); });
    grid.addEventListener('contextmenu', e => { if (dragging) e.preventDefault(); });
    grid.addEventListener('click', e => { if (Date.now() < suppressUntil) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  function shift(dir) {
    const next = new Date(month.getFullYear(), month.getMonth() + dir, 1);
    if (next < firstMonth) return false;
    month = next; hideInfo(); render(); return true;
  }
  function resetSelection() { start = ''; end = ''; hideInfo(); if (grid) render(); }
  function hideInfo() { if (infoEl) { infoEl.hidden = true; infoEl.innerHTML = ''; } }
  function showInfo(key, holiday) {
    const scope = holiday.scope === 'rj' ? 'Feriado estadual · Rio de Janeiro' : 'Feriado nacional';
    infoEl.innerHTML = `<em class="${holiday.scope === 'rj' ? 'rj' : ''}" aria-hidden="true"></em><span><b>${esc(holiday.name)}</b><small>${scope} · ${brDate(key)}</small></span>`;
    infoEl.hidden = false;
  }
  function showConflict() {
    infoEl.innerHTML = '<em class="warn" aria-hidden="true"></em><span><b>Período indisponível</b><small>Há datas reservadas entre a entrada e a saída. Escolha outro período.</small></span>';
    infoEl.hidden = false;
  }

  function render() {
    titleEl.textContent = monthTitle(month);
    prevBtn.disabled = month <= firstMonth;
    const y = month.getFullYear(), m = month.getMonth();
    const lead = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < lead; i++) html += '<span class="calendar-day empty" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const key = `${y}-${pad(m + 1)}-${pad(d)}`;
      const st = statusOf(key), past = key < todayKey, holiday = holidayForKey(key);
      const cls = ['calendar-day'];
      if (past) cls.push('is-past');
      if (st !== 'available') cls.push('is-' + st);
      if (holiday) cls.push('is-holiday', ...(holiday.scope === 'rj' ? ['is-holiday-rj'] : []));
      if (key === start) cls.push('is-checkin');
      if (end && key === end) cls.push('is-checkout');
      if (start && end && key > start && key < end) cls.push('is-range');
      const blocked = past || st !== 'available';
      const label = `${d} de ${monthTitle(new Date(y, m, 1)).toLowerCase()}${blocked && !past ? ', ' + (STATUS_LABEL[st] || 'indisponível') : ''}${holiday ? ', ' + holiday.name : ''}`;
      html += `<button type="button" class="${cls.join(' ')}" data-date="${key}" aria-label="${esc(label)}"${blocked ? ' aria-disabled="true"' : ''}><span>${d}</span></button>`;
    }
    grid.innerHTML = html;
    summaryEl.textContent = !start
      ? 'Toque numa data para uma diária, ou em duas datas para um período'
      : end ? `Entrada ${brDate(start)} · Saída ${brDate(end)}`
      : `Diária em ${brDate(start)} — toque em outra data para escolher um período`;
    confirmBtn.textContent = !start ? 'Confirmar' : end ? 'Confirmar período' : 'Confirmar diária';
    confirmBtn.disabled = !start;
  }

  function onPick(e) {
    const btn = e.target.closest('.calendar-day[data-date]');
    if (!btn) return;
    const key = btn.dataset.date;
    const holiday = holidayForKey(key);
    if (!isFree(key)) { if (holiday) showInfo(key, holiday); else hideInfo(); return; }
    hideInfo();
    if (key === start) { resetSelection(); return; }          // 2º toque na entrada/diária: limpa tudo
    if (key === end) { end = ''; render(); return; }          // 2º toque na saída: fica só a entrada (diária)
    if (!start || end || key < start) { start = key; end = ''; }            // nova entrada (ou diária)
    else if (pathReserved(start, key)) { showConflict(); return; }          // tem data ocupada no meio
    else end = key;                                                         // saída: período
    if (holiday) showInfo(key, holiday);
    render();
  }

  function confirm() {
    if (!start) return;
    checkin.value = start;
    checkout.value = end || '';
    ['input', 'change'].forEach(t => { checkin.dispatchEvent(new Event(t, { bubbles: true })); checkout.dispatchEvent(new Event(t, { bubbles: true })); });
    dialog.close();
  }

  async function ensureAvailability() {
    if (loaded) return;
    loading = loading || (async () => {
      try {
        const availability = await Promise.race([getAvailability(), new Promise(r => setTimeout(() => r(null), 3000))]);
        if (availability) map = buildStatusMap(availability);
      } catch { /* sem conexão: o calendário abre sem as marcações */ }
      loaded = true;
    })();
    await loading;
  }

  async function open() {
    if (!dialog) build();
    start = checkin.value || ''; end = checkout.value || '';
    if (start && start < todayKey) { start = ''; end = ''; }
    if (end && end <= start) end = '';
    const base = start ? parseKey(start) : now;
    month = new Date(base.getFullYear(), base.getMonth(), 1);
    if (month < firstMonth) month = new Date(firstMonth);
    hideInfo(); render();
    if (!dialog.open) dialog.showModal();
    if (!loaded) {
      summaryEl.textContent = 'Carregando disponibilidade…';
      await ensureAvailability();
      // se a pessoa já tinha escolhido datas que agora aparecem ocupadas, limpa
      if (start && pathReserved(start, end || start)) { start = ''; end = ''; }
      render();
    }
  }

  return { open };
}
