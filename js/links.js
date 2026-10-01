import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

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
let coverIndex = 0;
let coverTimer = null;

function renderCoverCarousel(images = coverImages) {
  const track = $('#profileCoverTrack');
  if (!track) return;
  coverImages = images.filter(Boolean);
  if (!coverImages.length) coverImages = [...fallbackCoverImages];
  coverIndex = Math.min(coverIndex, coverImages.length - 1);
  track.innerHTML = coverImages.map((src,i)=>`<div class="cover-slide ${i===coverIndex?'is-active':''}"><img src="${escapeHtml(src)}" alt="Casa Oito Del Mare · foto ${i+1}" ${i===0?'fetchpriority="high"':''} loading="${i===0?'eager':'lazy'}"></div>`).join('');
}

function goCover(index,manual=false) {
  if (!coverImages.length) return;
  coverIndex=(index+coverImages.length)%coverImages.length;
  renderCoverCarousel();
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
  if (profile.cover_image) coverImages = [profile.cover_image, ...fallbackCoverImages.filter(x=>x!==profile.cover_image)];
  renderCoverCarousel();
  const map = profile.map || fallbackProfile.map;
  $('#mapLink').href = map;
  const contact = profile.contact || fallbackProfile.contact;
  renderContact(contact);
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeUrl(value) { try { return new URL(value, window.location.href).href; } catch { return '#'; } }

function cardIcon(type='link') {
  const icons = {
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M13 14h3M8 17h3"/></svg>',
    whatsapp:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"/><path d="M8.7 9.2c.2-.4.5-.5.8-.3l1 .8c.3.2.3.5.1.8l-.5.7c.7 1.1 1.6 2 2.7 2.7l.7-.5c.3-.2.6-.2.8.1l.8 1c.2.3.1.6-.3.8-.6.3-1.3.4-2 .2-2.5-.8-4.6-2.9-5.4-5.4-.2-.7-.1-1.4.2-2Z"/></svg>',
    tourism:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>',
    contact:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.8 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"/><path d="M8 8h8M8 11h5"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="1"/></svg>',
    map:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"/><path d="M9 4v14M15 6v14"/></svg>',
    link:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13.8 8.5 15.3a3.5 3.5 0 1 1-5-5l3-3a3.5 3.5 0 0 1 5 0M14 10.2l1.5-1.5a3.5 3.5 0 1 1 5 5l-3 3a3.5 3.5 0 0 1-5 0M8.5 12h7"/></svg>'
  };
  return icons[type] || icons.link;
}

function renderLinks() {
  const root = $('#dynamicLinks');
  if (!root) return;
  const visible = links
    .filter(item => item.active !== false)
    .filter(item => !/falar no whatsapp/i.test(item.title || ''))
    .sort((a,b) => {
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
  root.innerHTML = visible.map(item => {
    const rawTitle = String(item.title || '');
    const type = item.type || (/instagram/i.test(rawTitle) ? 'instagram' : /contato|fale com/i.test(rawTitle) ? 'contact' : /turíst|búzios/i.test(rawTitle) ? 'tourism' : /consult|disponib/i.test(rawTitle) ? 'whatsapp' : 'home');
    const icon = cardIcon(type);
    const content = `<span class="link-icon" aria-hidden="true">${icon}</span><span class="link-copy"><strong>${escapeHtml(rawTitle)}</strong><small>${escapeHtml(item.subtitle||'')}</small></span>`;
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
  $$('.link-card').forEach(card => {
    card.addEventListener('pointerdown', () => {
      card.classList.remove('is-pressing');
      void card.offsetWidth;
      card.classList.add('is-pressing');
      window.setTimeout(() => card.classList.remove('is-pressing'), 520);
    }, {passive:true});
  });
}

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
  const instagram = contact?.instagram || fallbackProfile.contact.instagram;
  root.innerHTML = `${phones.map(phone => `<a class="contact-action" href="tel:${escapeHtml(phone.replace(/\D/g,''))}"><span>☎</span><div><small>Telefone</small><b>${escapeHtml(phone)}</b></div></a>`).join('')}<a class="contact-action" href="${escapeHtml(safeUrl(instagram))}" target="_blank" rel="noopener"><span>◎</span><div><small>Instagram</small><b>@casaoitodelmare</b></div></a>`;
}

function bindDynamicActions() {
  $$('[data-open-contact]').forEach(button => button.onclick = () => $('#contactDialog')?.showModal());
  $$('[data-open-tourism]').forEach(button => button.onclick = openTourism);
  $$('[data-open-calendar]').forEach(button => button.onclick = openStayCalendar);
}

function reservedSet(){ return new Set((availability?.reservedDates || []).map(String)); }
function dateKey(date){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
function renderCalendar(){
  const monthEl=$('#calendarMonth'), grid=$('#calendarGrid'); if(!monthEl||!grid)return;
  const reserved=reservedSet();
  monthEl.textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(calendarMonth);
  const first=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),1);
  const days=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,0).getDate();
  const offset=first.getDay(); const today=dateKey(new Date());
  let html='';
  for(let i=0;i<offset;i++) html+='<button class="calendar-day empty" type="button" tabindex="-1" aria-hidden="true"></button>';
  for(let d=1;d<=days;d++){
    const key=dateKey(new Date(calendarMonth.getFullYear(),calendarMonth.getMonth(),d));
    const isReserved=reserved.has(key); const selected=selectedDate===key;
    const cls=['calendar-day',isReserved?'is-reserved':'',selected?'is-selected':'',key===today?'is-today':''].filter(Boolean).join(' ');
    html+=`<button class="${cls}" type="button" data-date="${key}" aria-label="${d} de ${monthEl.textContent}${isReserved?', reservado':''}">${d}</button>`;
  }
  grid.innerHTML=html;
  grid.querySelectorAll('[data-date]').forEach(btn=>btn.addEventListener('click',()=>{
    if(btn.classList.contains('is-reserved')) return;
    selectedDate=btn.dataset.date; renderCalendar();
    const w=$('#calendarWhatsapp');
    if(w&&availability.whatsapp) w.href='https://wa.me/'+String(availability.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent(`Olá! Gostaria de consultar a disponibilidade da Casa Oito Del Mare para ${selectedDate.split('-').reverse().join('/')}.`);
  }));
}
function openStayCalendar(){
  const dialog=$('#stayDialog'); if(!dialog)return;
  $('#stayTitle').textContent=availability.title||'Consulte sua estadia.';
  $('#staySubtitle').textContent=availability.subtitle||'As datas em vermelho já estão reservadas. As demais estão livres para consulta.';
  selectedDate=null; calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const w=$('#calendarWhatsapp'); if(w) w.href='https://wa.me/'+String(availability.whatsapp||fallbackProfile.whatsapp).replace(/\D/g,'');
  renderCalendar(); dialog.showModal();
}
$('#calendarPrev')?.addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()-1,1);renderCalendar();});
$('#calendarNext')?.addEventListener('click',()=>{calendarMonth=new Date(calendarMonth.getFullYear(),calendarMonth.getMonth()+1,1);renderCalendar();});
$('[data-close-stay]')?.addEventListener('click',()=>$('#stayDialog')?.close());
$('#stayDialog')?.addEventListener('click',event=>{if(event.target===$('#stayDialog'))$('#stayDialog').close();});

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
renderLinks();
renderTourism();

async function hydrate() {
  if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) return;
  try {
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1800));
    const query = client.from('link_page_settings').select('profile,appearance,availability,links').eq('id',1).maybeSingle();
    const result = await Promise.race([query, timeout]);
    if (!result?.error && result?.data) {
      profile = {...profile, ...(result.data.profile || {})};
      availability = {...availability, ...(result.data.availability || {})};
      if (Array.isArray(result.data.links) && result.data.links.length) links = result.data.links;
      renderProfile(); renderLinks();
    }
    try {
      const galleryResult = await Promise.race([client.from('gallery').select('image_url,position,in_carousel,active').eq('active',true).order('position',{ascending:true}), timeout]);
      if (!galleryResult?.error && Array.isArray(galleryResult?.data)) {
        const selected = galleryResult.data.filter(x=>x.in_carousel===true).map(x=>x.image_url);
        if (selected.length) { coverImages = selected; renderCoverCarousel(); restartCoverTimer(); }
      }
    } catch {}

    const touristQuery = client.from('tourist_points').select('*').eq('active',true).order('position',{ascending:true});
    const touristResult = await Promise.race([touristQuery, timeout]);
    if (!touristResult?.error && Array.isArray(touristResult?.data) && touristResult.data.length) { tourism = touristResult.data; renderTourism(); }
  } catch {}
}
hydrate();
