import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config.js";

const drawer = document.querySelector('#drawer');
const page = document.querySelector('#page');
const back = document.querySelector('#back');
const homeCards = document.querySelector('#homeCards');
const lightbox = document.querySelector('#lightbox');
let pageScrollY = 0;
let pageScrollLocked = false;
function lockPageScroll(){
  if(pageScrollLocked)return;
  pageScrollY=window.scrollY||document.documentElement.scrollTop||0;
  pageScrollLocked=true;
  document.documentElement.classList.add('drawer-scroll-locked');
  document.body.classList.add('drawer-open');
  document.body.style.position='fixed';
  document.body.style.top=`-${pageScrollY}px`;
  document.body.style.left='0';
  document.body.style.right='0';
  document.body.style.width='100%';
}
function unlockPageScroll(){
  document.documentElement.classList.remove('drawer-scroll-locked');
  document.body.classList.remove('drawer-open');
  if(!pageScrollLocked)return;
  pageScrollLocked=false;
  document.body.style.position='';
  document.body.style.top='';
  document.body.style.left='';
  document.body.style.right='';
  document.body.style.width='';
  const restoreY=pageScrollY;
  requestAnimationFrame(()=>window.scrollTo(0,restoreY));
}
const featureCards = [
  {title:'Por dentro da Casa',description:'Uma casa feita para receber bem, com espaços acolhedores e um jeitinho de casa de família.',image_url:'./assets/gallery/casa-04.jpg',url:'casa',sort_order:1},
  {title:'A vida à beira-mar',description:'Praia calma em frente, jardim, piscina e uma rotina sem pressa.',image_url:'./assets/gallery/detalhe-03.jpg',url:'estrutura',sort_order:2},
  {title:'Búzios em movimento',description:'Sol, mar e um horizonte que pede mais um dia.',image_url:'./assets/gallery/detalhe-13.jpg',url:'buzios',sort_order:3},
  {title:'Sua estadia começa aqui',description:'Consulte datas e converse diretamente com as proprietárias.',image_url:'./assets/gallery/casa-01.jpg',url:'reserva',sort_order:4}
];
const photos = [
  ['Sala de estar','./assets/gallery/casa-04.jpg'],['Sala de jantar','./assets/gallery/casa-01.jpg'],['Cozinha','./assets/gallery/casa-02.jpg'],
  ['Quarto','./assets/gallery/casa-03.jpg'],['Jardim e fachada','./assets/gallery/casa-05.jpg'],['Quarto','./assets/gallery/casa-06.jpg'],
  ['Detalhes do quarto','./assets/gallery/casa-07.jpg'],['Banheiro','./assets/gallery/casa-08.jpg'],['Banheiro','./assets/gallery/casa-09.jpg'],
  ['Quarto','./assets/gallery/casa-10.jpg'],['Banheiro da suíte','./assets/gallery/casa-11.jpg'],['Sala de TV','./assets/gallery/casa-12.jpg'],
  ['Quarto','./assets/gallery/casa-13.jpg'],['Jardim com vista para o mar','./assets/gallery/detalhe-03.jpg'],
  ['Mar em frente à casa','./assets/gallery/detalhe-04.jpg'],['Fachada','./assets/gallery/detalhe-05.jpg'],
  ['Praia em frente','./assets/gallery/detalhe-07.jpg'],['Varanda e mar','./assets/gallery/detalhe-11.jpg'],
  ['Praia de Búzios','./assets/gallery/detalhe-13.jpg'],['Sala de estar','./assets/gallery/detalhe-14.jpg'],
  ['Fachada entre coqueiros','./assets/gallery/detalhe-16.jpg'],['Sala de jantar','./assets/gallery/detalhe-17.jpg'],
  ['Mar em Búzios','./assets/gallery/casa-14.jpg'],['Detalhes de Búzios','./assets/gallery/detalhe-01.jpg'],['Entrada da casa','./assets/gallery/detalhe-02.jpg'],
  ['Piscina do condomínio','./assets/gallery/detalhe-06.jpg'],['Pássaros sobre o mar','./assets/gallery/detalhe-08.jpg'],['Pôr do sol em Búzios','./assets/gallery/detalhe-09.jpg'],
  ['Sala com vista para o jardim','./assets/gallery/detalhe-10.jpg'],['Stand up paddle em Búzios','./assets/gallery/detalhe-12.jpg'],['Suíte com varanda','./assets/gallery/detalhe-15.jpg']
];
const videoFiles = ['./assets/videos/buzios-01.mp4','./assets/videos/buzios-02.mp4','./assets/videos/buzios-03.mp4','./assets/videos/buzios-04.mp4'];
const slidePhotos = ['./assets/gallery/detalhe-03.jpg','./assets/gallery/detalhe-11.jpg','./assets/gallery/detalhe-13.jpg','./assets/gallery/casa-05.jpg'];
const contactLinks = {
  camila:'https://wa.me/5521986357913',
  monica:'https://wa.me/5521986362770',
  instagram:'https://www.instagram.com/casaoitodelmare/'
};
const icons = {
  casa:'⌂', mar:'〰', buzios:'☼', reserva:'✳',
  quartos:'▱', hospedes:'♧', limpeza:'✦', praia:'〰', gourmet:'♨', piscina:'◌', wifi:'⌁', tv:'▣', carro:'⌑', pets:'♡', horario:'◷'
};
const features = [
  ['quartos','4 quartos, até 8 hóspedes','São 3 suítes e 1 quarto com banheiro anexo, que também atende como banheiro social.'],
  ['praia','A poucos passos do mar','Praia calma, sem ondas, em frente à casa — boa para crianças, stand up e canoa.'],
  ['limpeza','Funcionária incluída','Limpeza e cozinha já incluídas no valor da diária.'],
  ['gourmet','Churrasqueira e área gourmet','Estrutura para almoços longos, do churrasco aos frutos do mar.'],
  ['piscina','Piscina e sauna','Estrutura do condomínio, de frente para o gramado.'],
  ['wifi','Wi-Fi e Smart TV','Internet em toda a casa e Smart TV para o fim do dia.'],
  ['carro','3 vagas de garagem','Vagas dentro do condomínio.'],
  ['pets','Pets bem-vindos','Nas áreas comuns, sempre de coleira.'],
  ['horario','Check-in e check-out','Horários a combinar com o proprietário.']
];
let supabase = null;
let activePhotoIndex = 0;
let zoomScale = 1;
let modalSlideshowTimer=null;
let priorFocus = null;
if (SUPABASE_URL.startsWith('https://') && SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) {
  supabase = createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
}
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let editableCopy={}; async function loadEditableCopy(){if(!supabase)return;const {data,error}=await supabase.from('site_content').select('key,value').eq('active',true);if(!error){editableCopy=Object.fromEntries((data||[]).map(row=>[row.key,row.value]));applyCopy(document)}}
function applyCopy(root){root.querySelectorAll('[data-copy]').forEach(el=>{if(editableCopy[el.dataset.copy])el.textContent=editableCopy[el.dataset.copy]})}
async function getRows(table) {
  if (!supabase) return [];
  const {data,error} = await supabase.from(table).select('*').eq('active',true);
  return error ? [] : (data || []);
}
function orderOf(row){return Number(row.position??row.sort_order)||0}
function renderCard(card,index) {
  const route=card.target_section||card.url;
  const pageName = ['casa','estrutura','buzios','reserva'].includes(route) ? route : featureCards[index % featureCards.length].url;
  const large = index === 0 ? ' card-featured' : pageName==='reserva' ? ' card-reserve' : '';
  const icon = icons[pageName] || '☼';
  const image = card.image_url || featureCards[index % featureCards.length].image_url;
  return `<button class="card reveal${large}" data-page="${esc(pageName)}" aria-label="${esc(card.title || 'Conheça a casa')}"><img src="${esc(image)}" alt="" loading="lazy"><span class="card-symbol" aria-hidden="true">${icon}</span><span class="card-caption"><small>CASA OITO DEL MARE · BÚZIOS</small><strong>${esc(card.title || 'Conheça a casa')}</strong><span class="card-deck">${esc(card.subtitle||card.description || 'Dias tranquilos à beira-mar.')}</span><span class="card-link">${['casa','estrutura'].includes(pageName)?'Descubra mais':pageName==='reserva'?'Consulte disponibilidade':'Explore Búzios'} </span></span></button>`;
}
async function renderHomeCards() {
  const rows = await getRows('links');
  const pageRows = rows.filter(r=>['casa','estrutura','buzios','reserva'].includes(r.target_section||r.url));
  const ordered = (pageRows.length ? pageRows : featureCards).slice().sort((a,b)=>orderOf(a)-orderOf(b));
  homeCards.innerHTML = ordered.map(renderCard).join('');
  observeReveals();
}
function featureMarkup(item) {
  const [key,title,description] = Array.isArray(item) ? item : [item.category,item.title,item.description];
  return `<article class="feature reveal"><span class="feature-icon" aria-hidden="true">${icons[key]||'☼'}</span><h3>${esc(title)}</h3><p>${esc(description)}</p></article>`;
}

function carouselMarkup() {
  const layers=slidePhotos.length?`<img class="ambient-photo is-visible" src="${esc(slidePhotos[0])}" alt="">${slidePhotos.length>1?`<img class="ambient-photo" src="${esc(slidePhotos[1])}" alt="">`:''}`:'';
  return `<div class="info-carousel" data-slideshow><div class="slideshow-layer" aria-hidden="true">${layers}</div><div class="info-carousel-copy"><blockquote>“A manhã pede uma caminhada na praia em frente — mar calmo, quase sem ondas, perfeito para começar o dia.”</blockquote><small>O RITMO DA CASA OITO</small></div></div>`;
}
function videoMarkup(item,index) {
  const row=typeof item==='string'?{url:item,title:`Búzios ${index+1}`} : item;
  const url=row.video_url||row.url||row.file_url||row.src||'';
  const title=row.title||`Vídeo ${index+1}`;
  const isFile=/\.(mp4|m4v|webm|ogg|mov|m3u8)(?:[?#]|$)/i.test(url);
  const type=/\.webm(?:[?#]|$)/i.test(url)?'video/webm':/\.ogg(?:[?#]|$)/i.test(url)?'video/ogg':/\.m3u8(?:[?#]|$)/i.test(url)?'application/vnd.apple.mpegurl':'video/mp4';
  const media=isFile?`<div class="video-player-shell"><video src="${esc(url)}" controls playsinline webkit-playsinline preload="metadata" aria-label="${esc(title)}"><source src="${esc(url)}" type="${type}">Seu navegador não conseguiu abrir este vídeo.</video><button class="video-play-prompt" type="button" aria-label="Reproduzir ${esc(title)}"><span aria-hidden="true">▶</span><b>Toque para assistir</b></button></div>`:`<iframe src="${esc(url)}" title="${esc(title)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  return `<figure class="video-card ${isFile?'is-pending-orientation':'is-landscape'}"><figcaption><strong>${esc(title)}</strong>${row.description?`<small>${esc(row.description)}</small>`:''}</figcaption>${media}</figure>`;
}
function arrangeVideos(root){root.querySelectorAll('.video-card video').forEach(video=>{const card=video.closest('.video-card');const prompt=card.querySelector('.video-play-prompt');const setLayout=()=>{card.classList.remove('is-pending-orientation');card.classList.toggle('is-portrait',video.videoHeight>video.videoWidth);card.classList.toggle('is-landscape',video.videoWidth>=video.videoHeight)};if(video.readyState>=1)setLayout();else video.addEventListener('loadedmetadata',setLayout,{once:true});prompt?.addEventListener('click',()=>{video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.play().then(()=>card.classList.add('is-playing')).catch(()=>{prompt.querySelector('b').textContent='Toque no vídeo para tentar novamente'})});video.addEventListener('playing',()=>card.classList.add('is-playing'));video.addEventListener('pause',()=>card.classList.remove('is-playing'));video.addEventListener('ended',()=>card.classList.remove('is-playing'));video.addEventListener('error',()=>{card.classList.remove('is-pending-orientation');const note=document.createElement('p');note.className='video-load-error';note.textContent='Este vídeo não carregou. Você pode tentar abri-lo diretamente.';const link=document.createElement('a');link.href=video.currentSrc||video.querySelector('source')?.src||video.src;link.target='_blank';link.rel='noopener';link.textContent='Abrir vídeo';note.append(' ',link);card.append(note)},{once:true});video.load()})}
async function openPage(type) {
  lockPageScroll();
  let html = '';
  if (type === 'casa') {
    const rows = await getRows('gallery');
    const galleryPhotos = rows.length ? rows.slice().sort((a,b)=>orderOf(a)-orderOf(b)).map(row=>[row.title || 'Casa Oito Del Mare',row.image_url,row.description || '']) : photos;
    galleryPhotosForDrawer=galleryPhotos;
    html = `<section class="inside"><div class="gallery-intro"><div><span class="eyebrow">UM LAR ENTRE O VERDE E O MAR</span><h2 data-copy="drawer_casa_title">Por dentro da Casa Oito.</h2></div><p data-copy="drawer_casa_body">Os espaços da casa, os detalhes de família e a paisagem que dá vontade de ficar mais um pouco.</p></div><div class="gallery">${galleryPhotos.map((item,index)=>`<figure><button type="button" data-photo-index="${index}" aria-label="Abrir foto: ${esc(item[0])}"><img src="${esc(item[1])}" alt="${esc(item[0])}" loading="lazy"></button><figcaption><strong>${esc(item[0])}</strong>${item[2]?`<small>${esc(item[2])}</small>`:''}</figcaption></figure>`).join('')}</div></section>`;
  } else if (type === 'estrutura') {
    const rows = await getRows('activities');
    const available = rows.filter(row=>features.some(item=>item[0]===row.category));
    const amenityRows = available.length ? available.slice().sort((a,b)=>orderOf(a)-orderOf(b)) : features;
    html = `<section class="inside"><span class="eyebrow">UM JEITO MAIS LEVE DE FICAR</span><h2 data-copy="drawer_structure_title">Conforto de casa, pé na areia.</h2><p data-copy="drawer_structure_body">A Casa Oito recebe famílias com comodidade e simplicidade. A praia em frente e as áreas do condomínio completam os dias de descanso.</p><div class="feature-layout"><aside class="feature-aside"><p data-copy="drawer_structure_note">Quinze anos de histórias de família, cuidados e manhãs que começam com o som do mar.</p><span class="mini" aria-hidden="true">☼</span></aside><div class="feature-list">${amenityRows.map(featureMarkup).join('')}</div></div>${carouselMarkup()}</section>`;
  } else if (type === 'buzios') {
    const rows = await getRows('videos');
    const storedClips = rows.slice().sort((a,b)=>orderOf(a)-orderOf(b)).filter(row=>row.url||row.video_url||row.file_url||row.src);
    const clips = storedClips.length ? storedClips : videoFiles;
    html = `<section class="inside"><span class="eyebrow">SOL, SAL E HORIZONTE</span><h2 data-copy="drawer_buzios_title">Búzios em movimento.</h2><p data-copy="drawer_buzios_body">Armação dos Búzios, Rio de Janeiro. A Casa Oito fica à beira-mar, num condomínio familiar e tranquilo. A praia em frente é praticamente exclusiva dos condomínios, com poucas entradas.</p><div class="buzios-note"><span aria-hidden="true">☼</span><div>Para preservar a privacidade da casa, o endereço completo é compartilhado quando a reserva é combinada. Veja Búzios no mapa ou assista aos vídeos da casa e do mar.</div></div><div class="contact-panel"><a class="contact-card" href="https://www.google.com/maps/search/?api=1&query=Arma%C3%A7%C3%A3o+dos+B%C3%BAzios+RJ" target="_blank" rel="noopener"><span aria-hidden="true">⌖</span><small>DESTINO</small><strong>Armação dos Búzios</strong></a><div class="contact-card"><span aria-hidden="true">〰</span><small>EM FRENTE À CASA</small><strong>Praia calma e sem ondas</strong></div><a class="contact-card" href="${contactLinks.instagram}" target="_blank" rel="noopener"><span aria-hidden="true">◎</span><small>ACOMPANHE A CASA</small><strong>@casaoitodelmare</strong></a></div><div class="buzios-media">${clips.map((clip,i)=>videoMarkup(clip,i)).join('')}</div></section>`;
  } else {
    html = `<section class="inside"><span class="eyebrow">RESERVAS E INFORMAÇÕES</span><h2 data-copy="drawer_reserve_title">Venha viver essa experiência.</h2><p data-copy="drawer_reserve_body">Consulte datas, tire dúvidas e combine sua estadia diretamente com as proprietárias.</p><div class="contact-panel reserve-panel"><a class="contact-card" href="${contactLinks.camila}" target="_blank" rel="noopener"><span aria-hidden="true">✳</span><small>WHATSAPP · CAMILA</small><strong>(21) 98635-7913</strong></a><a class="contact-card" href="${contactLinks.monica}" target="_blank" rel="noopener"><span aria-hidden="true">✳</span><small>WHATSAPP · MÔNICA</small><strong>(21) 98636-2770</strong></a><a class="contact-card" href="${contactLinks.instagram}" target="_blank" rel="noopener"><span aria-hidden="true">◎</span><small>INSTAGRAM</small><strong>@casaoitodelmare</strong></a></div><p class="privacy-note" data-copy="drawer_privacy">O condomínio é familiar e tranquilo. Para preservar a privacidade, o endereço completo é informado no momento da reserva. Check-in e check-out são combinados com as proprietárias.</p>${carouselMarkup()}</section>`;
  }
  page.innerHTML = html;
  applyCopy(page);
  arrangeVideos(page);
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
  history.pushState({drawer:true},'',`#${type}`);
  drawer.scrollTop = 0;
  observeReveals();
  if (type === 'casa') document.querySelectorAll('[data-photo-index]').forEach(b=>b.onclick=()=>showPhoto(Number(b.dataset.photoIndex),galleryPhotosForDrawer));
  const slideshow = drawer.querySelector('.info-carousel');
  if (slideshow) runSlideshow(slideshow,slidePhotos,true);
}
let galleryPhotosForDrawer = photos;
function showPhoto(index,list=photos) {
  galleryPhotosForDrawer=list;
  activePhotoIndex=(index+list.length)%list.length;
  const [title,src,description='']=list[activePhotoIndex];
  const img=lightbox.querySelector('figure img');
  img.src=src;img.alt=title;zoomScale=1;img.style.transform='scale(1)';img.style.cursor='zoom-in';
  lightbox.querySelector('figcaption').textContent=description?`${title} · ${description}`:title;
  document.querySelector('#lightboxCount').textContent=`${activePhotoIndex+1} / ${list.length}`;
  lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false');document.body.classList.add('lightbox-open');
}
function hidePhoto(){lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');document.body.classList.remove('lightbox-open')}
lightbox.querySelector('.lightbox-close').onclick=hidePhoto;
lightbox.querySelector('.lightbox-prev').onclick=()=>showPhoto(activePhotoIndex-1,galleryPhotosForDrawer);
lightbox.querySelector('.lightbox-next').onclick=()=>showPhoto(activePhotoIndex+1,galleryPhotosForDrawer);
lightbox.querySelector('figure img').onclick=e=>setZoom(zoomScale===1?1.6:1);
lightbox.addEventListener('click',e=>{if(e.target===lightbox)hidePhoto()});
lightbox.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>setZoom(zoomScale+(b.dataset.zoom==='in'?.35:-.35)));
function setZoom(value){zoomScale=Math.max(1,Math.min(2.7,value));const image=lightbox.querySelector('figure img');image.style.transform=`scale(${zoomScale})`;image.style.cursor=zoomScale===1?'zoom-in':'zoom-out'}
function closeDrawer(){if(!drawer.classList.contains('open'))return;drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');unlockPageScroll();if(modalSlideshowTimer){clearInterval(modalSlideshowTimer);modalSlideshowTimer=null}if(location.hash)history.back();if(priorFocus?.focus)priorFocus.focus()}
back.addEventListener('click',closeDrawer);
homeCards.addEventListener('click',event=>{const card=event.target.closest('.card[data-page]');if(card){priorFocus=card;openPage(card.dataset.page)}});
document.querySelector('[data-open-page]')?.addEventListener('click',e=>{e.preventDefault();openPage(e.currentTarget.dataset.openPage)});
window.addEventListener('popstate',()=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');unlockPageScroll();if(modalSlideshowTimer){clearInterval(modalSlideshowTimer);modalSlideshowTimer=null}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(lightbox.classList.contains('open'))hidePhoto();else if(drawer.classList.contains('open'))closeDrawer()}if(lightbox.classList.contains('open')&&e.key==='ArrowRight')showPhoto(activePhotoIndex+1,galleryPhotosForDrawer);if(lightbox.classList.contains('open')&&e.key==='ArrowLeft')showPhoto(activePhotoIndex-1,galleryPhotosForDrawer)});
function runSlideshow(el,images,modal=false){const layers=[...el.querySelectorAll('.ambient-photo')];if(!layers.length||!images.length)return;let current=0,next=1;layers[0].src=images[0];layers[0].classList.add('is-visible');if(images.length===1){layers[1]?.classList.remove('is-visible');return}if(layers.length<2)return;layers[1].src=images[1];if(modal&&modalSlideshowTimer)clearInterval(modalSlideshowTimer);const timer=setInterval(()=>{next=(current+1)%2;current=(current+1)%images.length;layers[next].src=images[current];layers[next].classList.add('is-visible');layers[1-next].classList.remove('is-visible')},6500);if(modal)modalSlideshowTimer=timer;else el.dataset.timer=String(timer)}
async function initializeCarousels(){const media=document.querySelector('.hero-media');media.classList.add('is-carousel-loading');let chosen=slidePhotos.slice(),selectionLoaded=false;if(supabase){try{const result=await supabase.from('gallery').select('image_url').eq('active',true).eq('in_carousel',true).order('position');if(!result.error){chosen=(result.data||[]).map(row=>row.image_url).filter(Boolean);selectionLoaded=true}}catch{}}if(selectionLoaded){slidePhotos.splice(0,slidePhotos.length,...chosen);media.replaceChildren(...chosen.map((src,index)=>{const image=document.createElement('img');image.className=`hero-image${index===0?' is-current':''}`;image.src=src;image.alt='';return image}))}const heroImages=[...media.querySelectorAll('.hero-image')];if(heroImages.length){try{await heroImages[0].decode()}catch{}}media.classList.remove('is-carousel-loading');if(heroImages.length>1){let heroIndex=0;setInterval(()=>{heroImages[heroIndex].classList.remove('is-current');heroIndex=(heroIndex+1)%heroImages.length;heroImages[heroIndex].classList.add('is-current')},7300)}const intro=document.querySelector('.intro');const layers=[...intro.querySelectorAll('.ambient-photo')];if(selectionLoaded&&!chosen.length)layers.forEach(image=>{image.removeAttribute('src');image.classList.remove('is-visible')});else runSlideshow(intro.querySelector('.intro-photo'),slidePhotos)}
function observeReveals(){const revealItems=document.querySelectorAll('.reveal:not(.visible)');if(!('IntersectionObserver' in window)){revealItems.forEach(el=>el.classList.add('visible'));return}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.1});revealItems.forEach(el=>observer.observe(el))}
function initFooterVideo(){
  const video=document.querySelector('#footerVideo');
  const toggle=document.querySelector('#footerVideoToggle');
  if(!video||!toggle)return;
  let userChosePlayback=false;
  video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;
  const update=()=>{
    const playing=!video.paused&&!video.ended;
    toggle.classList.toggle('is-playing',playing);
    toggle.classList.remove('play-required');
    toggle.setAttribute('aria-pressed',String(playing));
    toggle.setAttribute('aria-label',playing?'Pausar vídeo':'Reproduzir vídeo');
  };
  const tryPlay=()=>{if(userChosePlayback)return;video.play().then(update).catch(()=>toggle.classList.add('play-required'))};
  video.addEventListener('play',update);video.addEventListener('pause',update);video.addEventListener('ended',update);
  video.addEventListener('error',()=>toggle.classList.add('play-required'));
  video.addEventListener('canplay',tryPlay,{once:true});
  toggle.addEventListener('click',async()=>{userChosePlayback=true;if(video.paused){video.muted=true;try{await video.play()}catch{toggle.classList.add('play-required')}}else video.pause();update()});
  tryPlay();
}
observeReveals();renderHomeCards();loadEditableCopy();initializeCarousels();initFooterVideo();document.querySelector('#year').textContent=new Date().getFullYear();
const nav=document.querySelector('.site-nav');const syncNav=()=>nav.classList.toggle('scrolled',window.scrollY>36);window.addEventListener('scroll',syncNav,{passive:true});syncNav();
const quickContact=document.querySelector('#quickContact');
const checkin=quickContact.elements.checkin,checkout=quickContact.elements.checkout;
const today=new Date(),todayISO=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
const followingDay=value=>{const [year,month,day]=value.split('-').map(Number),date=new Date(year,month-1,day);date.setDate(date.getDate()+1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`};
checkin.min=todayISO;checkout.min=todayISO;
quickContact.querySelectorAll('.date-input-wrap').forEach(wrap=>wrap.addEventListener('click',event=>{if(event.target.closest('input'))return;const input=wrap.querySelector('input');try{input.showPicker()}catch{input.focus()}}));
checkin.addEventListener('change',()=>{checkin.setCustomValidity('');checkout.min=checkin.value?followingDay(checkin.value):todayISO;if(checkout.value&&checkin.value&&checkout.value<=checkin.value)checkout.setCustomValidity('A saída precisa ser pelo menos um dia depois da entrada.');else checkout.setCustomValidity('')});
checkout.addEventListener('change',()=>{checkin.setCustomValidity('');if(checkin.value&&checkout.value&&checkout.value<=checkin.value)checkout.setCustomValidity('A saída precisa ser depois da entrada.');else checkout.setCustomValidity('')});
quickContact.addEventListener('submit',event=>{event.preventDefault();const form=new FormData(quickContact);const recipient=form.get('contact')==='monica'?'5521986362770':'5521986357913';const start=checkin.value,end=checkout.value;if(Boolean(start)!==Boolean(end)){(start?checkout:checkin).setCustomValidity('Preencha as duas datas ou deixe ambas em branco.');(start?checkout:checkin).reportValidity();return}if(start&&end&&end<=start){checkout.setCustomValidity('A saída precisa ser depois da entrada.');checkout.reportValidity();return}const dateLabel=value=>new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00`));const stay=start?`Tenho interesse em me hospedar de ${dateLabel(start)} a ${dateLabel(end)}.`:'';const message=[`Olá! Meu nome é ${form.get('name')}.`,stay,form.get('message')].filter(Boolean).join('\n');window.open(`https://wa.me/${recipient}?text=${encodeURIComponent(message)}`,'_blank','noopener')});
