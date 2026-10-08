import { trackPageVisit, trackWhatsappLinks } from './analytics.js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { CARD_ICONS, cardIconSvg, resolveCardIcon } from './card-icons.js';
import { holidayForKey, monthTitle } from './holidays.js?v=20261008-1';

const WAVE_SVG = '<svg viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 20C75 0 225 0 300 20S525 40 600 20 825 0 900 20 1125 40 1200 20V40H0Z"/></svg>';
const SEA_HTML = `<span class="sea" aria-hidden="true"><span class="sea-body"></span><i class="sea-w w3">${WAVE_SVG}</i><i class="sea-w w2">${WAVE_SVG}</i><i class="sea-w w1">${WAVE_SVG}</i></span>`;


trackPageVisit('links');
trackWhatsappLinks('links');

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const shareButton = $('#sharePage');
const toast = $('#shareToast');
const year = $('#currentYear');
if (year) year.textContent = String(new Date().getFullYear());

const fallbackProfile = {
  name: 'Casa Oito Del Mare',
  location: 'ARMAÇÃO DOS BÚZIOS · RJ',
  bio: 'O mar logo ali. O tempo, todo seu.\nUm lugar tranquilo para viver Búzios sem pressa.',
  instagram: 'https://www.instagram.com/casaoitodelmare/',
  whatsapp: '5521986362770',
  map: 'https://www.google.com/maps/search/?api=1&query=Arma%C3%A7%C3%A3o+dos+B%C3%BAzios+RJ',
  contact: { phones: ['(21) 98636-2770', '(21) 98635-7913'], instagram: 'https://www.instagram.com/casaoitodelmare/' },
  availability: { enabled:true, title:'Consulte sua estadia.', subtitle:'As datas em vermelho já estão reservadas. As demais estão livres para consulta.', reservedDates:[], whatsapp:'5521986362770' }
};

const fallbackLinks = [
  { title:'Conheça a casa', subtitle:'Ambientes, detalhes e experiências', url:'./index.html#cards', icon:'home', active:true, type:'home' },
  { title:'Consultar disponibilidade', subtitle:'Veja o calendário da Casa Oito', url:'#stay', icon:'calendar', active:true, type:'whatsapp' },
  { title:'Descubra Búzios', subtitle:'Praias, passeios e lugares que recomendamos', url:'#tourism', icon:'tourism', active:true, type:'tourism' },
  { title:'Instagram', subtitle:'Acompanhe a Casa Oito Del Mare', url:'https://www.instagram.com/casaoitodelmare/', icon:'instagram', active:true, type:'instagram' },
  { title:'Fale com a Casa', subtitle:'Telefones e Instagram', url:'#contact', icon:'contact', active:true, type:'contact' }
];

const fallbackTourism = [
  {title:'Orla Bardot',subtitle:'Caminhada · pôr do sol',description:'Calçadão à beira-mar com barcos, esculturas e a atmosfera que virou uma das imagens mais conhecidas de Búzios.',category:'Passeio',recommendation:'Vá no fim da tarde e siga caminhando até a Rua das Pedras.',image_url:'https://www.civitatis.com/blog/wp-content/uploads/2025/09/shutterstock_251424757-1280x854.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Orla+Bardot+B%C3%BAzios'},
  {title:'Rua das Pedras',subtitle:'Centro · gastronomia',description:'O coração noturno de Búzios reúne restaurantes, bares, cafés, lojas e galerias em uma caminhada cheia de charme.',category:'Centro',recommendation:'Chegue no fim da tarde para aproveitar o movimento com mais calma.',image_url:'https://lirp.cdn-website.com/cb037d13/dms3rep/multi/opt/anexogeriba111-640w.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Rua+das+Pedras+B%C3%BAzios'},
  {title:'Praia de João Fernandes',subtitle:'Mar calmo · snorkel',description:'Uma das praias mais conhecidas da península, com águas claras e estrutura para passar algumas horas perto do mar.',category:'Praia',recommendation:'Para um dia tranquilo, chegue cedo e leve máscara para snorkel.',image_url:'https://i0.statig.com.br/bancodeimagens/b4/6s/zy/b46szy4zljpkh2giovee4c2dc.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Praia+de+Jo%C3%A3o+Fernandes+B%C3%BAzios'},
  {title:'Praia da Azeda e Azedinha',subtitle:'Enseadas · águas claras',description:'Duas pequenas praias cercadas por vegetação e costões, acessíveis a partir da região da Praia dos Ossos.',category:'Praia',recommendation:'Reserve algumas horas e combine com uma caminhada pela Praia dos Ossos.',image_url:'https://arrumaessamala.com.br/wp-content/uploads/2020/01/praia-da-azeda-buzios.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Praia+da+Azeda+B%C3%BAzios'},
  {title:'Praia de Geribá',subtitle:'Surf · faixa de areia',description:'Uma das praias mais movimentadas de Búzios, com mar aberto, faixa de areia ampla e clima esportivo.',category:'Praia',recommendation:'Boa escolha para quem gosta de ondas e quer um dia de praia mais animado.',image_url:'https://cdn.shopify.com/s/files/1/0048/7181/5256/files/Geriba.jpg?v=1696016186',map_url:'https://www.google.com/maps/search/?api=1&query=Praia+de+Gerib%C3%A1+B%C3%BAzios'},
  {title:'Praia da Ferradura',subtitle:'Enseada · mar protegido',description:'A enseada em formato de ferradura tem águas mais protegidas e um visual amplo, ótima para um dia de descanso.',category:'Praia',recommendation:'Combine com uma manhã tranquila de mar e almoço sem pressa.',image_url:'./assets/gallery/casa-14.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Praia+da+Ferradura+B%C3%BAzios'},
  {title:'Praia dos Ossos',subtitle:'História · caminhada',description:'Uma das praias mais tradicionais da península, próxima da Igreja de Sant’Ana e caminho para Azeda e Azedinha.',category:'História',recommendation:'Use como ponto de partida para conhecer a região caminhando.',image_url:'./assets/gallery/detalhe-12.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Praia+dos+Ossos+B%C3%BAzios'},
  {title:'Porto da Barra',subtitle:'Gastronomia · pôr do sol',description:'Complexo à beira da Praia de Manguinhos com restaurantes, lojas e um clima especial no fim do dia.',category:'Gastronomia',recommendation:'Ótimo para terminar o dia com jantar e pôr do sol.',image_url:'./assets/gallery/detalhe-09.jpg',map_url:'https://www.google.com/maps/search/?api=1&query=Porto+da+Barra+B%C3%BAzios'}
];

let profile = {...fallbackProfile};
let links = [...fallbackLinks];
let tourism = [...fallbackTourism];
let availability = {...fallbackProfile.availability};
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = null;
let checkinDate = null;
let checkoutDate = null;
let holidayInfoKey = null;

function showCalendarError(message){
  const dialog=$('#calendarConflictDialog');
  if(!dialog) return;
  if(dialog.open) dialog.close();
  const text=dialog.querySelector('.calendar-conflict-inner p');
  if(text) text.textContent=message||'Há uma data reservada entre a entrada e a saída selecionada. Escolha outro período.';
  const close=()=>{if(dialog.open)dialog.close()};
  const ok=dialog.querySelector('[data-ok-calendar-conflict]');
  const closeControl=dialog.querySelector('[data-close-calendar-conflict]');
  ok.onclick=close;
  closeControl.onclick=close;
  closeControl.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();close()}};
  dialog.oncancel=event=>{event.preventDefault();close()};
  dialog.onclick=event=>{if(event.target===dialog)close()};
  dialog.showModal();
}
function clearCalendarError(){
  const dialog=$('#calendarConflictDialog');
  if(dialog?.open) dialog.close();
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2400);
}

function openTourism() {
  const dialog = $('#tourismDialog');
  if (!dialog) return;
  renderTourism();
  dialog.showModal();
}

const fallbackCoverImages = [
  './assets/gallery/detalhe-11.jpg',
  './assets/gallery/detalhe-03.jpg',
  './assets/gallery/detalhe-13.jpg',
  './assets/gallery/casa-05.jpg'
];
let coverImages = [...fallbackCoverImages];
let coverFromGallery = false;
let coverIndex = 0;
let coverTimer = null;

let coverKey = '';
let coverBuild = 0;
const imageReady = img => !!(img && img.complete && img.naturalWidth > 0);
// Espera a foto estar baixada e decodificada (com limite de tempo) para ela nunca aparecer "em branco" na troca.
function whenImageReady(img, timeout = 4000) {
  if (!img) return Promise.resolve(false);
  const decoded = img.decode ? img.decode().then(() => true, () => imageReady(img)) : Promise.resolve(imageReady(img));
  return Promise.race([decoded, new Promise(resolve => window.setTimeout(() => resolve(imageReady(img)), timeout))]);
}
function renderCoverCarousel(images = coverImages) {
  const track = $('#profileCoverTrack');
  if (!track) return;
  let list = images.filter(Boolean);
  if (!list.length) list = [...fallbackCoverImages];
  const key = list.join('|');
  // Mesma lista de fotos: não mexe no DOM. Recriar os slides a cada atualização causava um "piscar" na capa.
  if (key === coverKey && track.querySelector('.cover-slide')) { coverImages = list; return; }
  coverKey = key;
  coverImages = list;
  coverIndex = Math.min(coverIndex, coverImages.length - 1);
  const build = ++coverBuild;
  // Os slides são criados uma única vez; trocar de foto só alterna classes, e é isso que permite a transição.
  const frag = document.createDocumentFragment();
  coverImages.forEach((src,i) => {
    const slide = document.createElement('div');
    slide.className = 'cover-slide' + (i === coverIndex ? ' is-active' : '');
    const img = new Image();
    img.alt = `Casa Oito Del Mare · foto ${i+1}`;
    img.decoding = 'async';
    img.draggable = false;
    if (i === coverIndex) img.fetchPriority = 'high';
    img.src = src;
    slide.appendChild(img);
    frag.appendChild(slide);
  });
  // A capa atual só é trocada quando a nova foto principal já está pronta (sem tela vazia no meio).
  const first = frag.querySelectorAll('img')[coverIndex];
  whenImageReady(first, 2500).then(() => {
    if (build !== coverBuild) return;
    track.replaceChildren(frag);
  });
}

function goCover(index,manual=false) {
  if (!coverImages.length) return;
  const next=(index+coverImages.length)%coverImages.length;
  const slides=$$('#profileCoverTrack .cover-slide');
  if (slides.length!==coverImages.length) { coverIndex=Math.min(coverIndex,coverImages.length-1); renderCoverCarousel(); }
  else if (next!==coverIndex) {
    const incoming=slides[next], leaving=slides[coverIndex];
    const show=()=>{
      if (!incoming.isConnected || next===coverIndex) return;
      leaving?.classList.remove('is-active');
      leaving?.classList.add('is-leaving');
      // A foto que sai continua opaca por baixo até a nova terminar de aparecer; só então é solta.
      window.setTimeout(()=>leaving?.classList.remove('is-leaving'),1300);
      coverIndex=next;
      incoming.classList.add('is-active');
    };
    // Só avança quando a próxima foto já carregou; se ainda não carregou, tenta de novo no próximo ciclo.
    if (imageReady(incoming.querySelector('img'))) show();
    else whenImageReady(incoming.querySelector('img'), 1500).then(ok => { if (ok) show(); });
  }
  if (manual) restartCoverTimer();
}
function restartCoverTimer() {
  clearInterval(coverTimer);
  if (coverImages.length > 1) coverTimer=setInterval(()=>goCover(coverIndex+1),5000);
}
function setupCoverCarousel() {
  renderCoverCarousel();
  restartCoverTimer();
}


function renderProfile() {
  const name = profile.name || fallbackProfile.name;
  const parts = name.split(/\s+(?=Del Mare$)/i);
  $('#profileName').innerHTML = `${escapeHtml(parts[0] || name)}<br><em>${escapeHtml(parts[1] || 'Del Mare')}</em>`;
  $('#profileBio').innerHTML = escapeHtml(profile.bio || fallbackProfile.bio).replace(/\n/g,'<br>');
  if (profile.cover_image && !coverFromGallery) coverImages = [profile.cover_image, ...fallbackCoverImages.filter(x=>x!==profile.cover_image)];
  renderCoverCarousel();
  const map = profile.map || fallbackProfile.map;
  $('#mapLink').href = map;
  const contact = profile.contact || fallbackProfile.contact;
  renderContact(contact);
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeUrl(value) { try { return new URL(value, window.location.href).href; } catch { return '#'; } }
function whatsappPhone(value) {
  let digits=String(value||'').replace(/\D/g,'');
  if(digits.startsWith('00'))digits=digits.slice(2);
  if(digits.startsWith('0'))digits=digits.slice(1);
  if(!digits.startsWith('55')&&(digits.length===10||digits.length===11))digits=`55${digits}`;
  return digits;
}

function cardIcon(key='link') { return cardIconSvg(key); }
function publicLinkType(item){
  const title=String(item?.title||'').toLowerCase(),type=item?.type||'link',url=String(item?.url||'');
  if(type!=='link')return type;
  if(url==='#stay'||/consult|disponib|estadia/.test(title))return 'whatsapp';
  if(url==='#tourism'||/pontos turíst|descubra búzios|búzios/.test(title))return 'tourism';
  if(url==='#contact'||/falar no whatsapp|entre em contato|^contato$|fale com/.test(title))return 'contact';
  if(url==='__MAP__'||/onde estamos|localiza/.test(title))return 'map';
  return 'link';
}

function renderLinks() {
  const root = $('#dynamicLinks');
  if (!root) return;
  const manualOrder = links.length > 0 && links.every(item => Number.isFinite(Number(item.position)) && Number(item.position) > 0);
  const visible = links
    .filter(item => item.active !== false)
    .sort((a,b) => {
      if (manualOrder) return Number(a.position) - Number(b.position);
      const order = (item) => {
        const title = String(item.title || '').toLowerCase();
        if (/conheça a casa|conhecer a casa/.test(title)) return 0;
        if (/consult|disponib/.test(title) || item.type === 'whatsapp') return 1;
        if (/pontos turísticos|descubra búzios|búzios/.test(title) || item.type === 'tourism') return 2;
        if (/instagram/.test(title) || item.type === 'instagram') return 3;
        if (/contato|fale com/.test(title) || item.type === 'contact') return 4;
        return 10 + (Number(item.position) || 0);
      };
      return order(a) - order(b);
    });
  let contactCardAdded=false;
  root.innerHTML = visible.map(item => {
    const rawTitle = String(item.title || '');
    const type = publicLinkType(item);
    const icon = cardIcon(resolveCardIcon(item, type));
    if(type==='contact'&&contactCardAdded)return '';
    if(type==='contact')contactCardAdded=true;
    const displayTitle=type==='contact'?'Entre em contato':rawTitle;
    const displaySubtitle=type==='contact'?'WhatsApp, telefones e Instagram da casa':item.subtitle||'';
    const content = `<span class="link-icon" aria-hidden="true">${icon}</span><span class="link-copy"><strong>${escapeHtml(displayTitle)}</strong><small>${escapeHtml(displaySubtitle)}</small></span>${SEA_HTML}`;
    if (type === 'contact') return `<button class="link-card" type="button" data-open-contact>${content}</button>`;
    if (type === 'tourism') return `<button class="link-card" type="button" data-open-tourism>${content}</button>`;
    if (type === 'whatsapp') return `<button class="link-card" type="button" data-open-calendar>${content}</button>`;
    let url = item.url || '#';
    if (url === '__MAP__') url = profile.map || fallbackProfile.map;
    const target = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : '';
    return `<a class="link-card" href="${escapeHtml(safeUrl(url))}"${target}>${content}</a>`;
  }).join('');
  bindDynamicActions();
  bindCardPressAnimation();
}

function bindCardPressAnimation() {
  const cards = $$('.link-card:not(.link-skeleton)');
  cards.forEach((card,i) => card.style.setProperty('--enter-delay', `${i*70}ms`));
  const list = $('#dynamicLinks');
  if (!list || list.dataset.fx) return;
  list.dataset.fx = '1';

  // A maré só muda CLASSES (is-lit / is-wet). Nada de escrever estilos por movimento do dedo nem de ler layout
  // durante a rolagem: o navegador anima tudo na GPU (transform), então a rolagem continua fluida.
  const SEL = '#dynamicLinks .link-card:not(.link-skeleton)';
  const LEAVE_MS = 60;     // a maré do card anterior baixa quase junto com a subida do novo
  const DRY_MS = 1300;     // depois de baixar, as ondas só param quando o card já secou
  const wetTimers = new WeakMap();
  let current = null;

  const dropNow = card => {
    card.classList.remove('is-lit');
    clearTimeout(wetTimers.get(card));
    wetTimers.set(card, window.setTimeout(() => card.classList.remove('is-wet'), DRY_MS));
  };
  const lightUp = card => {
    if (current && !current.isConnected) current = null;     // lista recriada pelo painel em tempo real
    if (card === current) return;
    const old = current;
    current = card;
    clearTimeout(wetTimers.get(card));
    card.classList.add('is-wet', 'is-lit');
    if (old) window.setTimeout(() => dropNow(old), LEAVE_MS);
  };
  const clear = () => { if (current) { dropNow(current); current = null; } };
  const cardAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest(SEL) : null;
  };
  const modalOpen = () => document.body.classList.contains('stay-modal-open') || !!document.querySelector('dialog[open]');

  // ---- Celular: a maré vai para o card tocado e FICA nele, mesmo depois de soltar o dedo. ----
  // Durante o arrasto, a posição do dedo é avaliada no máximo UMA vez por quadro (rAF) e a maré só troca de card
  // depois de o novo card ser confirmado em dois quadros seguidos (evita piscar em rolagem rápida).
  let touching = false, tx = 0, ty = 0, frame = 0, pending = null;
  const evaluate = () => {
    frame = 0;
    if (!touching) return;
    const card = cardAt(tx, ty);
    if (!card || card === current) { pending = null; return; }
    if (card === pending) { pending = null; lightUp(card); } else { pending = card; frame = requestAnimationFrame(evaluate); }
  };
  document.addEventListener('touchstart', e => {
    if (modalOpen()) return;
    const t = e.touches[0];
    if (!t) return;
    touching = true; pending = null; tx = t.clientX; ty = t.clientY;
    const card = cardAt(tx, ty);
    if (card) lightUp(card);
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!touching) return;
    const t = e.touches[0];
    if (!t) return;
    tx = t.clientX; ty = t.clientY;
    if (!frame) frame = requestAnimationFrame(evaluate);
  }, { passive: true });
  const endTouch = () => { touching = false; pending = null; if (frame) { cancelAnimationFrame(frame); frame = 0; } };
  document.addEventListener('touchend', endTouch, { passive: true });
  document.addEventListener('touchcancel', endTouch, { passive: true });

  // ---- Mouse e caneta: a maré sobe enquanto o ponteiro está em cima (também ao girar a roda). ----
  let mouse = null, hoverFrame = 0;
  const hover = () => {
    hoverFrame = 0;
    if (!mouse) return;
    const card = cardAt(mouse.x, mouse.y);
    if (card) lightUp(card); else clear();
  };
  const scheduleHover = () => { if (!hoverFrame) hoverFrame = requestAnimationFrame(hover); };
  list.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mouse = { x: e.clientX, y: e.clientY };
    scheduleHover();
  }, { passive: true });
  list.addEventListener('pointerleave', e => {
    if (e.pointerType === 'touch') return;
    mouse = null;
    clear();
  }, { passive: true });
  window.addEventListener('scroll', () => { if (mouse) scheduleHover(); }, { passive: true });
}

// Página de leitura: no CELULAR/TABLET (tela de toque) não copia texto (exceto contatos/Instagram) e não dá zoom.
// No DESKTOP (mouse) nada é bloqueado: botão direito, seleção, cópia e zoom funcionam normalmente.
// A checagem é feita a cada evento, então acompanha mudanças reais de dispositivo (ex.: tablet com mouse).
const touchOnlyQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
const isTouchDevice = () => touchOnlyQuery.matches;
function setupPageGuards() {
  const elOf = n => (n && n.nodeType === 1 ? n : n && n.parentElement) || null;
  const allowed = n => { const el = elOf(n); return !!(el && el.closest('#contactDialog, [data-copyable]')); };
  ['copy', 'cut', 'dragstart', 'contextmenu', 'selectstart'].forEach(type =>
    document.addEventListener(type, e => { if (isTouchDevice() && !allowed(e.target)) e.preventDefault(); }));
  // iOS: pinça para dar zoom.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(type =>
    document.addEventListener(type, e => { if (isTouchDevice()) e.preventDefault(); }));
}
setupPageGuards();

function tripadvisorSearch(title) { return 'https://www.tripadvisor.com.br/Search?q=' + encodeURIComponent(title + ' Búzios'); }

function renderTourism() {
  const root = $('#tourismGrid');
  if (!root) return;
  root.innerHTML = tourism.filter(item => item.active !== false).sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0)).map(item => `<article class="tourism-card">
    <div class="tourism-image-wrap"><img src="${escapeHtml(item.image_url || './assets/gallery/detalhe-11.jpg')}" alt="${escapeHtml(item.title)}" loading="lazy"><span>${escapeHtml(item.category || 'Búzios')}</span></div>
    <div class="tourism-body"><small>${escapeHtml(item.subtitle||'')}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description||'')}</p><div class="tourism-recommendation"><b>Nosso olhar</b><span>${escapeHtml(item.recommendation||'')}</span></div><div class="tourism-actions"><a class="tourism-action map-action" href="${escapeHtml(safeUrl(item.map_url||'#'))}" target="_blank" rel="noopener"><span aria-hidden="true">⌖</span> Abrir no Maps</a><a class="tourism-action trip-action" href="${escapeHtml(safeUrl(item.tripadvisor_url||tripadvisorSearch(item.title)))}" target="_blank" rel="noopener"><span aria-hidden="true">★</span> TripAdvisor</a></div></div>
  </article>`).join('');
}

function renderContact(contact) {
  const root = $('#contactActions');
  if (!root) return;
  const phones = Array.isArray(contact?.phones) ? contact.phones : fallbackProfile.contact.phones;
  const contactNames = ['Mônica', 'Camila'];
  const instagram = contact?.instagram || fallbackProfile.contact.instagram;
  root.innerHTML = `${phones.map((phone,index) => {const digits=whatsappPhone(phone);const name=contactNames[index]||`Contato ${index+1}`;const text=encodeURIComponent(`Olá, ${name}! Gostaria de falar sobre a Casa Oito Del Mare.`);return `<a class="contact-action" href="https://wa.me/${digits}?text=${text}" target="_blank" rel="noopener"><span>◉</span><div><small>WhatsApp · ${escapeHtml(name)}</small><b>${escapeHtml(phone)}</b></div></a>`}).join('')}<a class="contact-action" href="${escapeHtml(safeUrl(instagram))}" target="_blank" rel="noopener"><span>◎</span><div><small>Instagram</small><b>@casaoitodelmare</b></div></a>`;
}

function bindDynamicActions() {
  $$('[data-open-contact]').forEach(button => button.onclick = () => $('#contactDialog')?.showModal());
  $$('[data-open-tourism]').forEach(button => button.onclick = openTourism);
  $$('[data-open-calendar]').forEach(button => button.onclick = openStayCalendar);
}

let statusMapCache={src:null,map:null};
function availabilityStatusMap(){
  if(statusMapCache.src===availability&&statusMapCache.map)return statusMapCache.map;
  const map=new Map();
  const addRange=(start,end,status)=>{
    if(!start)return;
    const a=parseDateKey(String(start));
    const b=parseDateKey(String(end||start));
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return;
    const from=a<=b?a:b; const to=a<=b?b:a;
    for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1)){
      const key=dateKey(d);
      if(!map.has(key)) map.set(key,status);
    }
  };
  (availability?.reservations || []).forEach(r=>{
    if(!r)return;
    const start=r.check_in||r.checkIn||r.date;
    const end=r.check_out||r.checkOut||start;
    if(start) addRange(String(start),String(end),r.status || (r.reserved===false?'available':'reserved'));
  });
  (availability?.reservedDates || []).forEach(d=>{if(!map.has(String(d))) map.set(String(d),'reserved');});
  statusMapCache={src:availability,map};
  return map;
}
function reservedSet(){return new Set([...availabilityStatusMap()].filter(([,status])=>status!=='available').map(([date])=>date));}
function dateKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function todayKey(){ return dateKey(new Date()); }
function monthKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
let stayScrollLockY=0;
function lockStayScroll(){
  if(document.body.dataset.stayScrollLocked==='1') return;
  stayScrollLockY=window.scrollY||window.pageYOffset||0;
  document.body.dataset.stayScrollLocked='1';
  document.documentElement.classList.add('stay-modal-open');
  document.body.classList.add('stay-modal-open');
  document.body.style.top=`-${stayScrollLockY}px`;
}
function unlockStayScroll(){
  if(document.body.dataset.stayScrollLocked!=='1') return;
  document.documentElement.classList.remove('stay-modal-open');
  document.body.classList.remove('stay-modal-open');
  document.body.style.removeProperty('top');
  delete document.body.dataset.stayScrollLocked;
  window.scrollTo(0,stayScrollLockY);
}
function parseDateKey(key){const [y,m,d]=String(key).split('-').map(Number);return new Date(y,m-1,d)}
function isBetween(key,a,b){if(!a||!b)return false;const t=parseDateKey(key).getTime();return t>parseDateKey(a).getTime()&&t<parseDateKey(b).getTime()}
function clearHolidayInfo(){const info=$('#calendarHolidayInfo');if(info){info.hidden=true;info.textContent=''}holidayInfoKey=null}
function showHolidayInfo(key,holiday){
  const info=$('#calendarHolidayInfo');if(!info)return;
  const scope=holiday.scope==='rj'?'Feriado estadual · Rio de Janeiro':'Feriado nacional';
  info.innerHTML=`<em class="${holiday.scope==='rj'?'rj':''}" aria-hidden="true"></em><span><b>${escapeHtml(holiday.name)}</b><small>${scope} · ${key.split('-').reverse().join('/')}</small></span>`;
  info.hidden=false;holidayInfoKey=key;
}
function rangeHasReserved(a,b){
  if(!a||!b)return false;
  const statusMap=availabilityStatusMap(), start=parseDateKey(a), end=parseDateKey(b);
  for(let d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+1);d<end;d.setDate(d.getDate()+1)){
    const status=statusMap.get(dateKey(d))||'available';
    if(status!=='available') return true;
  }
  return false;
}
function renderCalendar(){
  const monthEl=$('#calendarMonth'), grid=$('#calendarGrid'); if(!monthEl||!grid)return;
  const statusMap=availabilityStatusMap();
  monthEl.textContent=monthTitle(calendarMonth);
  const prev=$('#calendarPrev');
  const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  if(prev){prev.disabled=calendarMonth.getFullYear()===currentMonth.getFullYear()&&calendarMonth.getMonth()===currentMonth.getMonth();}
  const first=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);
  const days=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate();
  const offset=first.getDay(); const today=dateKey(new Date());
  let html='';
  for(let i=0;i<offset;i++) html+='<button class="calendar-day empty" type="button" tabindex="-1" aria-hidden="true"></button>';
  for(let d=1;d<=days;d++){
    const key=dateKey(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),d));
    const status=statusMap.get(key)||'available';
    const isPast=key<today;
    const unavailable=status!=='available'||isPast;
    const holiday=holidayForKey(key), selectedIn=checkinDate===key, selectedOut=checkoutDate===key;
    const inRange=isBetween(key,checkinDate,checkoutDate);
    const cls=['calendar-day',status==='reserved'?'is-reserved':'',status==='blocked'?'is-blocked':'',status==='pre'?'is-pre':'',holiday?'is-holiday':'',holiday?.scope==='rj'?'is-holiday-rj':'',holiday?.scope==='nacional'?'is-holiday-national':'',selectedIn?'is-checkin':'',selectedOut?'is-checkout':'',inRange?'is-range':'',key===today?'is-today':''].filter(Boolean).join(' ');
    const label=unavailable?', indisponível':holiday?`, ${holiday.scope==='rj'?'feriado estadual do Rio de Janeiro':'feriado nacional'}: ${holiday.name}`:selectedIn?', entrada':selectedOut?', saída':'';
    html+=`<button class="${cls}${isPast?' is-past':''}" type="button" data-date="${key}" aria-label="${d} de ${monthEl.textContent.toLowerCase()}${label}" ${unavailable?'aria-disabled="true"':''}>${d}</button>`;
  }
  grid.innerHTML=html;
}

// Um único listener no calendário deixa o toque confiável no Safari/iPhone e
// evita que a renderização do calendário durante o clique perca o evento.
$('#calendarGrid')?.addEventListener('click', event=>{
  const btn=event.target.closest?.('#calendarGrid [data-date]');
  if(!btn) return;
  event.preventDefault();
  event.stopPropagation();
  const key=btn.dataset.date;
  const status=availabilityStatusMap().get(key)||'available';
  if(key<todayKey() || status!=='available') return;
  const holiday=holidayForKey(key);
  if(holiday)showHolidayInfo(key,holiday);
  else clearHolidayInfo();
  // Segundo clique na mesma data de entrada limpa a seleção; qualquer outra data livre vira a nova entrada.
  if(key===checkinDate && !checkoutDate){
    checkinDate=null; checkoutDate=null; selectedDate=null; clearCalendarError(); clearHolidayInfo(); updateCalendarWhatsApp(); renderCalendar(); return;
  }
  if(!checkinDate || (checkinDate && checkoutDate)){
    checkinDate=key; checkoutDate=null; clearCalendarError(); updateCalendarWhatsApp(); renderCalendar(); return;
  }
  if(parseDateKey(key)<=parseDateKey(checkinDate)){
    checkinDate=key; checkoutDate=null; clearCalendarError(); updateCalendarWhatsApp(); renderCalendar(); return;
  }
  if(rangeHasReserved(checkinDate,key)){
    checkinDate=null; checkoutDate=null; clearCalendarError(); updateCalendarWhatsApp(); renderCalendar();
    showCalendarError();
    return;
  }
  checkoutDate=key; clearCalendarError(); updateCalendarWhatsApp(); renderCalendar();
});
function updateCalendarWhatsApp(){
  const w=$('#calendarWhatsapp');
  if(!w) return;
  const phone=whatsappPhone(availability.whatsapp||fallbackProfile.whatsapp);
  if(!phone) return;
  if(checkinDate && checkoutDate){
    const brIn=checkinDate.split('-').reverse().join('/'), brOut=checkoutDate.split('-').reverse().join('/');
    w.href='https://wa.me/'+phone+'?text='+encodeURIComponent(`Olá! Gostaria de consultar a disponibilidade da Casa Oito Del Mare para entrada em ${brIn} e saída em ${brOut}.`);
    w.removeAttribute('aria-disabled');
    w.classList.remove('is-disabled');
  }else if(checkinDate){
    const brIn=checkinDate.split('-').reverse().join('/');
    w.href='https://wa.me/'+phone+'?text='+encodeURIComponent(`Olá! Gostaria de consultar uma diária na Casa Oito Del Mare para ${brIn}.`);
    w.removeAttribute('aria-disabled');
    w.classList.remove('is-disabled');
  }else{
    w.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Olá! Gostaria de falar sobre uma estadia na Casa Oito Del Mare.');
    w.setAttribute('aria-disabled','true');
    w.classList.add('is-disabled');
  }
}

function openStayCalendar(){
  const dialog=$('#stayDialog'); if(!dialog)return;
  $('#stayTitle').textContent=availability.title||'Consulte sua estadia.';
  $('#staySubtitle').textContent=availability.subtitle||'Escolha a entrada e a saída. As datas reservadas aparecem em vermelho.';
  checkinDate=null; checkoutDate=null; selectedDate=null; clearCalendarError();clearHolidayInfo();
  calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  updateCalendarWhatsApp();
  renderCalendar();
  lockStayScroll();
  dialog.showModal();
  startLiveWatch();
}
$('[data-close-stay]')?.addEventListener('click',()=>$('#stayDialog')?.close());
$('#stayDialog')?.addEventListener('click',event=>{
  const target=event.target;
  const dialog=$('#stayDialog');
  if(target!==dialog)return;
  checkinDate=null; checkoutDate=null; selectedDate=null; clearCalendarError();clearHolidayInfo(); updateCalendarWhatsApp(); renderCalendar();
  dialog.close();
  unlockStayScroll();
});

$('#stayDialog')?.addEventListener('close',()=>{stopLiveWatch();checkinDate=null;checkoutDate=null;selectedDate=null;clearHolidayInfo();unlockStayScroll();});
$('#calendarWhatsapp')?.addEventListener('click',event=>{
  if(!checkinDate){event.preventDefault();showToast('Escolha uma data para consultar.');}
});
$('#calendarPrev')?.addEventListener('click',()=>{const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);if(calendarMonth<=currentMonth)return;calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);clearHolidayInfo();renderCalendar();});
$('#calendarNext')?.addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);clearHolidayInfo();renderCalendar();});
// Gestos do calendário público: toque normal seleciona a data; toque longo + arraste
// seleciona o período. O gesto fica restrito ao calendário público desta página.
(()=>{
  const grid=$('#calendarGrid');
  if(!grid) return;
  const host=grid.closest('dialog')||grid.parentElement||grid;
  let holdTimer=null,edgeTimer=null,pointerId=null,dragging=false,swiping=false;
  let startX=0,startY=0,lastX=0,lastY=0,dragStartKey='',dragLastKey='',tapKey='',suppressUntil=0;
  const currentMonth=()=>new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const stopTimers=()=>{clearTimeout(holdTimer);holdTimer=null;clearInterval(edgeTimer);edgeTimer=null};
  const available=key=>{
    const st=availabilityStatusMap().get(key)||'available';
    return /^\d{4}-\d{2}-\d{2}$/.test(String(key))&&key>=todayKey()&&st==='available';
  };
  const keyUnder=(x,y)=>document.elementFromPoint(x,y)?.closest?.('#calendarGrid [data-date]')?.dataset.date||'';
  const shiftMonth=dir=>{
    const next=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+dir,1);
    if(dir<0&&next<currentMonth()) return false;
    calendarMonth=next;clearHolidayInfo();renderCalendar();return true;
  };
  const firstAvailable=dir=>{
    const buttons=[...document.querySelectorAll('#calendarGrid [data-date]')].filter(b=>available(b.dataset.date));
    if(!buttons.length)return '';
    return (dir>0?buttons[0]:buttons[buttons.length-1]).dataset.date;
  };
  const applyDragKey=key=>{
    if(!dragging||!available(key)||key===dragLastKey)return;
    const a=dragStartKey,b=key;
    const nextStart=a<=b?a:b,nextEnd=a<=b?b:a;
    if(rangeHasReserved(nextStart,nextEnd))return;
    dragLastKey=key;
    checkinDate=nextStart;checkoutDate=nextEnd;selectedDate=nextStart;
    clearCalendarError();clearHolidayInfo();updateCalendarWhatsApp();renderCalendar();
  };
  const beginLongPress=()=>{
    if(!dragStartKey||swiping)return;
    holdTimer=null;dragging=true;
    checkinDate=dragStartKey;checkoutDate=dragStartKey;selectedDate=dragStartKey;
    updateCalendarWhatsApp();
    if(pointerId!==null)try{grid.setPointerCapture(pointerId)}catch{}
    renderCalendar();
  };
  const finish=()=>{
    stopTimers();
    if(pointerId!==null)try{grid.releasePointerCapture(pointerId)}catch{}
    pointerId=null;dragging=false;swiping=false;dragStartKey='';dragLastKey='';tapKey='';
  };
  const edgeStep=dir=>{
    if(!dragging||!shiftMonth(dir))return;
    const boundary=firstAvailable(dir);
    if(boundary)applyDragKey(boundary);
  };
  const moveSelection=(x,y)=>{
    if(!dragging)return;
    lastX=x;lastY=y;
    const key=keyUnder(x,y);if(key)applyDragKey(key);
    const g=$('#calendarGrid');if(!g)return;
    const r=g.getBoundingClientRect(),edge=44;
    if(x>r.right-edge){if(!edgeTimer)edgeTimer=setInterval(()=>edgeStep(1),300)}
    else if(x<r.left+edge){if(!edgeTimer)edgeTimer=setInterval(()=>edgeStep(-1),300)}
    else{clearInterval(edgeTimer);edgeTimer=null}
  };
  const startGesture=(x,y,key)=>{
    startX=x;startY=y;lastX=x;lastY=y;dragging=false;swiping=false;
    dragStartKey='';dragLastKey='';tapKey=key||'';
    if(key&&available(key)){dragStartKey=key;dragLastKey=key;holdTimer=setTimeout(beginLongPress,450)}
  };
  const moveGesture=(x,y)=>{
    lastX=x;lastY=y;
    const dx=x-startX,dy=y-startY;
    if(!dragging&&!swiping&&(Math.abs(dx)>10||Math.abs(dy)>10)){
      if(Math.abs(dx)>Math.abs(dy)*1.12&&Math.abs(dx)>26){
        swiping=true;clearTimeout(holdTimer);holdTimer=null;
      }else if(Math.abs(dy)>Math.abs(dx)){
        clearTimeout(holdTimer);holdTimer=null;
      }
    }
    if(swiping||dragging)moveSelection(x,y);
  };
  const endGesture=(x,y)=>{
    const dx=x-startX,dy=y-startY;
    const wasDrag=dragging,wasSwipe=swiping;
    stopTimers();
    if(wasDrag){
      suppressUntil=Date.now()+700;
      renderCalendar();
      finish();
      return;
    }
    if(wasSwipe||(Math.abs(dx)>=52&&Math.abs(dx)>Math.abs(dy)*1.12)){
      if(shiftMonth(dx<0?1:-1))suppressUntil=Date.now()+700;
    }
    finish();
  };
  grid.style.touchAction='none';
  grid.addEventListener('pointerdown',event=>{
    if(pointerId!==null)return;
    if(event.pointerType==='mouse'&&event.button!==0)return;
    const btn=event.target.closest?.('#calendarGrid [data-date]');
    if(!btn)return;
    pointerId=event.pointerId;
    // Sem captura aqui: capturar no pointerdown redireciona o clique para a grade e o toque simples deixava de selecionar a data.
    startGesture(event.clientX,event.clientY,btn.dataset.date||'');
  },{passive:false});
  grid.addEventListener('pointermove',event=>{
    if(pointerId!==event.pointerId)return;
    moveGesture(event.clientX,event.clientY);
    if((swiping||dragging)&&!grid.hasPointerCapture(pointerId)){try{grid.setPointerCapture(pointerId)}catch{}}
    if(swiping||dragging)event.preventDefault();
  },{passive:false});
  grid.addEventListener('pointerup',event=>{
    if(pointerId!==event.pointerId)return;
    endGesture(event.clientX,event.clientY);
  },{passive:false});
  grid.addEventListener('pointercancel',event=>{
    if(pointerId===event.pointerId)finish();
  },{passive:false});
  grid.addEventListener('lostpointercapture',()=>{if(pointerId!==null&&!dragging&&!swiping)finish()});
  grid.addEventListener('contextmenu',event=>{if(dragging)event.preventDefault()});
  grid.addEventListener('click',event=>{
    if(Date.now()<suppressUntil){event.preventDefault();event.stopPropagation();}
  },true);
})();

$('[data-close-contact]')?.addEventListener('click', () => $('#contactDialog')?.close());
$('#contactDialog')?.addEventListener('click', event => { if (event.target === $('#contactDialog')) $('#contactDialog').close(); });
$('[data-close-tourism]')?.addEventListener('click', () => $('#tourismDialog')?.close());
$('#tourismDialog')?.addEventListener('click', event => { if (event.target === $('#tourismDialog')) $('#tourismDialog').close(); });

shareButton?.addEventListener('click', async () => {
  const shareData = {title:'Casa Oito Del Mare · Búzios', text:'Conheça a Casa Oito Del Mare e descubra Búzios.', url:window.location.href};
  try { if (navigator.share) { await navigator.share(shareData); return; } await navigator.clipboard.writeText(shareData.url); showToast('Link copiado para compartilhar.'); }
  catch (error) { if (error?.name !== 'AbortError') showToast('Não foi possível compartilhar agora.'); }
});

// Conteúdo local aparece primeiro; o Supabase atualiza em segundo plano.
setupCoverCarousel();
renderProfile();
renderTourism();

// ===== Sincronização instantânea com o painel (reservas, cards e dados da casa) =====
let liveClient = null, liveBusy = false, liveKick = 0, livePoll = 0, liveChannels = [];
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function onAvailabilityChanged(beforeSet) {
  const dialog = $('#stayDialog');
  if (!dialog?.open) return;
  const conflict = checkinDate && checkoutDate && rangeHasReserved(checkinDate, checkoutDate);
  if (conflict) { checkinDate = null; checkoutDate = null; selectedDate = null; updateCalendarWhatsApp(); }
  renderCalendar();
  if (conflict) showCalendarError('Essas datas acabaram de ser reservadas. Escolha outro período.');
  const now = reservedSet();
  const changed = [...now].filter(d => !beforeSet.has(d)).concat([...beforeSet].filter(d => !now.has(d)));
  changed.forEach(key => {
    const el = $(`#calendarGrid [data-date="${key}"]`);
    if (el) { el.classList.add('just-changed'); window.setTimeout(() => el.classList.remove('just-changed'), 1800); }
  });
}

async function refreshFromServer() {
  if (!liveClient || liveBusy) return;
  liveBusy = true;
  try {
    const { data, error } = await liveClient.from('link_page_settings').select('profile,availability,links').eq('id',1).maybeSingle();
    if (error || !data) return;
    const beforeSet = reservedSet();
    const nextAvail = { ...fallbackProfile.availability, ...(data.availability || {}) };
    if (!sameJson(nextAvail, availability)) { availability = nextAvail; onAvailabilityChanged(beforeSet); }
    const nextProfile = { ...profile, ...(data.profile || {}) };
    if (!sameJson(nextProfile, profile)) { profile = nextProfile; renderProfile(); }
    if (Array.isArray(data.links) && data.links.length && !sameJson(data.links, links)) { links = data.links; renderLinks(); }
  } catch {} finally { liveBusy = false; }
}
const kickRefresh = () => { clearTimeout(liveKick); liveKick = window.setTimeout(refreshFromServer, 80); };

// O canal em tempo real só fica aberto enquanto o calendário está na tela.
function stopLiveWatch() {
  clearInterval(livePoll);
  liveChannels.forEach(ch => { try { liveClient?.removeChannel(ch); } catch {} });
  liveChannels = [];
}
function startLiveWatch() {
  refreshFromServer();
  if (!liveClient) return;
  stopLiveWatch();
  try {
    liveChannels = [
      liveClient.channel('link-page-sync').on('broadcast', { event: 'changed' }, kickRefresh).subscribe(),
      liveClient.channel('link-page-db').on('postgres_changes', { event: '*', schema: 'public', table: 'link_page_settings' }, kickRefresh).subscribe()
    ];
  } catch {}
  livePoll = window.setInterval(refreshFromServer, 12000);
}
try { new BroadcastChannel('casa-oito-links').onmessage = kickRefresh; } catch {}
document.addEventListener('visibilitychange', () => { if (!document.hidden) kickRefresh(); });
window.addEventListener('focus', kickRefresh);
window.addEventListener('online', kickRefresh);

let linksShown = false;
function showLinksOnce() { if (linksShown) return; linksShown = true; renderLinks(); }

async function hydrate() {
  if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) { showLinksOnce(); return; }
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    liveClient = client;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1800));
    const query = client.from('link_page_settings').select('profile,appearance,availability,links').eq('id',1).maybeSingle();
    const result = await Promise.race([query, timeout]);
    if (!result?.error && result?.data) {
      profile = {...profile, ...(result.data.profile || {})};
      availability = {...availability, ...(result.data.availability || {})};
      if (Array.isArray(result.data.links) && result.data.links.length) links = result.data.links;
      renderProfile();
    }
    showLinksOnce();
    try {
      const galleryResult = await Promise.race([client.from('gallery').select('image_url,position,in_carousel,active').eq('active',true).order('position',{ascending:true}), timeout]);
      if (!galleryResult?.error && Array.isArray(galleryResult?.data)) {
        const selected = galleryResult.data.filter(x=>x.in_carousel===true).map(x=>x.image_url);
        if (selected.length) { coverFromGallery = true; coverImages = selected; renderCoverCarousel(); restartCoverTimer(); }
      }
    } catch {}

    const touristQuery = client.from('tourist_points').select('*').eq('active',true).order('position',{ascending:true});
    const touristResult = await Promise.race([touristQuery, timeout]);
    if (!touristResult?.error && Array.isArray(touristResult?.data) && touristResult.data.length) { tourism = touristResult.data; renderTourism(); }
  } catch {}
  showLinksOnce();
}
hydrate();
