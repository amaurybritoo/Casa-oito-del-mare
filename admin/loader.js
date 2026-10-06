// Loader da marca: o "8" gira enquanto o painel carrega ou salva qualquer coisa.
const css = `
.mark-loader{display:grid;justify-items:center;align-content:center;gap:22px;min-height:46vh;color:#173b3d}
.ml-orb{position:relative;width:92px;height:92px;display:grid;place-items:center;--ml-gold:#c9965f}
.ml-orb::before{content:"";position:absolute;inset:-14px;border-radius:50%;background:radial-gradient(circle,rgba(201,150,95,.22),transparent 68%);animation:mlGlow 2.4s ease-in-out infinite}
.ml-disc{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:linear-gradient(145deg,#fffaf0,#f1e6d3);box-shadow:inset 0 0 0 1px rgba(201,150,95,.38),0 12px 30px rgba(23,59,61,.12)}
.ml-sea{position:absolute;left:0;bottom:0;width:200%;height:48%;color:rgba(64,166,168,.3);animation:mlDrift 3.4s linear infinite;will-change:transform}.ml-sea svg{display:block;width:100%;height:100%}.ml-sea path{fill:currentColor}
.ml-ring{position:absolute;inset:-5px;border-radius:50%;background:conic-gradient(from 0deg,rgba(201,150,95,0) 0 38%,rgba(201,150,95,.15) 55%,var(--ml-gold) 100%);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));mask:radial-gradient(farthest-side,transparent calc(100% - 2.5px),#000 calc(100% - 2px));animation:mlSpin 1.5s cubic-bezier(.45,.1,.55,.9) infinite}
.ml-ring.r2{inset:-12px;opacity:.45;animation-duration:2.6s;animation-direction:reverse}
.ml-8{position:relative;font:600 50px/1 'Cormorant Garamond',Georgia,serif;color:#b67950;transform-style:preserve-3d;animation:mlFlip 2.4s cubic-bezier(.65,0,.35,1) infinite;text-shadow:0 2px 10px rgba(182,121,80,.25)}
.ml-label{margin:0;font:600 10px/1 'DM Sans',Arial,sans-serif;letter-spacing:.32em;text-transform:uppercase;color:#6c8a83}
.ml-label::after{content:"";display:inline-block;width:1.4em;text-align:left;animation:mlDots 1.5s steps(4,end) infinite}
@keyframes mlDrift{to{transform:translate3d(-50%,0,0)}}
@keyframes mlSpin{to{transform:rotate(360deg)}}
@keyframes mlFlip{0%{transform:perspective(320px) rotateY(0)}60%,100%{transform:perspective(320px) rotateY(360deg)}}
@keyframes mlGlow{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
@keyframes mlDots{0%{content:""}25%{content:"."}50%{content:".."}75%,100%{content:"..."}}
.ml-pill{position:fixed;z-index:9999;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));display:flex;align-items:center;gap:12px;padding:9px 18px 9px 11px;border-radius:999px;background:rgba(23,59,61,.94);color:#f3e6d0;box-shadow:0 14px 40px rgba(6,31,32,.3);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;transform:translate(-50%,16px) scale(.96);pointer-events:none;transition:opacity .3s,transform .4s cubic-bezier(.2,.8,.2,1)}
.ml-pill.on{opacity:1;transform:translate(-50%,0) scale(1)}
.ml-pill .ml-orb{width:30px;height:30px}.ml-pill .ml-orb::before{display:none}
.ml-pill .ml-disc{background:#f7ecd8;box-shadow:none}.ml-pill .ml-ring{inset:-3px;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 1.5px));mask:radial-gradient(farthest-side,transparent calc(100% - 2px),#000 calc(100% - 1.5px))}
.ml-pill .ml-ring.r2{display:none}.ml-pill .ml-8{font-size:19px;text-shadow:none}
.ml-pill .ml-label{color:#f3e6d0;letter-spacing:.22em;font-size:9px}
.admin-brand.is-busy>span{animation:mlFlip 1.6s cubic-bezier(.65,0,.35,1) infinite;box-shadow:0 0 0 3px rgba(201,150,95,.28)}
@media(prefers-reduced-motion:reduce){.ml-ring,.ml-ring.r2,.ml-8,.ml-sea,.admin-brand.is-busy>span{animation:none}.ml-orb::before{animation:mlGlow 3s ease-in-out infinite}}
`;
const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

const ML_WAVE = '<svg viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20C75 0 225 0 300 20S525 40 600 20 825 0 900 20 1125 40 1200 20V40H0Z"/></svg>';
export const markLoaderHtml = (label = 'Carregando') =>
  `<div class="mark-loader is-view" role="status" aria-live="polite"><div class="ml-orb"><span class="ml-disc"><i class="ml-sea">${ML_WAVE}</i></span><span class="ml-ring r2"></span><span class="ml-ring"></span><span class="ml-8">8</span></div><p class="ml-label">${label}</p></div>`;

// Indicador global: aparece quando qualquer requisição demora mais de 350 ms.
const pill = document.createElement('div');
pill.className = 'ml-pill'; pill.setAttribute('role', 'status');
pill.innerHTML = `<div class="ml-orb"><span class="ml-disc"><i class="ml-sea">${ML_WAVE}</i></span><span class="ml-ring"></span><span class="ml-8">8</span></div><span class="ml-label">Carregando</span>`;
document.body.appendChild(pill);

let pending = 0, showTimer = 0, shownAt = 0;
const brand = () => document.querySelector('.admin-brand');
const busyOn = () => {
  brand()?.classList.add('is-busy');
  if (!document.querySelector('.mark-loader.is-view')) { pill.classList.add('on'); shownAt = Date.now(); }
};
const busyOff = () => {
  const wait = Math.max(0, 600 - (Date.now() - shownAt));
  window.setTimeout(() => { if (pending === 0) { pill.classList.remove('on'); brand()?.classList.remove('is-busy'); } }, wait);
};
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = String(input?.url || input || '');
  if (/grant_type=refresh_token|\/auth\/v1\/(user|logout)/.test(url)) return nativeFetch(input, init);
  pending++; if (pending === 1) { clearTimeout(showTimer); showTimer = window.setTimeout(() => { if (pending > 0) busyOn(); }, 350); }
  return nativeFetch(input, init).finally(() => { pending = Math.max(0, pending - 1); if (pending === 0) { clearTimeout(showTimer); busyOff(); } });
};
