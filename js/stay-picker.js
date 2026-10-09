// Seletor de datas da home (campos "Entrada" e "Saída" do formulário de contato).
// Mesmo calendário e mesma legenda do painel e da página de links; datas reservadas,
// pré-reservadas e bloqueadas aparecem marcadas e não podem ser escolhidas.
import { holidayForKey, monthTitle } from './holidays.js?v=20261008-2';

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
  let month = new Date(firstMonth), start = '', end = '', field = 'checkin';

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
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    prevBtn.addEventListener('click', () => shift(-1));
    dialog.querySelector('[data-next]').addEventListener('click', () => shift(1));
    dialog.querySelector('[data-clear]').addEventListener('click', () => { start = ''; end = ''; field = 'checkin'; hideInfo(); render(); });
    confirmBtn.addEventListener('click', confirm);
    grid.addEventListener('click', onPick);

    // deslizar para o lado troca o mês
    let sx = 0, sy = 0, tracking = false;
    grid.addEventListener('touchstart', e => { if (e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true; }, { passive: true });
    grid.addEventListener('touchend', e => {
      if (!tracking) return; tracking = false;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dy) < 40) shift(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function shift(dir) {
    const next = new Date(month.getFullYear(), month.getMonth() + dir, 1);
    if (next < firstMonth) return;
    month = next; hideInfo(); render();
  }
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
    if (!isFree(key)) { if (holiday) { showInfo(key, holiday); } else hideInfo(); return; }
    hideInfo();
    if (field === 'checkout' && start && key > start && !pathReserved(start, key)) {
      end = key;                                            // só trocando a saída
    } else if (!start || end || key <= start) {
      start = key; end = ''; field = 'checkin';             // nova entrada
    } else if (pathReserved(start, key)) {
      showConflict(); return;                               // tem data ocupada no meio
    } else {
      end = key;
    }
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

  async function open(which = 'checkin') {
    if (!dialog) build();
    field = which === 'checkout' ? 'checkout' : 'checkin';
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
      if (start && pathReserved(start, end || start)) { start = ''; end = ''; field = 'checkin'; }
      render();
    }
  }

  return { open };
}
