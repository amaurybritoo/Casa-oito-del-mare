// Tutorial guiado das Reservas — estilo "jogo": um alvo destacado por vez, uma mão mostrando onde tocar,
// e avanço automático assim que a pessoa faz a ação. Só os passos de explicação têm botão OK.
// MODO SIMULAÇÃO: enquanto roda, nada é gravado no Supabase (admin.js consulta window.__casaTour.sandbox).
// A reserva de teste existe só na tela e some ao terminar/pular; a agenda real nunca é afetada.

const DONE_KEY = 'casaAdminTourDone';
let hooks = { goToReservations: async () => {} };
let running = false;
let state = null;

export function initAdminTour(options) { hooks = { ...hooks, ...options }; }

const css = `
.tour-shade{position:fixed!important;inset:auto;z-index:2147482990;background:rgba(7,24,25,.7);pointer-events:auto;transition:background .22s ease,backdrop-filter .22s ease}.tour-shade.is-completion{background:rgba(3,10,11,.90);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.tour-cover{position:fixed;z-index:2147482991;background:transparent;pointer-events:auto}
.tour-ring{position:fixed;z-index:2147482992;pointer-events:none;border:3px solid #f0c48a;border-radius:14px;box-shadow:0 0 0 5px rgba(240,196,138,.25),0 0 28px rgba(240,196,138,.55);animation:tourPulse 1.4s ease-in-out infinite}
.tour-ring.nudge{animation:tourNudge .9s ease-out}
.tour-hand{position:fixed;z-index:2147482993;pointer-events:none;width:0;height:0}
.tour-hand i{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:3px solid #f0c48a;opacity:0;animation:tourTap 1.4s ease-out infinite}
.tour-hand i:nth-child(2){animation-delay:.45s}
.tour-hand svg{position:absolute;left:2px;top:4px;width:38px;height:38px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.4));animation:tourPoint 1s ease-in-out infinite}
@keyframes tourPulse{0%,100%{box-shadow:0 0 0 4px rgba(240,196,138,.30),0 0 22px rgba(240,196,138,.45)}50%{box-shadow:0 0 0 10px rgba(240,196,138,.10),0 0 34px rgba(240,196,138,.65)}}
@keyframes tourNudge{0%{transform:scale(1);box-shadow:0 0 0 4px rgba(240,196,138,.5)}35%{transform:scale(1.05);box-shadow:0 0 0 18px rgba(240,196,138,.35),0 0 46px rgba(240,196,138,.9)}100%{transform:scale(1);box-shadow:0 0 0 5px rgba(240,196,138,.25),0 0 28px rgba(240,196,138,.55)}}
@keyframes tourTap{0%{transform:scale(.35);opacity:.95}100%{transform:scale(1.25);opacity:0}}
@keyframes tourPoint{0%,100%{transform:translate(0,0)}50%{transform:translate(-5px,-6px)}}
@keyframes tourIn{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes tourInC{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}
.tour-card{position:fixed!important;z-index:2147483000!important;left:50%!important;width:min(430px,calc(100vw - 28px))!important;height:max-content!important;min-height:0!important;max-height:min(54dvh,430px)!important;overflow:auto;transform:translateX(-50%);box-sizing:border-box;padding:14px 16px 14px;border-radius:22px;background:#fbfaf5;color:#173b3d;box-shadow:0 24px 64px rgba(0,0,0,.4),0 0 0 1px rgba(23,59,61,.08);font:400 13px/1.5 'DM Sans',Arial,sans-serif;overscroll-behavior:contain;animation:tourIn .22s ease-out both;isolation:isolate}
.tour-card:before{content:'';position:sticky;top:-14px;display:block;height:4px;margin:-14px -16px 12px;background:linear-gradient(90deg,#c9965f,#f0c48a,#c9965f)}
.tour-card.is-bottom{bottom:calc(10px + env(safe-area-inset-bottom,0px))}
.tour-card.is-top{top:10px}
.tour-card.is-center{top:50%!important;bottom:auto!important;transform:translate(-50%,-50%);height:max-content!important;min-height:0!important;max-height:min(84dvh,580px);animation-name:tourInC}.tour-card.is-done{left:50%!important;top:50%!important;bottom:auto!important;width:min(390px,calc(100vw - 32px))!important;height:max-content!important;min-height:0!important;max-height:none!important;padding:15px 17px 17px}.tour-card.is-done .tour-top{margin-bottom:8px}.tour-card.is-done h3{font-size:25px;margin-bottom:7px}.tour-card.is-done .tour-body{font-size:12px}.tour-card.is-done .tour-body p{margin-bottom:5px}.tour-card.is-done .tour-actions{margin-top:10px}
.tour-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.tour-count{flex:none;display:grid;place-items:center;min-width:38px;height:22px;padding:0 9px;border-radius:99px;background:#173b3d;color:#f0c48a;font:700 11px 'DM Sans',Arial,sans-serif;letter-spacing:.04em}
.tour-steps{display:flex;gap:3px;flex:1;min-width:0}
.tour-steps b{flex:1;height:5px;border-radius:3px;background:#e4dfd0;transition:background .3s}
.tour-steps b.on{background:#c9965f}.tour-steps b.cur{background:#173b3d}
.tour-skip{flex:none;border:0;background:transparent;color:#7b8a84;font:600 11px 'DM Sans',Arial,sans-serif;cursor:pointer;padding:6px 2px;text-decoration:underline}
.tour-back{flex:none;width:32px;height:32px;display:grid;place-items:center;border:1px solid rgba(23,59,61,.14);border-radius:10px;background:#fffdf8;color:#173b3d;font:700 20px/1 'DM Sans',Arial,sans-serif;cursor:pointer;transition:background .15s,border-color .15s,transform .1s}.tour-back:hover:not(:disabled){background:#f1ece0;border-color:rgba(23,59,61,.24)}.tour-back:active:not(:disabled){transform:scale(.95)}.tour-back:disabled{opacity:.35;cursor:not-allowed}
.tour-card h3{margin:0 0 8px;font:500 24px/1.08 'Cormorant Garamond',Georgia,serif;color:#173b3d}
.tour-say{display:flex;gap:10px;align-items:center;margin:0 0 9px;padding:10px 12px;border-radius:13px;background:linear-gradient(135deg,#f7ecd4,#fcf5e6);border:1px solid #ecd8ae;color:#5a3e12;font-weight:700;font-size:14px;line-height:1.35;user-select:none;-webkit-user-select:none;transition:background .2s,border-color .2s,color .2s}
.tour-say:before{content:'';flex:none;width:26px;height:26px;border-radius:50%;background:#c9965f url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 3l12 8.5-5.2 1.2 3 5.6-2.6 1.4-3-5.6L6 18z' fill='%23fff'/%3E%3C/svg%3E") center/15px no-repeat}
.tour-card.is-done .tour-say{background:#e2f1e6;border-color:#b6dcc0;color:#1d6a3a}
.tour-card.is-done .tour-say:before{background:#2f9e5b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/15px no-repeat}
.tour-actions .tour-next{position:relative;isolation:isolate;overflow:hidden;min-width:170px;background:linear-gradient(135deg,#16834b,#2f9e5b);color:#fff;border:1px solid #147343;box-shadow:0 10px 22px rgba(47,158,91,.25),inset 0 1px 0 rgba(255,255,255,.18);font-weight:800;letter-spacing:.01em;transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}.tour-actions .tour-next:before{content:'';position:absolute;inset:-40% auto -40% -35%;width:34%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.58),transparent);transform:skewX(-18deg) translateX(-180%);animation:tourNextShine 2.6s ease-in-out infinite;pointer-events:none;z-index:-1}.tour-actions .tour-next:after{content:'→';margin-left:9px;font-size:17px;display:inline-block;transition:transform .2s ease}.tour-actions .tour-next:hover{transform:translateY(-2px);filter:saturate(1.08);box-shadow:0 15px 30px rgba(47,158,91,.34),inset 0 1px 0 rgba(255,255,255,.22)}.tour-actions .tour-next:hover:after{transform:translateX(4px)}.tour-actions .tour-next:active{transform:translateY(0) scale(.98)}.tour-actions .tour-next:focus-visible{outline:3px solid rgba(47,158,91,.28);outline-offset:3px}@keyframes tourNextShine{0%,55%{transform:skewX(-18deg) translateX(-180%)}75%,100%{transform:skewX(-18deg) translateX(430%)}}.tour-card.is-done{animation:tourDoneIn .34s cubic-bezier(.18,.8,.24,1) both}.tour-card.is-done .tour-actions{justify-content:center}.tour-card.is-done .tour-next{animation:tourNextPop .42s .08s cubic-bezier(.18,.85,.25,1) both}@keyframes tourDoneIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.90)}65%{opacity:1;transform:translate(-50%,-50%) scale(1.025)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes tourNextPop{0%{opacity:0;transform:translateY(10px) scale(.9)}100%{opacity:1;transform:translateY(0) scale(1)}}.tour-confetti{position:fixed;z-index:2147483005;left:0;top:0;width:100vw;height:100vh;pointer-events:none;overflow:hidden}.tour-confetti i{position:absolute;left:var(--cx);top:var(--cy);width:var(--w);height:var(--h);border-radius:2px;background:var(--c);transform:translate(-50%,-50%) rotate(var(--r)) scale(.45);animation:tourConfetti var(--dur) cubic-bezier(.08,.72,.2,1) forwards;animation-delay:var(--d);will-change:transform,opacity}.tour-confetti i.star{width:13px;height:13px;background:transparent}.tour-confetti i.star:before{content:'✦';position:absolute;inset:0;color:var(--c);font-size:17px;line-height:13px;text-align:center;text-shadow:0 0 8px rgba(255,255,255,.5)}.tour-confetti i.ribbon{width:4px;height:25px;border-radius:99px}.tour-confetti i.dot{width:9px;height:9px;border-radius:50%}@keyframes tourConfetti{0%{opacity:0;transform:translate(-50%,-50%) translate(0,0) rotate(0) scale(.45)}10%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) translate(var(--x),var(--fall)) rotate(var(--rot)) scale(1)}}
.tour-body{color:#445c5a;font-size:12.5px}.tour-body p{margin:0 0 6px}.tour-body p:last-child{margin-bottom:0}
.tour-body.is-tip{padding:10px 12px;border-radius:12px;background:#f0f3ee}
.tour-body.is-tip:before{content:'Entenda';display:block;margin-bottom:3px;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8b7a5f}
.tour-body b{color:#173b3d}.tour-body ul{margin:6px 0;padding-left:18px}.tour-body li{margin:2px 0}
.tour-body em{font-style:normal;color:#8a5d17;font-weight:600}
.tour-chip{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700}
.tour-chip.res{background:#f3dcd9;color:#9f4b4b}.tour-chip.pre{background:#f7e6c3;color:#8a5d17}.tour-chip.blk{background:#dfe2e0;color:#4d5654}
.tour-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:11px}
.tour-actions:empty{display:none}
.tour-actions button{min-height:44px;padding:0 20px;border-radius:12px;border:0;font:700 14px 'DM Sans',Arial,sans-serif;cursor:pointer;transition:opacity .15s,transform .1s}
.tour-actions button:active{transform:scale(.97)}
.tour-ok{background:#173b3d;color:#fff;min-width:110px}.tour-ok:disabled{opacity:.35;cursor:not-allowed}
.tour-fill{background:#f1e3cc;color:#6d4b1f}
@media(prefers-reduced-motion:reduce){.tour-ring,.tour-hand i,.tour-hand svg,.tour-card{animation:none}}
@media (max-width:700px){
  .tour-card{width:calc(100vw - 24px)!important;max-width:none!important;border-radius:18px;padding:13px 14px 14px;box-shadow:0 18px 46px rgba(0,0,0,.46),0 0 0 1px rgba(23,59,61,.08)}
  .tour-card:before{margin:-13px -14px 10px}
  .tour-card h3{font-size:23px;margin-bottom:7px}
  .tour-body{font-size:12px}
  .tour-say{font-size:13px;margin-bottom:8px;padding:9px 10px}
  .tour-actions .tour-next{min-width:164px}
  .tour-card.is-done{width:calc(100vw - 24px)!important;max-width:none!important}
}

`;
function ensureStyle() {
  let style = document.getElementById('casaTourStyle');
  if (!style) { style = document.createElement('style'); style.id = 'casaTourStyle'; document.head.appendChild(style); }
  style.textContent = css;
}

const q = (sel, root = document) => root.querySelector(sel);
const editorEl = sel => q('dialog.reservation-dialog[open] form.reservation-form ' + sel);
const editorOpen = () => !!q('dialog.reservation-dialog[open] form.reservation-form');
const pickerOpen = () => !!q('dialog.reservation-date-picker-dialog[open]');
const previewOpen = () => !!q('dialog.reservation-preview-dialog[open]');
const confirmOpen = () => !!q('dialog.reservation-confirm-dialog[open]');
const cardIds = () => [...document.querySelectorAll('#reservationCards [data-res-id]')].map(b => b.dataset.resId);
const cardOf = id => id ? [...document.querySelectorAll('#reservationCards .reservation-card')].find(c => c.querySelector('[data-res-id]')?.dataset.resId === id) || null : null;
const editBtnOf = id => cardOf(id)?.querySelector('.reservation-card-edit') || null;
const editorH2 = () => (editorEl('h2')?.textContent || '').trim();
const val = sel => (editorEl(sel)?.value || '');
const setValue = (el, value) => { if (!el) return; el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
const cardName = id => (cardOf(id)?.querySelector('strong')?.textContent || '').trim();

// Sugere entrada e saída (2 diárias) em dias livres do mês exibido, para a mão apontar o lugar certo.
function addDays(key, n) { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const dayCell = key => q(`#reservationGrid button[data-res-date="${key}"]`);
const isFree = c => !!c && !c.disabled && !c.classList.contains('is-date-disabled') && /status-available/.test(c.className);
function suggestPeriod() {
  for (const c of document.querySelectorAll('#reservationGrid button[data-res-date]')) {
    if (!isFree(c)) continue;
    const k = c.dataset.resDate, mid = dayCell(addDays(k, 1)), end = dayCell(addDays(k, 2));
    if (isFree(mid) && isFree(end)) return { start: c, end };
  }
  return null;
}
function suggestDay() {
  return [...document.querySelectorAll('#reservationGrid button[data-res-date]')].find(isFree) || null;
}

function buildSteps() {
  const S = state;
  const pre = '<span class="tour-chip pre">Pré-reservado</span>', res = '<span class="tour-chip res">Reservado</span>', blk = '<span class="tour-chip blk">Bloqueado</span>';
  const ack = k => S.acks.add(k);
  const nameOk = () => val('input[name="name"]').trim().length >= 2;
  const phoneOk = () => val('input[name="phone"]').replace(/\D/g, '').length >= 10;
  const editBtn = () => editBtnOf(S.resId);
  return [
    { title: 'Crie uma diária simples', enter: () => { S.before = new Set(cardIds()); S.dailyId = null; },
      html: `<p>Uma <b>diária</b> é uma estadia de apenas um dia: você escolhe a entrada e salva sem marcar uma saída diferente.</p><p>É o jeito mais rápido de registrar uma data ocupada.</p>`,
      done: () => editorOpen(),
      phase: () => {
        const grid = q('#reservationGrid');
        const start = q('#reservationGrid .is-range-start');
        if (!start) { const sug = suggestDay(); return { el: sug || grid, hand: !!sug, say: 'Toque em uma data livre destacada.' }; }
        return { el: q('[data-register-reservation]'), say: 'Agora toque em Cadastrar reserva.', info: `<p>Como só existe uma data selecionada, o sistema vai abrir uma <b>diária</b>.</p>` };
      } },

    { title: 'Dados da diária', enter: () => { S.acks.clear(); },
      html: `<p>Agora vamos identificar o hóspede e salvar essa diária de teste.</p>`,
      done: () => { const id = cardIds().find(x => !S.before.has(x)); if (id) S.dailyId = id; return !!S.dailyId && !editorOpen(); },
      phase: () => {
        const exemplo = { label: 'Preencher exemplo', run: () => { setValue(editorEl('input[name="name"]'), 'Maria Silva (teste)'); setValue(editorEl('input[name="phone"]'), '(21) 99999-0000'); setValue(editorEl('textarea[name="note"]'), 'Diária de demonstração · chegada às 14h'); ack('daily'); } };
        if (!S.acks.has('daily')) return {
          els: [editorEl('input[name="name"]'), editorEl('input[name="phone"]')].filter(Boolean),
          say: 'Digite o nome e o telefone ou use Preencher exemplo.', fill: exemplo,
          ok: { key: 'daily', enabled: nameOk() && phoneOk() },
          info: `<p>O telefone recebe a nova máscara automaticamente. A observação é opcional.</p>` };
        return { el: editorEl('button[type="submit"]'), say: 'Toque em Salvar reserva.', info: `<p>A diária de teste ficará visível na agenda, mas continuará dentro da simulação.</p>` };
      } },

    { title: 'Agora reserve um período', enter: () => { S.before = new Set(cardIds()); },
      html: `<p>Para uma estadia de mais de um dia, selecione <b>entrada</b> e depois <b>saída</b>. O intervalo fica destacado no calendário.</p>`,
      done: () => editorOpen(),
      phase: () => {
        const grid = q('#reservationGrid');
        const start = q('#reservationGrid .is-range-start'), end = q('#reservationGrid .is-range-end');
        if (!start) { const sug = suggestPeriod(); return { el: sug?.start || grid, hand: !!sug, say: 'Toque na data de ENTRADA destacada.' }; }
        if (!end) { const c = dayCell(addDays(start.dataset.resDate, 2)); const ok = isFree(c) && isFree(dayCell(addDays(start.dataset.resDate, 1))); return { el: ok ? c : grid, hand: ok, say: 'Agora toque na SAÍDA destacada.' }; }
        return { el: q('[data-register-reservation]'), say: 'Toque em Cadastrar reserva.' };
      } },

    { title: 'Dados da estadia', enter: () => { S.acks.clear(); },
      html: `<p>Preencha os dados do hóspede.</p>`,
      done: () => { const id = cardIds().find(x => !S.before.has(x)); if (id) S.resId = id; return !!S.resId && !editorOpen(); },
      phase: () => {
        const exemplo = { label: 'Preencher exemplo', run: () => { setValue(editorEl('input[name="name"]'), 'João Pereira (teste)'); setValue(editorEl('input[name="phone"]'), '(21) 99999-1111'); setValue(editorEl('textarea[name="note"]'), 'Casal · chegada às 15h'); ack('guest'); ack('note'); } };
        if (!S.acks.has('guest')) return {
          els: [editorEl('select[name="status"]'), editorEl('input[name="name"]'), editorEl('input[name="phone"]')].filter(Boolean),
          say: 'Digite o nome e o telefone ou use Preencher exemplo e toque em OK.', fill: exemplo,
          ok: { key: 'guest', enabled: nameOk() && phoneOk() },
          info: `<p><b>Estado:</b> ${res} = reserva confirmada. <b>Telefone:</b> recebe máscara e vira um botão do WhatsApp no detalhe.</p>` };
        if (!S.acks.has('note')) return { el: editorEl('textarea[name="note"]'), say: 'Se quiser, escreva uma observação e toque em OK.', fill: exemplo, ok: { key: 'note', enabled: true },
          info: `<p>A observação é opcional. Use para registrar número de pessoas, horário de chegada ou combinados.</p>` };
        return { el: editorEl('button[type="submit"]'), say: 'Toque em Salvar reserva.', info: `<p>Tudo certo! O período ficará marcado no calendário e na lista.</p>` };
      } },

    { title: 'Veja a reserva', html: `<p>Cada reserva aparece na lista com <b>período</b>, <b>estado</b>, <b>hóspede</b> e <b>telefone</b>.</p>`,
      done: () => !!S.seenPreview && !previewOpen(),
      phase: () => {
        if (previewOpen()) { S.seenPreview = true; return { el: q('dialog.reservation-preview-dialog[open] .reservation-preview-close'), say: 'Toque no × para fechar os detalhes.', info: `<p>Aqui estão todos os dados da estadia. O telefone é um botão: um toque abre a conversa no <b>WhatsApp</b> do hóspede.</p>` }; }
        return { el: cardOf(S.resId), hand: true, deny: '.reservation-card-edit', say: 'Toque na reserva destacada para abrir os detalhes.', info: `<p>Esta é a reserva que você acabou de criar. Tocar nela mostra os detalhes completos. (O botão <b>Editar</b> a gente usa no próximo passo.)</p>` };
      } },

    { title: 'Altere o período', enter: () => { S.origRange = ''; S.pickerSeed = null; },
      html: `<p>Mudou a data? Dá para trocar a entrada e a saída sem apagar a reserva.</p>`,
      done: () => editorOpen() && !pickerOpen() && !!S.origRange && editorH2() !== S.origRange,
      phase: () => {
        if (pickerOpen()) {
          const g = q('dialog.reservation-date-picker-dialog[open] .reservation-date-picker-grid');
          const confirm = q('dialog.reservation-date-picker-dialog[open] [data-picker-confirm]');
          const sig = [...document.querySelectorAll('dialog.reservation-date-picker-dialog[open] .is-range-start, dialog.reservation-date-picker-dialog[open] .is-range-end')].map(c => c.dataset.pickerDate).sort().join('|');
          if (S.pickerSeed === null) S.pickerSeed = sig;
          const hasNew = sig && sig !== S.pickerSeed && !!q('dialog.reservation-date-picker-dialog[open] .is-range-end');
          if (hasNew && confirm && !confirm.disabled) return { el: confirm, say: 'Toque em Confirmar período.', info: `<p>As datas novas estão marcadas. Confirme para voltar à ficha da reserva.</p>` };
          return { el: g, hand: false, say: 'Escolha NOVAS datas: toque a entrada e depois a saída.', info: `<p>1º toque = <b>entrada</b>, 2º toque = <b>saída</b>. Datas ocupadas aparecem bloqueadas e feriados têm um pontinho colorido.</p>` };
        }
        if (editorOpen()) { if (!S.origRange) S.origRange = editorH2(); return { el: editorEl('[data-date-target="range"]'), say: 'Toque em Alterar período.', info: `<p>Aqui estão a entrada e a saída atuais. Este botão abre o calendário para escolher outras datas.</p>` }; }
        return { el: editBtn(), say: 'Toque em Editar na reserva destacada.', info: `<p>Para mudar qualquer dado, abra a reserva pelo botão <b>Editar</b>.</p>` };
      } },

    { title: 'Edite as informações', enter: () => { S.acks.clear(); S.cardBefore = cardOf(S.resId)?.textContent || ''; S.snap = null; },
      html: `<p>Nome, telefone e observação podem ser mudados a qualquer momento.</p>`,
      done: () => !editorOpen() && !!cardOf(S.resId) && cardOf(S.resId).textContent !== S.cardBefore,
      phase: () => {
        if (!editorOpen()) return { el: editBtn(), say: 'Toque em Editar na reserva destacada.' };
        if (!S.snap) S.snap = { n: val('input[name="name"]'), p: val('input[name="phone"]'), t: val('textarea[name="note"]') };
        const changed = val('input[name="name"]') !== S.snap.n || val('input[name="phone"]') !== S.snap.p || val('textarea[name="note"]') !== S.snap.t;
        if (!S.acks.has('edit')) return {
          els: [editorEl('input[name="name"]'), editorEl('input[name="phone"]'), editorEl('textarea[name="note"]')].filter(Boolean),
          say: 'Troque o nome, o telefone ou a observação e toque em OK.',
          fill: { label: 'Preencher exemplo', run: () => { setValue(editorEl('input[name="name"]'), 'João Pereira (teste)'); setValue(editorEl('textarea[name="note"]'), 'Casal + 1 criança · chegada às 15h'); ack('edit'); } },
          ok: { key: 'edit', enabled: changed },
          info: `<p>Mude qualquer um dos campos: o que você alterar aqui atualiza a reserva. As novas datas que você escolheu também só valem depois de salvar.</p><p><em>Digite o que quiser, ou use “Preencher exemplo”.</em></p>` };
        return { el: editorEl('button[type="submit"]'), say: 'Toque em Salvar alterações.', info: `<p>Ao salvar, a lista e o calendário passam a mostrar as novas datas e informações.</p>` };
      } },

    { center: true, title: 'Para que serve a pré-reserva', okText: 'Entendi',
      html: `<p>O hóspede <b>pagou só uma parte</b> (um sinal, por exemplo 50%) e vai pagar o <b>restante no dia da reserva</b>? Marque como ${pre}:</p><ul><li>As datas ficam <b>seguras</b>: no calendário do site aparecem como indisponíveis.</li><li>No painel, a reserva fica <b>âmbar</b>: você vê de relance quem ainda deve a segunda parte.</li><li>Na <b>observação</b> você anota quanto foi pago e quanto falta.</li></ul><p>Agora você vai fazer isso. 👇</p>` },

    { title: 'Faça a pré-reserva', enter: () => { S.acks.clear(); S.noteOnOpen = null; },
      html: `<p>Estado ${pre} + uma observação com o combinado de pagamento.</p>`,
      done: () => { const c = cardOf(S.resId); return !editorOpen() && !!c && /Pré-reservad/i.test(c.textContent); },
      phase: () => {
        if (!editorOpen()) return { el: editBtn(), say: 'Toque em Editar na reserva destacada.' };
        if (S.noteOnOpen === null) S.noteOnOpen = val('textarea[name="note"]');
        if (val('select[name="status"]') !== 'pre') return { el: editorEl('select[name="status"]'), say: 'Escolha o estado Pré-reservado.', fill: { label: 'Escolher por mim', run: () => setValue(editorEl('select[name="status"]'), 'pre') },
          info: `<p>Use ${pre} quando o hóspede pagou só uma parte. As datas ficam seguras até o restante ser pago.</p>` };
        if (!S.acks.has('pnote')) { const t = val('textarea[name="note"]'); return { el: editorEl('textarea[name="note"]'), say: 'Anote quanto foi pago e quanto falta, e toque em OK.',
          fill: { label: 'Preencher exemplo', run: () => { setValue(editorEl('textarea[name="note"]'), 'Pagou 50% de sinal · falta os outros 50% no dia do check-in'); ack('pnote'); } },
          ok: { key: 'pnote', enabled: t !== S.noteOnOpen && t.trim().length >= 8 },
          info: `<p>Exemplo: <i>“Pagou 50% de sinal · falta os outros 50% no dia do check-in”</i>. Assim você nunca esquece quanto ainda precisa receber.</p><p><em>Escreva do seu jeito, ou use “Preencher exemplo”.</em></p>` }; }
        return { el: editorEl('button[type="submit"]'), say: 'Toque em Salvar alterações.' };
      } },

    { title: 'Pré-reserva criada', okText: 'OK', target: () => cardOf(S.resId), interactive: false,
      html: `<p>A reserva ficou em âmbar na lista, com ${pre}. Quando o hóspede pagar o restante, toque em <b>Editar</b> e troque para ${res}.</p><p>Para dias em que a casa <b>não pode ser alugada</b> (manutenção, uso da família), use ${blk}.</p>` },

    { title: 'Excluir a reserva', html: `<p>Cancelou ou foi engano? Dá para excluir a reserva a qualquer momento.</p>`,
      done: () => !confirmOpen() && !cardOf(S.resId),
      phase: () => {
        if (confirmOpen()) return { el: q('dialog.reservation-confirm-dialog[open] [data-confirm]'), say: 'Toque em Sim para confirmar.', info: `<p>As datas voltam a ficar livres no calendário.</p>` };
        if (editorOpen()) return { el: editorEl('[data-delete]'), say: 'Toque em Excluir reserva.', info: `<p>O painel sempre pede uma confirmação antes de apagar.</p>` };
        return { el: editBtn(), say: 'Toque em Editar na reserva destacada.', info: `<p>Para excluir, abra a reserva pelo botão <b>Editar</b>.</p>` };
      } },

    { center: true, title: 'Tudo pronto!', okText: 'Concluir',
      html: `<p>Você criou, editou, usou a pré-reserva e excluiu uma reserva. Nada foi salvo de verdade: sua agenda continua como estava.</p><p>Para rever, toque em <b>▶ Tutorial guiado</b> no alto da página de Reservas.</p>` }
  ];
}

const HAND_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5l13.2 9.3-5.6 1.2 3.4 6.4-2.9 1.5-3.4-6.5-4.2 4z" fill="#fff" stroke="#173b3d" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

// Rola o contêiner certo (janela ou o painel rolável da janela aberta) para mover o destaque `delta` pixels.
function scrollByDelta(el, delta, dlg) {
  if (Math.abs(delta) < 6) return;
  try {
    if (dlg) {
      let n = el.parentElement;
      while (n && n !== dlg.parentElement) {
        const oy = getComputedStyle(n).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 2) { n.scrollTop += delta; return; }
        n = n.parentElement;
      }
      return;
    }
    window.scrollBy({ top: delta, behavior: 'auto' });
  } catch {}
}

function burstConfetti(origin, host=document.body){
  const old=document.querySelector('.tour-confetti'); old?.remove();
  const layer=document.createElement('div'); layer.className='tour-confetti';
  const colors=['#2f9e5b','#16834b','#f0c48a','#c9965f','#173b3d','#e9d9bd','#7fcf9e','#fff4d8'];
  const rect=origin || {left:window.innerWidth/2,top:window.innerHeight/2,width:0,height:0};
  const left=rect.left, top=rect.top, right=rect.left+(rect.width||0), bottom=rect.top+(rect.height||0);
  const width=Math.max(1,rect.width||0), height=Math.max(1,rect.height||0);
  const origins=[
    {side:'top',    x:left+width*(.08+Math.random()*.84), y:top-3,     dx:0,  dy:-1},
    {side:'right',  x:right+3, y:top+height*(.08+Math.random()*.84), dx:1,  dy:0},
    {side:'bottom', x:left+width*(.08+Math.random()*.84), y:bottom+3,  dx:0,  dy:1},
    {side:'left',   x:left-3, y:top+height*(.08+Math.random()*.84),  dx:-1, dy:0}
  ];
  const total=Math.min(120,Math.max(80,Math.round(window.innerWidth/11)));
  for(let i=0;i<total;i++){
    const p=document.createElement('i');
    const o=origins[i%origins.length];
    const tangent=(Math.random()-.5)*Math.max(80,Math.min(width,height)*.9);
    const outward=120+Math.random()*Math.min(560,Math.max(360,window.innerHeight*.62));
    let x=o.dx*outward, fall=o.dy*outward;
    if(o.side==='top'||o.side==='bottom') x+=tangent;
    else fall+=tangent;
    // Um pequeno componente diagonal deixa a explosão sair em leque, não em quatro linhas rígidas.
    x += (Math.random()-.5)*150;
    fall += (Math.random()-.5)*130;
    p.className=Math.random()<.18?'star':Math.random()<.2?'ribbon':Math.random()<.22?'dot':'';
    p.style.setProperty('--cx',`${Math.round(o.x)}px`);
    p.style.setProperty('--cy',`${Math.round(o.y)}px`);
    p.style.setProperty('--x',`${Math.round(x)}px`);
    p.style.setProperty('--fall',`${Math.round(fall)}px`);
    p.style.setProperty('--r',`${Math.round(Math.random()*360-180)}deg`);
    p.style.setProperty('--rot',`${Math.round(360+Math.random()*1080)}deg`);
    p.style.setProperty('--d',`${Math.round(Math.random()*35)}ms`);
    p.style.setProperty('--dur',`${Math.round(1050+Math.random()*850)}ms`);
    p.style.setProperty('--c',colors[i%colors.length]);
    p.style.setProperty('--w',`${4+Math.round(Math.random()*6)}px`);
    p.style.setProperty('--h',`${7+Math.round(Math.random()*13)}px`);
    layer.appendChild(p);
  }
  host.appendChild(layer);
  window.setTimeout(()=>layer.remove(),2300);
}

function runTour() {
  ensureStyle();
  const steps = buildSteps();
  const shades = [0, 1, 2, 3].map(() => { const d = document.createElement('div'); d.className = 'tour-shade'; return d; });
  const cover = document.createElement('div'); cover.className = 'tour-cover';
  const ring = document.createElement('div'); ring.className = 'tour-ring';
  const hand = document.createElement('div'); hand.className = 'tour-hand'; hand.innerHTML = '<i></i><i></i>' + HAND_SVG;
  const card = document.createElement('div'); card.className = 'tour-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Tutorial guiado');
  document.body.append(...shades, cover);
  document.body.append(ring, hand, card);
  // Toques no tutorial não podem contar como "clique fora do calendário" (isso limparia a seleção do usuário).
  card.addEventListener('click', e => e.stopPropagation());

  // Trava de interação: durante o tutorial só o alvo destacado (e o próprio aviso do tutorial) responde a toques e teclas.
  let curPh = {}, curEls = [];
  const allowedTarget = t => {
    const n = t && (t.nodeType === 1 ? t : t.parentElement);
    if (!n) return false;
    if (card.contains(n)) return true;
    if (curPh.interactive === false || advancing) return false;   // passo concluído: aguardando a transição, sem novos toques
    const hit = curEls.find(el => el.isConnected && el.contains(n));
    if (!hit) return false;
    return !(curPh.deny && n.closest(curPh.deny));
  };
  const guard = e => {
    if (stopped) return;
    if (e.type === 'keydown' && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (e.key === 'Tab' || allowedTarget(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
  };
  const noCancel = e => e.preventDefault();
  const GUARDED = ['click', 'dblclick', 'auxclick', 'contextmenu', 'mousedown', 'keydown', 'keyup', 'keypress'];
  GUARDED.forEach(t => document.addEventListener(t, guard, true));
  document.addEventListener('cancel', noCancel, true);

  let index = 0, raf = 0, lastCheck = 0, step = null, stopped = false, advancing = false, lastTarget = null, sayKey = '', fillKey = '', infoKey = '', okKey = '', placeTop = false, lastCardH = 0, needBand = false, paddedDlg = null, reviewMode = false, checkpoints = [], completionFxStep = -1;

  function show(i, review = false, restore = false) {
    if (stopped || i < 0 || i >= steps.length) return;
    reviewMode = review;
    curPh = {}; curEls = [];   // nada responde até o primeiro quadro do novo passo
    index = i; step = steps[i]; advancing = false; completionFxStep = -1; lastTarget = null; sayKey = ''; fillKey = ''; infoKey = ''; okKey = '';
    state.acks.clear();
    step.enter?.();
    // Ao voltar, primeiro reconstruímos o passo e só depois restauramos o estado
    // salvo. O estado restaurado não pode ser sobrescrito pelo `enter()` do passo.
    if (restore && checkpoints[i] && window.__casaTourSandboxController?.restore) {
      try {
        const snap = checkpoints[i];
        window.__casaTourSandboxController.restore(snap);
        // Alguns passos começam dentro de um diálogo. O snapshot guarda o estado
        // dos dados, mas não deve tentar serializar o DOM do diálogo. Reabrimos
        // somente o editor necessário depois da restauração.
        const reopen = window.__casaTourSandboxController?.openEditor;
        if (reopen) {
          if (step.title === 'Dados da diária' && snap.draftStart) {
            reopen(null, true, { checkIn: snap.draftStart, checkOut: snap.draftEnd || snap.draftStart, status: 'reserved' });
          } else if (step.title === 'Dados da estadia' && snap.draftStart) {
            reopen(null, true, { checkIn: snap.draftStart, checkOut: snap.draftEnd || snap.draftStart, status: 'reserved' });
          } else if ((step.title === 'Edite as informações' || step.title === 'Faça a pré-reserva') && state.resId) {
            reopen(state.resId, false);
          }
        }
      } catch {}
    }
    const dots = steps.map((_, k) => `<b class="${k < i ? 'on' : k === i ? 'cur' : ''}"></b>`).join('');
    card.classList.remove('is-done');
    shades.forEach(s => s.classList.remove('is-completion'));
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    card.innerHTML = `<div class="tour-top"><button type="button" class="tour-back" ${i===0?'disabled':''} aria-label="Voltar um passo" title="Voltar um passo">‹</button><span class="tour-count" aria-label="Passo ${i + 1} de ${steps.length}">${i + 1}/${steps.length}</span><div class="tour-steps">${dots}</div><button type="button" class="tour-skip">Pular</button></div><h3></h3><p class="tour-say" hidden></p><div class="tour-body"></div><div class="tour-actions"></div>`;
    card.querySelector('h3').textContent = step.title;
    setInfo(step.html);
    card.querySelector('.tour-body').classList.toggle('is-tip', !!step.phase);
    card.querySelector('.tour-skip').onclick = () => finish(true);
    card.querySelector('.tour-back').onclick = () => {
      if (index <= 0 || advancing) return;
      advancing = false;
      const target = index - 1;
      // Cancela qualquer transição pendente antes de reconstruir o passo anterior.
      lastCheck = performance.now();
      show(target, false, true);
    };
    // Tocar na instrução (que não é um botão) apenas chama a atenção para o destaque.
    card.querySelector('.tour-say').onclick = () => { ring.classList.remove('nudge'); void ring.offsetWidth; ring.classList.add('nudge'); lastTarget = null; setTimeout(() => ring.classList.remove('nudge'), 950); };
    const actions = card.querySelector('.tour-actions');
    if (!step.phase) {
      const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'tour-ok'; ok.textContent = step.okText || 'OK';
      ok.onclick = () => next(); actions.appendChild(ok);
    }
  }
  function setInfo(html) { const b = card.querySelector('.tour-body'); if (b) b.innerHTML = html || ''; }
  function next() {
    if (index >= steps.length - 1) { finish(true); return; }
    const nextIndex = index + 1;
    // O checkpoint representa o estado NO INÍCIO do próximo passo.
    // Assim, Voltar desfaz a ação do passo atual em vez de reapresentar o mesmo estado.
    try { checkpoints[nextIndex] = window.__casaTourSandboxController?.snapshot?.() || null; } catch { checkpoints[nextIndex] = null; }
    show(nextIndex, false, false);
  }

  function current() {
    // Quando a ação foi concluída, o tutorial entra em modo de confirmação.
    // Não mantenha o alvo anterior destacado: a pessoa deve apenas ler 'Feito!'
    // e tocar em 'Próximo passo'.
    if (advancing) return { el: null, els: [], interactive: false, hand: false };
    if (step.phase) { try { return step.phase() || {}; } catch { return {}; } }
    let el = null; try { el = step.center ? null : (step.target ? step.target() : null); } catch {}
    return { el, interactive: step.interactive !== false, hand: false };
  }

  function tick(now) {
    if (stopped) return;
    raf = requestAnimationFrame(tick);
    const dialogs = [...document.querySelectorAll('dialog[open]')];
    const dlg = dialogs[dialogs.length - 1] || null;
    const container = dlg || document.body;
    // Native <dialog> lives in the browser top layer. Keep EVERY tutorial layer
    // inside it while a reservation popup is open, otherwise the dimmer/confetti
    // stay behind the popup and the completion card looks attached to its layout.
    [...shades, cover, ring, hand, card].forEach(n => { if (n.parentElement !== container) container.appendChild(n); });

    const ph = current();
    curPh = ph;
    const els = (ph.els || (ph.el ? [ph.el] : [])).filter(Boolean);
    curEls = els;
    const el = els[0] || null;

    // instrução, explicação e botões do momento
    const sk = (advancing ? '✓ ' : '') + (ph.say || '');
    if (sk !== sayKey) { sayKey = sk; const say = card.querySelector('.tour-say'); if (say) { say.hidden = !ph.say; say.textContent = advancing ? 'Feito! Vamos para o próximo.' : (ph.say || ''); } }
    const ik = ph.info || step.html;
    if (ik !== infoKey) { infoKey = ik; setInfo(ik); }
    const actions = card.querySelector('.tour-actions');
    if (actions && !advancing) actions.querySelector('.tour-next')?.remove();
    if (step.phase && actions) {
      const fk = ph.fill ? ph.fill.label : '';
      if (fk !== fillKey) {
        fillKey = fk; actions.querySelector('.tour-fill')?.remove();
        if (ph.fill) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tour-fill'; b.textContent = ph.fill.label; actions.prepend(b); }
      }
      const fb = actions.querySelector('.tour-fill'); if (fb && ph.fill) fb.onclick = () => ph.fill.run();
      const ok = ph.ok ? ph.ok.key : '';
      if (ok !== okKey) {
        okKey = ok; actions.querySelector('.tour-ok')?.remove();
        if (ph.ok) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tour-ok'; b.textContent = 'OK'; actions.appendChild(b); }
      }
      const ob = actions.querySelector('.tour-ok'); if (ob && ph.ok) { ob.disabled = !ph.ok.enabled; ob.onclick = () => { if (!ob.disabled) state.acks.add(ph.ok.key); }; }
    }

    // Quando a ação é concluída, o tutorial para em “Feito!” e espera
    // explicitamente o usuário tocar em “Próximo passo”. Isso evita que a
    // transição aconteça enquanto a pessoa ainda está lendo a confirmação.
    if (!reviewMode && step.done && !advancing && now - lastCheck > 80) {
      lastCheck = now;
      let ok = false; try { ok = !!step.done(); } catch {}
      if (ok) {
        advancing = true;
        card.classList.add('is-done','is-center');
        const actions = card.querySelector('.tour-actions');
        if (actions && !actions.querySelector('.tour-next')) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'tour-next';
          b.textContent = index >= steps.length - 1 ? 'Concluir' : 'Próximo passo';
          b.onclick = () => { if (!stopped && advancing) next(); };
          actions.appendChild(b);
        }
        // O card já recebeu a classe de conclusão e o botão foi inserido. No
        // primeiro frame em que ele entra na tela, o confete explode do centro
        // do próprio card — sem atraso perceptível.
        shades.forEach(s => s.classList.add('is-completion'));
        if (completionFxStep !== index) {
          completionFxStep = index;
          requestAnimationFrame(() => {
            if (stopped) return;
            const rect = card.getBoundingClientRect();
            const host = card.parentElement || document.body;
            burstConfetti(rect, host);
          });
        }
        // A ação acabou: remova imediatamente o alvo atual no mesmo frame.
        // Sem isso, por um frame o anel/mão ainda ficava apontando para o campo anterior.
        curPh = { el:null, els:[], interactive:false, hand:false };
        curEls = [];
        ring.style.display = 'none';
        hand.style.display = 'none';
        cover.style.display = 'none';
        sayKey = '';
      }
    }

    const vw = window.innerWidth, vh = window.innerHeight;
    card.classList.toggle('is-center', !!step.center || advancing);
    // retângulo do destaque (união de todos os alvos)
    let r = null;
    for (const e of els) {
      const b = e.getBoundingClientRect(); const pad = 6;
      const rr = { l: b.left - pad, t: b.top - pad, r: b.right + pad, b: b.bottom + pad };
      r = r ? { l: Math.min(r.l, rr.l), t: Math.min(r.t, rr.t), r: Math.max(r.r, rr.r), b: Math.max(r.b, rr.b) } : rr;
    }
    if (r) r = { l: Math.max(0, r.l), t: Math.max(0, r.t), r: Math.min(vw, r.r), b: Math.min(vh, r.b) };
    // O aviso do tutorial fica no lado oposto ao destaque; e a tela rola para o destaque ficar na área livre.
    const cardH = card.offsetHeight;
    if (dlg !== paddedDlg) { if (paddedDlg) paddedDlg.style.removeProperty('padding-bottom'); paddedDlg = dlg; }
    // O tutorial agora é independente do conteúdo do popup: nunca aumenta o dialog.
    if (dlg) dlg.style.removeProperty('padding-bottom');
    if (el && el !== lastTarget) {
      lastTarget = el;
      lastCardH = cardH;
      // No mobile, nunca deixe o tutorial cobrir o alvo. Escolha o lado
      // com mais espaço livre e dê prioridade ao lado oposto ao botão.
      const topSpace = r ? Math.max(0, r.t - 12) : vh * 0.5;
      const bottomSpace = r ? Math.max(0, vh - r.b - 12) : vh * 0.5;
      if (r) {
        if (bottomSpace < cardH + 18 && topSpace >= cardH + 18) placeTop = true;
        else if (topSpace < cardH + 18 && bottomSpace >= cardH + 18) placeTop = false;
        else placeTop = topSpace >= bottomSpace;
      } else {
        placeTop = false;
      }
      needBand = true;
    }
    else if (el && Math.abs(cardH - lastCardH) > 24) {
      lastCardH = cardH;
      // Recalcula o lado quando o card muda de tamanho no celular.
      if (r && window.innerWidth <= 700) {
        const topSpace = Math.max(0, r.t - 12);
        const bottomSpace = Math.max(0, vh - r.b - 12);
        placeTop = topSpace >= cardH + 18 || topSpace >= bottomSpace;
      }
      needBand = true;
    }
    if (step.center) card.classList.remove('is-top', 'is-bottom');
    else { card.classList.toggle('is-top', placeTop); card.classList.toggle('is-bottom', !placeTop); }
    if (needBand && r && !step.center) {
      needBand = false;
      const mobile = window.innerWidth <= 700;
      const edge = mobile ? 12 : 24;
      const gap = mobile ? 14 : 24;
      const bandTop = placeTop ? cardH + edge : (dlg ? edge : 70);
      const bandBot = placeTop ? vh - edge : vh - cardH - gap;
      const hgt = r.b - r.t, free = bandBot - bandTop;
      const desired = hgt >= free ? bandTop : bandTop + (free - hgt) / 2;
      scrollByDelta(el, r.t - desired, dlg);
    }

    if (r) Object.assign(ring.style, { display: 'block', left: r.l + 'px', top: r.t + 'px', width: (r.r - r.l) + 'px', height: (r.b - r.t) + 'px' }); else ring.style.display = 'none';
    const wantHand = !!r && !step.center && ph.interactive !== false && (ph.hand === true || (ph.hand === undefined && els.length === 1 && (r.b - r.t) < 120));
    if (wantHand) Object.assign(hand.style, { display: 'block', left: ((r.l + r.r) / 2) + 'px', top: ((r.t + r.b) / 2) + 'px' });
    else hand.style.display = 'none';

    if (dlg) {
      if (advancing) {
        shades.forEach((s, k) => { s.style.display = k === 0 ? 'block' : 'none'; });
        Object.assign(shades[0].style, { left:'0px', top:'0px', width:vw+'px', height:vh+'px' });
        cover.style.display = 'block';
        Object.assign(cover.style, { left:'0px', top:'0px', width:vw+'px', height:vh+'px' });
      } else {
        shades.forEach(s => s.style.display = 'none');
        cover.style.display = 'none';
      }
      return;
    }
    if (step.center || !r) {
      shades.forEach((s, k) => { s.style.display = k === 0 && step.center ? 'block' : 'none'; });
      Object.assign(shades[0].style, { left: '0px', top: '0px', width: vw + 'px', height: vh + 'px' });
      cover.style.display = 'none'; return;
    }
    shades.forEach(s => s.style.display = 'block');
    Object.assign(shades[0].style, { left: '0px', top: '0px', width: vw + 'px', height: r.t + 'px' });
    Object.assign(shades[1].style, { left: '0px', top: r.b + 'px', width: vw + 'px', height: Math.max(0, vh - r.b) + 'px' });
    Object.assign(shades[2].style, { left: '0px', top: r.t + 'px', width: r.l + 'px', height: Math.max(0, r.b - r.t) + 'px' });
    Object.assign(shades[3].style, { left: r.r + 'px', top: r.t + 'px', width: Math.max(0, vw - r.r) + 'px', height: Math.max(0, r.b - r.t) + 'px' });
    if (ph.interactive === false) Object.assign(cover.style, { display: 'block', left: r.l + 'px', top: r.t + 'px', width: (r.r - r.l) + 'px', height: (r.b - r.t) + 'px' });
    else cover.style.display = 'none';
  }

  function finish(markDone) {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(raf);
    GUARDED.forEach(t => document.removeEventListener(t, guard, true));
    document.removeEventListener('cancel', noCancel, true);
    if (paddedDlg) paddedDlg.style.removeProperty('padding-bottom');
    [...shades, cover, ring, hand, card].forEach(n => n.remove());
    document.querySelectorAll('dialog.reservation-dialog[open], dialog.reservation-date-picker-dialog[open], dialog.reservation-preview-dialog[open]').forEach(d => { try { d.close(); } catch {} d.remove(); });
    document.body.classList.remove('reservation-modal-open'); document.documentElement.classList.remove('reservation-modal-open');
    if (markDone) { try { localStorage.setItem(DONE_KEY, '1'); } catch {} }
    window.__casaTour = undefined; window.__casaTourSandboxController = undefined; running = false; state = null;
    // Recarrega a agenda real: a reserva de teste (só na tela) desaparece.
    Promise.resolve(hooks.reload?.()).catch(() => {});
  }

  checkpoints = [];
  window.__casaTour = {
    sandbox: true,
    stop: () => finish(false),
  };
  // Checkpoint 0 é o estado original da agenda. Os próximos checkpoints
  // são registrados ao entrar em cada passo, antes de sua ação.
  try { checkpoints[0] = window.__casaTourSandboxController?.snapshot?.() || null; } catch { checkpoints[0] = null; }
  show(0);
  raf = requestAnimationFrame(tick);
}

export async function startAdminTour({ force = false } = {}) {
  if (running) return;
  if (!force && localStorage.getItem(DONE_KEY) === '1') return;
  running = true; state = { acks: new Set(), cardBefore: '', snap: null, resId: null, dailyId: null, before: new Set(), origRange: '', pickerSeed: null, nameBefore: '', nameOnOpen: null, noteOnOpen: null, seenPreview: false };
  window.__casaTour = { sandbox: true, stop: () => {} };
  try {
    await hooks.cleanupLegacyTest?.();
    await hooks.goToReservations();
    for (let i = 0; i < 100 && !q('#reservationGrid .reservation-day'); i++) await new Promise(r => setTimeout(r, 50));
    if (!q('#reservationGrid .reservation-day')) { running = false; window.__casaTour = undefined; return; }
    runTour();
  } catch { running = false; window.__casaTour = undefined; }
}

export function maybeStartAdminTour() { return startAdminTour({ force: false }); }
export const isAdminTourRunning = () => running;
