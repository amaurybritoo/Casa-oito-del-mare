import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../js/config.js';

const $=selector=>document.querySelector(selector);
let supabase=null;
let current=sessionStorage.getItem('adminViewAfterReload')||new URLSearchParams(location.search).get('view')||'overview';
sessionStorage.removeItem('adminViewAfterReload');
const labels={gallery:'Galeria da casa',activities:'Comodidades da casa',videos:'Vídeos da casa',links:'Cards da página inicial',site_content:'Textos do site',link_page:'Página de links',tourist:'Pontos turísticos',reservations:'Reservas'};
const cardPages=[['casa','Por dentro da casa'],['estrutura','A vida à beira-mar'],['buzios','Búzios'],['reserva','Reservas']];
const defaultCarouselImages=new Set(['./assets/gallery/detalhe-03.jpg','./assets/gallery/detalhe-11.jpg','./assets/gallery/detalhe-13.jpg','./assets/gallery/casa-05.jpg']);
const featureIcons=[['quartos','Quartos'],['praia','Mar'],['limpeza','Serviço'],['gourmet','Área gourmet'],['piscina','Piscina e sauna'],['wifi','Wi-Fi'],['carro','Garagem'],['pets','Pets'],['horario','Horários']];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const orderOf=row=>Number(row.position??row.sort_order)||0;
function orderedRows(data){return [...data].sort((a,b)=>orderOf(a)-orderOf(b)||String(a.id).localeCompare(String(b.id)))}
async function assignPositions(table,list){for(let i=0;i<list.length;i++){if(Number(list[i].position)===i+1)continue;const {error}=await supabase.from(table).update({position:i+1}).eq('id',list[i].id);if(error)throw error}}
async function normalizePositions(table,data){const list=orderedRows(data);if(list.some((row,index)=>Number(row.position)!==index+1))await assignPositions(table,list);return list.map((row,index)=>({...row,position:index+1,displayPosition:index+1}))}
async function moveRecordToPosition(table,id,position){const list=orderedRows(await rows(table));const index=list.findIndex(row=>String(row.id)===String(id));if(index<0)return false;const target=Math.max(0,Math.min(list.length-1,Math.floor(Number(position)||1)-1));if(index===target)return false;const [item]=list.splice(index,1);list.splice(target,0,item);await assignPositions(table,list);return true}
async function insertAtPosition(table,payload,position,data){const list=orderedRows(data);const target=Math.max(1,Math.min(list.length+1,Math.floor(Number(position)||list.length+1)));const result=await supabase.from(table).insert({...payload,position:target}).select('*').single();if(result.error)throw result.error;list.splice(target-1,0,result.data);await assignPositions(table,list);return list.map((row,index)=>({...row,position:index+1}))}
function askDelete(title,detail){return new Promise(resolve=>{const dialog=document.createElement('dialog');dialog.className='admin-dialog';dialog.innerHTML=`<div class="admin-dialog-mark">8</div><p class="eyebrow">CASA OITO DEL MARE</p><h2>${esc(title)}</h2><p>${esc(detail)}</p><div class="admin-dialog-actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="button" class="danger-confirm" data-confirm>Excluir</button></div>`;let settled=false;const finish=value=>{if(settled)return;settled=true;dialog.close();dialog.remove();resolve(value)};dialog.querySelector('[data-cancel]').onclick=()=>finish(false);dialog.querySelector('[data-confirm]').onclick=()=>finish(true);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});document.body.append(dialog);dialog.showModal()})}
function message(text,error=false){$('#loginMsg').textContent=text||'';$('#loginMsg').style.color=error?'#ffb5aa':''}
function configured(){return SUPABASE_URL.startsWith('https://')&&SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')}
function showLogin(){const login=$('#login'),app=$('#app');app.hidden=true;app.style.display='none';login.hidden=false;login.style.removeProperty('display');login.setAttribute('aria-hidden','false');app.setAttribute('aria-hidden','true')}
function showApp(){const login=$('#login'),app=$('#app');login.hidden=true;login.style.display='none';login.setAttribute('aria-hidden','true');app.hidden=false;app.style.removeProperty('display');app.setAttribute('aria-hidden','false');render(current)}
async function boot(){
  try{
    if(!configured()){
      showLogin();
      window.__adminReady=true;
      return message('Configure o Supabase em js/config.js.',true);
    }
    supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
    window.__adminReady=true;
    showLogin();
    try{
      const {data,error}=await supabase.auth.getSession();
      if(!error && data?.session) showApp();
      else if(error) message(`Sessão não pôde ser recuperada: ${error.message||error}`,true);
    }catch(error){
      message(`Não foi possível recuperar a sessão. Você ainda pode tentar entrar: ${error?.message||error}`,true);
    }
    supabase.auth.onAuthStateChange((_event,session)=>session?showApp():showLogin());
  }catch(error){
    window.__adminReady=true;
    showLogin();
    message(`Não foi possível iniciar o painel: ${error?.message||error}`,true);
  }
}
$('#loginForm').addEventListener('submit',async event=>{event.preventDefault();event.stopPropagation();const form=event.currentTarget;const button=form.querySelector('button');const email=$('#email').value.trim();const password=$('#password').value;if(!supabase){message('O serviço de autenticação ainda está inicializando. Aguarde um instante e tente novamente.',true);return}if(!email||!password){message('Informe seu e-mail e sua senha.',true);return}button.disabled=true;button.textContent='Entrando…';message('');try{const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error){console.error('[Admin] Falha no login:',error);message(error.message||'E-mail ou senha incorretos.',true);return}if(data?.session){showApp();return}message('A autenticação não retornou uma sessão. Tente novamente.',true)}catch(error){console.error('[Admin] Erro inesperado no login:',error);message(error?.message||'Não foi possível conectar ao painel.',true)}finally{button.disabled=false;button.textContent='Entrar no painel'}});
$('#logout').onclick=()=>supabase?.auth.signOut();
const adminAside=document.querySelector('aside');
const adminMenuButton=$('#menu');
const adminMenuBackdrop=document.createElement('div');
adminMenuBackdrop.id='adminMenuBackdrop';
adminMenuBackdrop.setAttribute('aria-hidden','true');
document.body.append(adminMenuBackdrop);
const adminSettingsToggle=$('#adminSettingsToggle');
const adminSettingsNav=$('#adminSettingsNav');
adminSettingsToggle?.addEventListener('click',()=>{const expanded=adminSettingsToggle.getAttribute('aria-expanded')==='true';adminSettingsToggle.setAttribute('aria-expanded',String(!expanded));adminSettingsToggle.setAttribute('aria-label',expanded?'Abrir configurações':'Fechar configurações');adminSettingsNav.hidden=expanded;adminAside?.classList.toggle('settings-open',!expanded);});
let adminPageScrollY=0;
const closeAdminMenu=()=>{if(!adminAside?.classList.contains('open'))return;adminAside.classList.remove('open');adminMenuBackdrop.classList.remove('show');document.documentElement.classList.remove('admin-menu-open');document.body.classList.remove('admin-menu-open');document.body.style.position='';document.body.style.top='';document.body.style.left='';document.body.style.right='';document.body.style.width='';window.scrollTo({top:adminPageScrollY,left:0,behavior:'auto'});};
adminMenuButton.onclick=()=>{const open=!adminAside.classList.contains('open');if(open){adminPageScrollY=window.scrollY||document.documentElement.scrollTop||0;document.body.style.position='fixed';document.body.style.top=`-${adminPageScrollY}px`;document.body.style.left='0';document.body.style.right='0';document.body.style.width='100%';document.documentElement.classList.add('admin-menu-open');document.body.classList.add('admin-menu-open');adminAside.classList.add('open');adminMenuBackdrop.classList.add('show')}else closeAdminMenu();};
adminMenuBackdrop.onclick=closeAdminMenu;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAdminMenu();});
document.querySelectorAll('nav button[data-view]').forEach(button=>button.onclick=()=>{current=button.dataset.view;document.querySelectorAll('nav button[data-view]').forEach(item=>item.classList.toggle('active',item===button));const inSettings=!!adminSettingsNav?.contains(button);adminSettingsToggle?.classList.toggle('has-active',inSettings);if(adminSettingsNav&&!adminSettingsNav.hidden){adminSettingsNav.hidden=true;adminSettingsToggle.setAttribute('aria-expanded','false');adminSettingsToggle.setAttribute('aria-label','Abrir configurações');adminAside?.classList.remove('settings-open')}closeAdminMenu();render(current)});
async function rows(table){const result=await supabase.from(table).select('*');if(result.error)throw result.error;return result.data||[]}
function reloadAfterMigration(){const button=$('#reloadView');if(button){button.disabled=true;button.textContent='Recarregando…';}sessionStorage.setItem('adminViewAfterReload',current);window.location.href='/admin/?refresh='+Date.now()}
function migrationHelp(){return `<section class="migration-help"><h2>Carregar o conteúdo inicial</h2><p>As fotos e os vídeos estão incluídos nos arquivos do site. Para listá-los neste painel, é preciso cadastrar seus nomes, endereços e textos no Supabase uma vez.</p><ol><li>Abra o projeto Supabase usado pelo site e entre em <b>SQL Editor</b>.</li><li>Abra o arquivo <a href="../supabase/migrations/20261001_links_page_and_tourism.sql" target="_blank" rel="noopener">20261001_links_page_and_tourism.sql</a>, copie o conteúdo inteiro e cole numa consulta nova.</li><li>Pressione <b>Run</b> e aguarde a mensagem de sucesso. A migração usa os nomes das colunas do seu esquema: cards em <code>subtitle</code>/<code>target_section</code>/<code>position</code>, vídeos em <code>video_url</code>/<code>position</code> e ordem de fotos e comodidades em <code>position</code>.</li><li>Volte ao painel e escolha <b>Atualizei o banco · recarregar</b>. Esta migração pode ser executada novamente sem duplicar os conteúdos iniciais.</li></ol><p class="migration-small">Use o arquivo atualizado completo. Ele cria/atualiza as tabelas da página de links, pontos turísticos, calendário e também <code>public.site_content</code>, além de habilitar edição pelo painel para usuários autenticados.</p><button class="primary" id="reloadView">Atualizei o banco · recarregar</button></section>`}
async function render(view){const root=$('#view');root.innerHTML='<div class="view"><div class="empty">Carregando…</div></div>';try{if(view==='overview')await overview();else if(view==='gallery')await gallery();else if(view==='link_page')await linkPageView();else if(view==='tourist')await touristView();else if(view==='reservations')await reservationsView();else await contentTable(view)}catch(error){const missing=/site_content|schema cache|PGRST205|42P01/i.test(`${error.code||''} ${error.message||''}`);root.innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">PAINEL DA CASA</p><h1>${missing?'Preparar o painel.':'Não foi possível abrir esta seção.'}</h1><p>${missing?'O Supabase ainda não encontrou a tabela de textos ou as tabelas do conteúdo inicial.':esc(error.message||'Confira a conexão com o Supabase e tente novamente.')}</p></div></div>${migrationHelp()}</div>`;$('#reloadView').onclick=reloadAfterMigration}}
async function overview(){
  const tables=['gallery','activities','videos','links','site_content'];
  const results=await Promise.all(tables.map(async table=>{const result=await supabase.from(table).select('*',{count:'exact',head:true});return {table,count:result.error?null:(result.count||0),error:result.error}}));
  const counts=Object.fromEntries(results.map(item=>[item.table,item.count]));
  const needsSetup=results.some(item=>item.error);
  const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
  const analyticsResults=await Promise.all(['visit','whatsapp_click'].map(async type=>{
    const result=await supabase.from('site_events').select('*',{count:'exact',head:true}).eq('event_type',type).gte('created_at',since);
    return {type,count:result.count||0,error:result.error};
  }));
  const analyticsAvailable=analyticsResults.every(result=>!result.error);
  const analytics=Object.fromEntries(analyticsResults.map(result=>[result.type,result.count]));
  let records=[];
  try{const record=await linkPageRecord();records=reservationRecords(record.availability||linkPageDefaults().availability).filter(item=>item.status&&item.status!=='available')}catch(error){console.info('[Admin] Agenda indisponível na visão geral:',error?.message||error)}
  const now=new Date();const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const upcoming=records.filter(item=>item.check_out>=today).sort((a,b)=>a.check_in.localeCompare(b.check_in));
  const appointments=records.filter(item=>item.status==='pre'||item.status==='reserved').length;
  const nextEntry=upcoming.find(item=>item.check_in>=today);
  const nextExit=upcoming.filter(item=>item.check_out>=today).sort((a,b)=>a.check_out.localeCompare(b.check_out))[0];
  const dateLabel=key=>validDateKey(key)?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(`${key}T12:00:00`)):'';
  const statusLabel={reserved:'Reservado',pre:'Pré-reserva',blocked:'Bloqueado'};
  const statusPill=item=>`<span class="overview-status status-${esc(item.status)}">${esc(statusLabel[item.status]||'Reserva')}</span>`;
  const nextLine=(title,item,field)=>`<div class="overview-date-row"><span>${title}</span>${item?`<strong>${dateLabel(item[field])}</strong><small>${esc(item.name||'Hóspede não informado')} · ${esc(statusLabel[item.status]||'Reserva')}</small>`:'<strong class="overview-none">Nenhuma prevista</strong>'}</div>`;
  const reservationList=upcoming.slice(0,5).map(item=>`<div class="overview-reservation"><div><strong>${dateLabel(item.check_in)}${item.check_out!==item.check_in?` – ${dateLabel(item.check_out)}`:''}</strong><small>${esc(item.name||'Hóspede não informado')}</small></div>${statusPill(item)}</div>`).join('')||'<p class="overview-empty">Nenhuma reserva próxima cadastrada.</p>';
  $('#view').innerHTML=`<div class="view overview-view"><div class="view-head"><div><p class="eyebrow">CASA OITO DEL MARE</p><h1>Visão geral.</h1><p>Agenda e indicadores rápidos da casa.</p></div></div>${needsSetup?migrationHelp():''}<div class="stats"><div class="stat"><strong>${counts.gallery??'—'}</strong><span>Fotos</span></div><div class="stat"><strong>${counts.videos??'—'}</strong><span>Vídeos</span></div><div class="stat"><strong>${counts.links??'—'}</strong><span>Cards da página inicial</span></div><div class="stat stat-appointments"><strong>${appointments}</strong><span>Agendamentos ativos</span></div></div><div class="overview-grid"><section class="overview-panel"><div class="overview-panel-heading"><div><p class="eyebrow">AGENDA</p><h2>Próximas datas</h2></div><button type="button" class="overview-link" data-overview-reservations>Ver calendário ↗</button></div><div class="overview-date-pair">${nextLine('Próxima entrada',nextEntry,'check_in')}${nextLine('Próxima saída',nextExit,'check_out')}</div></section><section class="overview-panel overview-analytics-panel"><div class="overview-panel-heading"><div><p class="eyebrow">ÚLTIMOS 30 DIAS</p><h2>Acessos</h2></div>${analyticsAvailable?'<span class="overview-data-live">Coletando</span>':'<span class="overview-data-pending">Ativar coleta</span>'}</div><div class="overview-access-metrics"><div><strong>${analyticsAvailable?analytics.visit:'—'}</strong><span>Visitas</span></div><div><strong>${analyticsAvailable?analytics.whatsapp_click:'—'}</strong><span>Cliques no WhatsApp</span></div></div>${analyticsAvailable?'':'<p class="analytics-setup-note">Aplique a <a href="../supabase/migrations/20261002_site_analytics.sql" target="_blank" rel="noopener">atualização de métricas do Supabase</a> para começar a contar. Os registros começam após a ativação.</p>'}</section><section class="overview-panel overview-reservations-panel"><div class="overview-panel-heading"><div><p class="eyebrow">AGENDA</p><h2>Reservas próximas</h2></div><button type="button" class="overview-link" data-overview-reservations>Ver todas ↗</button></div><div class="overview-reservation-list">${reservationList}</div></section></div></div>`;
  document.querySelectorAll('[data-overview-reservations]').forEach(button=>button.onclick=()=>{current='reservations';document.querySelectorAll('nav button[data-view]').forEach(item=>item.classList.toggle('active',item.dataset.view==='reservations'));render(current)});
  $('#reloadView')?.addEventListener('click',reloadAfterMigration)
}
async function gallery(){
  let data=orderedRows(await rows('gallery')).map((row,index)=>({...row,displayPosition:index+1}));
  const carouselSetupMissing=!data.length||!Object.prototype.hasOwnProperty.call(data[0],'in_carousel');
  const carouselHelp=carouselSetupMissing?`<div class="panel-tip carousel-setup-help"><b>Fotos do carrossel e galeria completa</b><p>As quatro fotos atuais já aparecem marcadas. Para salvar sua seleção e incluir as 9 fotos que faltam do arquivo original, execute uma vez esta atualização no SQL Editor do Supabase.</p><a href="../supabase/migrations/20260930_gallery_carousel_selection.sql" target="_blank" rel="noopener">Abrir SQL de atualização</a></div>`:'';
  $('#view').innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">ACERVO</p><h1>Galeria.</h1><p>Adicione fotos com título e enquadramento; edite qualquer foto na própria lista.</p></div></div>${carouselHelp}<section class="upload-box photo-upload"><div class="upload-intro"><strong>Adicionar fotos</strong><span>Escolha as imagens, ajuste nome, posição e corte antes de enviar.</span></div><input id="files" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple><button class="primary" id="choosePhotos">Escolher fotos do dispositivo</button><div id="photoQueue" class="photo-queue"></div><div class="upload-actions"><button class="primary" id="send" disabled>Enviar fotos selecionadas</button><small id="status" class="upload-status" aria-live="polite"></small></div></section><div class="media-grid">${data.map(card).join('')||'<div class="empty">Nenhuma foto cadastrada ainda.</div>'}</div></div>`;
  const input=$('#files'),queue=$('#photoQueue'),send=$('#send'),status=$('#status');let files=[];
  $('#choosePhotos').onclick=()=>input.click();
  input.onchange=()=>{for(const file of input.files){files.push({file,title:file.name.replace(/\.[^.]+$/,''),description:'',position:data.length+files.length+1,ratio:'original',zoom:1,x:50,y:50,preview:URL.createObjectURL(file)})}input.value='';renderPhotoQueue(queue,files);send.disabled=!files.length;status.textContent=files.length?`${files.length} foto(s) selecionada(s).`:''};
  queue.oninput=event=>{const item=files[Number(event.target.closest('[data-photo-index]')?.dataset.photoIndex)];if(!item)return;const field=event.target.dataset.field;if(field==='title'||field==='description'||field==='position')item[field]=event.target.value;if(field==='zoom'||field==='x'||field==='y'){item[field]=Number(event.target.value);const card=event.target.closest('[data-photo-index]');syncCropPreview(card,item,field)}};
  queue.onpointerdown=event=>{const frame=event.target.closest('.crop-window');if(!frame||(event.pointerType==='mouse'&&event.button!==0))return;const card=frame.closest('[data-photo-index]'),item=files[Number(card.dataset.photoIndex)],image=item.previewImage;if(!image?.naturalWidth)return;const geometry=cropGeometry(image.naturalWidth,image.naturalHeight,item);frame.dataset.pointerId=event.pointerId;frame.dataset.dragX=event.clientX;frame.dataset.dragY=event.clientY;frame.dataset.originX=item.x;frame.dataset.originY=item.y;frame.dataset.maxX=Math.max(0,image.naturalWidth-geometry.cropW);frame.dataset.maxY=Math.max(0,image.naturalHeight-geometry.cropH);frame.dataset.cropW=geometry.cropW;frame.dataset.cropH=geometry.cropH;try{frame.setPointerCapture(event.pointerId)}catch{}frame.classList.add('is-dragging');event.preventDefault()};
  queue.onpointermove=event=>{const frame=queue.querySelector(`.crop-window[data-pointer-id="${event.pointerId}"]`);if(!frame)return;const card=frame.closest('[data-photo-index]'),item=files[Number(card.dataset.photoIndex)],rect=frame.getBoundingClientRect(),maxX=Number(frame.dataset.maxX),maxY=Number(frame.dataset.maxY),cropW=Number(frame.dataset.cropW),cropH=Number(frame.dataset.cropH),deltaX=maxX?(event.clientX-Number(frame.dataset.dragX))/Math.max(1,rect.width)*cropW/maxX*100:0,deltaY=maxY?(event.clientY-Number(frame.dataset.dragY))/Math.max(1,rect.height)*cropH/maxY*100:0;item.x=Math.max(0,Math.min(100,Number(frame.dataset.originX)-deltaX));item.y=Math.max(0,Math.min(100,Number(frame.dataset.originY)-deltaY));card.querySelector('[data-field="x"]').value=item.x;card.querySelector('[data-field="y"]').value=item.y;syncCropPreview(card,item,'xy');event.preventDefault()};
  queue.onpointerup=queue.onpointercancel=event=>{const frame=queue.querySelector(`.crop-window[data-pointer-id="${event.pointerId}"]`);if(!frame)return;frame.classList.remove('is-dragging');delete frame.dataset.pointerId;try{if(frame.hasPointerCapture(event.pointerId))frame.releasePointerCapture(event.pointerId)}catch{}};
  queue.onchange=event=>{const card=event.target.closest('[data-photo-index]');if(!card)return;const item=files[Number(card.dataset.photoIndex)];const field=event.target.dataset.field;if(field==='ratio'){item.ratio=event.target.value;fitCropFrame(card.querySelector('.crop-window'),item)}if(field==='title'||field==='description'||field==='position')item[field]=event.target.value};
  queue.onclick=event=>{const button=event.target.closest('[data-remove-photo]');if(!button)return;const index=Number(button.dataset.removePhoto);URL.revokeObjectURL(files[index].preview);files.splice(index,1);files.forEach((item,i)=>item.position=data.length+i+1);renderPhotoQueue(queue,files);send.disabled=!files.length;status.textContent=files.length?`${files.length} foto(s) selecionada(s).`:''};
  send.onclick=async()=>{send.disabled=true;let saved=0;try{let currentRows=await normalizePositions('gallery',data);const queueData=[...queue.querySelectorAll('[data-photo-index]')].map((card,index)=>{files[index].title=card.querySelector('[data-field="title"]').value.trim();files[index].description=card.querySelector('[data-field="description"]').value.trim();files[index].position=Number(card.querySelector('[data-field="position"]').value)||1;files[index].ratio=card.querySelector('[data-field="ratio"]').value;files[index].zoom=Number(card.querySelector('[data-field="zoom"]').value)||1;files[index].x=Number(card.querySelector('[data-field="x"]').value);files[index].y=Number(card.querySelector('[data-field="y"]').value);return files[index]}).sort((a,b)=>a.position-b.position);if(queueData.some(item=>!item.title))throw new Error('Dê um título para cada foto antes de enviar.');
      for(const item of queueData){status.textContent=`Preparando “${item.title}”…`;const cropped=await cropImageFile(item.file,item.ratio,item.zoom,item.x,item.y);const safe=(item.title||item.file.name).toLowerCase().replace(/[^a-z0-9._-]+/g,'-')||'foto';const path=`gallery/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}.webp`;const upload=await supabase.storage.from('casa-oito-del-mare').upload(path,cropped,{cacheControl:'3600',upsert:false,contentType:cropped.type||'image/webp'});if(upload.error)throw upload.error;const url=supabase.storage.from('casa-oito-del-mare').getPublicUrl(path).data.publicUrl;try{currentRows=await insertAtPosition('gallery',{title:item.title||'Foto da casa',description:item.description,image_url:url,active:true},item.position,currentRows);saved++}catch(error){await supabase.storage.from('casa-oito-del-mare').remove([path]);throw error}}
      files.forEach(item=>URL.revokeObjectURL(item.preview));await gallery();$('#status').textContent=`${saved} foto(s) adicionada(s) com sucesso.`
    }catch(error){status.textContent=`Não foi possível enviar as fotos: ${error.message||error}`;send.disabled=false}};
  document.querySelectorAll('[data-view-photo]').forEach(button=>button.onclick=()=>lightbox(button.dataset.viewPhoto));
  document.querySelectorAll('[data-edit-photo]').forEach(button=>button.onclick=()=>editPhoto(button.dataset.editPhoto,data));
  document.querySelectorAll('[data-carousel-photo]').forEach(input=>input.onchange=async()=>{const feedback=input.closest('.carousel-select').querySelector('.carousel-feedback');input.disabled=true;feedback.textContent='Salvando seleção…';const {error}=await supabase.from('gallery').update({in_carousel:input.checked}).eq('id',input.dataset.carouselPhoto);if(error){input.checked=!input.checked;feedback.innerHTML=/in_carousel|schema cache|PGRST204|42703/i.test(`${error.code||''} ${error.message||''}`)?'Para ativar esta opção, aplique o <a href="../supabase/migrations/20260930_gallery_carousel_selection.sql" target="_blank" rel="noopener">SQL do carrossel</a> no Supabase.':esc(error.message||'Não foi possível salvar.');}else{const saved=data.find(row=>String(row.id)===String(input.dataset.carouselPhoto));if(saved)saved.in_carousel=input.checked;feedback.textContent=input.checked?'Esta foto aparecerá no carrossel.':'Foto fora do carrossel.'}input.disabled=false});
  document.querySelectorAll('[data-delete-photo]').forEach(button=>button.onclick=()=>remove('gallery',button.dataset.deletePhoto))
}
function ratioValue(value,item){if(value==='original'&&item?.originalRatio)return item.originalRatio;return ({'16:9':'16 / 9','4:5':'4 / 5','4:3':'4 / 3','1:1':'1 / 1','3:4':'3 / 4','9:16':'9 / 16'})[value]||'4 / 3'}
function cropGeometry(width,height,item){const aspect=item.ratio==='original'?width/height:Number(item.ratio.split(':')[0])/Number(item.ratio.split(':')[1]);let cropW=width,cropH=height;if(width/height>aspect)cropW=height*aspect;else cropH=width/aspect;const zoom=Math.max(1,Number(item.zoom)||1);cropW/=zoom;cropH/=zoom;const x=Math.max(0,Math.min(100,Number(item.x)||0))/100,y=Math.max(0,Math.min(100,Number(item.y)||0))/100;return {aspect,cropW,cropH,sx:(width-cropW)*x,sy:(height-cropH)*y}}
function drawCropPreview(frame,item){const image=item.previewImage,canvas=frame?.querySelector('.crop-preview-canvas');if(!image?.naturalWidth||!canvas)return;const geometry=cropGeometry(image.naturalWidth,image.naturalHeight,item),width=geometry.aspect>=1?1000:Math.max(1,Math.round(1000*geometry.aspect)),height=geometry.aspect>=1?Math.max(1,Math.round(1000/geometry.aspect)):1000;if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;const context=canvas.getContext('2d');context.clearRect(0,0,width,height);context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,geometry.sx,geometry.sy,geometry.cropW,geometry.cropH,0,0,width,height)}
function fitCropFrame(frame,item){const aspect=item.ratio==='original'?(item.originalAspect||1):Number(item.ratio.split(':')[0])/Number(item.ratio.split(':')[1]);frame.style.aspectRatio=ratioValue(item.ratio,item);frame.style.width=`min(100%, ${Math.max(1,Math.round(420*aspect))}px)`;drawCropPreview(frame,item)}
function syncCropPreview(card,item,field){drawCropPreview(card.querySelector('.crop-window'),item);if(field==='zoom'||field==='xy')card.querySelector('[data-output="zoom"]').textContent=`${item.zoom.toFixed(1)}×`;if(field==='x'||field==='xy')card.querySelector('[data-output="x"]').textContent=`${Math.round(item.x)}%`;if(field==='y'||field==='xy')card.querySelector('[data-output="y"]').textContent=`${Math.round(item.y)}%`}
function renderPhotoQueue(root,files){
  root.innerHTML=files.map((item,index)=>`<article class="photo-queue-card" data-photo-index="${index}"><div class="photo-crop-column"><div class="crop-preview-heading"><span>ENQUADRAMENTO</span><b>Prévia ao vivo</b></div><div class="crop-window" style="aspect-ratio:${ratioValue(item.ratio,item)}"><canvas class="crop-preview-canvas" aria-label="Prévia do recorte"></canvas><span class="crop-hint">Arraste para reposicionar</span></div><p class="crop-help">Arraste a foto, ajuste o zoom e escolha o formato do post.</p></div><div class="photo-queue-fields"><div class="photo-queue-title"><label class="photo-title-field">Título da foto<input type="text" data-field="title" value="${esc(item.title)}" placeholder="Digite o nome que aparecerá no site" autocomplete="off" required></label><button type="button" class="text-danger" data-remove-photo="${index}">Remover da seleção</button></div><label class="photo-description-field">Descrição curta <span class="optional-note">Opcional</span><textarea data-field="description" rows="2" placeholder="Uma frase sobre esta imagem">${esc(item.description)}</textarea></label><div class="photo-queue-row"><label>Posição na galeria<input data-field="position" type="number" min="1" step="1" value="${item.position}"></label><label>Formato do corte<select data-field="ratio"><option value="original" ${item.ratio==='original'?'selected':''}>Original</option><option value="4:5" ${item.ratio==='4:5'?'selected':''}>Feed retrato · 4:5</option><option value="1:1" ${item.ratio==='1:1'?'selected':''}>Quadrado · 1:1</option><option value="4:3" ${item.ratio==='4:3'?'selected':''}>Paisagem · 4:3</option><option value="16:9" ${item.ratio==='16:9'?'selected':''}>Tela · 16:9</option><option value="9:16" ${item.ratio==='9:16'?'selected':''}>Story / Reels · 9:16</option></select></label></div><div class="crop-controls"><label class="range-label">Zoom <output data-output="zoom">${item.zoom.toFixed(1)}×</output><input data-field="zoom" type="range" min="1" max="3" step="0.1" value="${item.zoom}"></label><label class="range-label">Horizontal <output data-output="x">${item.x}%</output><input data-field="x" type="range" min="0" max="100" step="1" value="${item.x}"></label><label class="range-label">Vertical <output data-output="y">${item.y}%</output><input data-field="y" type="range" min="0" max="100" step="1" value="${item.y}"></label></div></div></article>`).join('');
  root.querySelectorAll('.crop-window').forEach((frame,index)=>{const image=new Image();files[index].previewImage=image;image.onload=()=>{files[index].originalRatio=`${image.naturalWidth} / ${image.naturalHeight}`;files[index].originalAspect=image.naturalWidth/image.naturalHeight;fitCropFrame(frame,files[index])};image.onerror=()=>{frame.classList.add('crop-preview-error')};image.src=files[index].preview})
}
async function cropImageFile(file,ratio,zoom,x,y){let image;if(typeof createImageBitmap==='function'){try{image=await createImageBitmap(file)}catch{}}if(!image){image=await new Promise((resolve,reject)=>{const element=new Image(),url=URL.createObjectURL(file);element.onload=()=>{URL.revokeObjectURL(url);resolve(element)};element.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir esta imagem.'))};element.src=url})}const geometry=cropGeometry(image.width||image.naturalWidth,image.height||image.naturalHeight,{ratio,zoom,x,y});const width=Math.max(1,Math.round(geometry.cropW)),height=Math.max(1,Math.round(geometry.cropH)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');if(!context){image.close?.();throw new Error('Não foi possível preparar o recorte da imagem.')}context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,geometry.sx,geometry.sy,geometry.cropW,geometry.cropH,0,0,width,height);image.close?.();const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.96));if(!blob)throw new Error('O navegador não conseguiu preparar o corte da imagem.');return new File([blob],`${file.name.replace(/\.[^.]+$/,'')}-cortada.webp`,{type:blob.type||'image/webp'})}
function previewPath(path){return String(path||'').startsWith('./assets/')?'../'+String(path).slice(2):path}
function card(row){const chosen=row.in_carousel===true||(row.in_carousel==null&&defaultCarouselImages.has(row.image_url));return `<article class="media"><button class="media-image" data-view-photo="${esc(previewPath(row.image_url))}"><img src="${esc(previewPath(row.image_url))}" alt="${esc(row.title||'Foto')}"><span>Visualizar</span></button><div class="media-body"><h3>${esc(row.title||'Sem título')}</h3><div class="muted">Posição ${esc(row.displayPosition??row.position??row.sort_order??'—')} · ${row.active===false?'Oculta':'Publicada'}</div><label class="carousel-select"><input type="checkbox" data-carousel-photo="${esc(row.id)}" ${chosen?'checked':''}><span><b>Carrossel principal</b><small class="carousel-feedback">${chosen?'Esta foto aparecerá no carrossel.':'Incluir esta foto no carrossel da página inicial.'}</small></span></label><div class="actions"><button data-edit-photo="${esc(row.id)}">Editar foto</button><button class="danger" data-delete-photo="${esc(row.id)}" data-url="${esc(row.image_url)}">Excluir</button></div></div></article>`}
function lightbox(url){const modal=document.createElement('div');modal.className='lightbox';modal.innerHTML=`<button aria-label="Fechar">×</button><img src="${esc(url)}" alt="Foto ampliada">`;modal.onclick=()=>modal.remove();document.body.appendChild(modal)}
async function editPhoto(id,data){const row=data.find(item=>String(item.id)===String(id));if(!row)return;const dialog=document.createElement('dialog');dialog.className='admin-dialog edit-dialog';dialog.innerHTML=`<form class="admin-edit-form"><div class="admin-dialog-mark">8</div><p class="eyebrow">GALERIA DA CASA</p><h2>Editar foto</h2><p class="dialog-copy">Atualize o título que aparece na galeria, a descrição e a publicação.</p><label>Título da foto<input name="title" value="${esc(row.title||'')}" required></label><label>Descrição<textarea name="description" rows="3">${esc(row.description||'')}</textarea></label><div class="edit-inline"><label>Posição<input name="position" type="number" min="1" step="1" value="${esc(row.displayPosition??row.position??1)}"></label><label>Visível no site<select name="active"><option value="true" ${row.active!==false?'selected':''}>Sim</option><option value="false" ${row.active===false?'selected':''}>Não</option></select></label></div><small class="dialog-status" aria-live="polite"></small><div class="admin-dialog-actions"><button type="button" class="secondary" data-close>Cancelar</button><button type="submit" class="primary">Salvar alterações</button></div></form>`;document.body.append(dialog);const form=dialog.querySelector('form'),status=form.querySelector('.dialog-status');dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Salvando…';const title=form.querySelector('[name="title"]').value.trim();if(!title){status.textContent='Digite um título para a foto.';button.disabled=false;button.textContent='Salvar alterações';return}const payload={title,description:form.querySelector('[name="description"]').value.trim(),active:form.querySelector('[name="active"]').value==='true'};const {error}=await supabase.from('gallery').update(payload).eq('id',id);if(error){status.textContent=`Não foi possível salvar: ${error.message}`;button.disabled=false;button.textContent='Salvar alterações';return}try{const oldPosition=Number(row.displayPosition)||1,newPosition=Math.max(1,Number(form.querySelector('[name="position"]').value)||oldPosition),moved=newPosition===oldPosition?false:await moveRecordToPosition('gallery',id,newPosition);row.title=payload.title;row.description=payload.description;row.active=payload.active;status.textContent='Alterações salvas.';if(moved){dialog.close();await gallery();return}const editButton=document.querySelector(`[data-edit-photo="${CSS.escape(String(id))}"]`),media=editButton?.closest('.media');if(media){media.querySelector('h3').textContent=payload.title;media.querySelector('.media-image img').alt=payload.title;const positionText=media.querySelector('.muted');positionText.textContent=`Posição ${oldPosition} · ${payload.active?'Publicada':'Oculta'}`}button.textContent='Salvo';setTimeout(()=>dialog.close(),350)}catch(error){status.textContent=`Título salvo, mas não foi possível atualizar a posição: ${error.message}`;button.disabled=false;button.textContent='Salvar alterações'}};dialog.showModal()}
async function deletePhoto(id,url){return remove('gallery',id)}
async function contentTable(table){
  let data=orderedRows(await rows(table)).map((row,index)=>({...row,displayPosition:index+1}));
  const copy=table==='site_content', video=table==='videos';
  const help=copy?'Edite o texto que aparece no site.':table==='links'?'Edite nome, descrição, imagem, destino e ordem de cada card.':video?'Revise os vídeos abaixo ou adicione um arquivo do seu dispositivo.':'Edite nome, descrição, ordem e visibilidade.';
  const videoUpload=video?`<section class="video-upload"><div class="video-upload-copy"><b>Adicionar vídeos do dispositivo</b><p>Selecione MP4 ou WebM, confira a prévia e envie.</p></div><input id="videoFiles" type="file" accept="video/mp4,video/webm" multiple><label class="primary" for="videoFiles">Escolher vídeos</label><div id="videoPreviews" class="video-preview-grid"></div><button class="primary" id="sendVideos" disabled>Enviar vídeos selecionados</button><small id="videoStatus" class="upload-status" aria-live="polite"></small></section>`:'';
  let list;
  if(video) list=data.length?`<div class="video-admin-grid">${data.map(videoCard).join('')}</div>`:'<div class="empty">Nenhum vídeo cadastrado. Escolha arquivos acima ou adicione um endereço de vídeo.</div>';
  else list=data.length?`<div class="table"><div class="row head card-row"><span>Conteúdo</span><span>Posição</span><span>Ações</span></div>${data.map(row=>`<div class="row card-row"><span><b>${esc(row.title||row.name||row.label||'Item')}</b><br><small class="muted">${esc(row.subtitle||row.description||row.value||row.category||row.video_url||row.url||'')}</small></span><span>${copy?'':esc(row.displayPosition??row.position??row.sort_order??'—')}</span><span class="actions"><button data-edit="${esc(row.id)}">Editar</button><button class="danger" data-del="${esc(row.id)}">Excluir</button></span></div>`).join('')}</div>`:'<div class="empty">Ainda não há itens nesta lista.<br><button class="primary" id="emptyNew">+ Cadastrar agora</button></div>';
  $('#view').innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">${video?'ACERVO DA CASA':'GERENCIADOR'}</p><h1>${esc(labels[table])}.</h1><p>${help}</p></div><button class="primary" id="new">${video?'+ Adicionar por URL':'+ Novo item'}</button></div>${videoUpload}${list}</div>`;
  $('#new')?.addEventListener('click',()=>editor(table));
  $('#emptyNew')?.addEventListener('click',()=>editor(table));
  document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>editor(table,data.find(row=>String(row.id)===String(button.dataset.edit))));
  document.querySelectorAll('[data-del]').forEach(button=>button.onclick=()=>remove(table,button.dataset.del));
  if(video)wireVideoUpload(data)
}

async function uploadAdminImage(file,folder='links'){
  if(!file)return '';
  const ext=(file.name.match(/\.[^.]+$/)?.[0]||'.jpg').toLowerCase();
  const safe=file.name.replace(/[^a-z0-9._-]+/gi,'-').toLowerCase()||'imagem';
  const path=`${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}${ext && !safe.endsWith(ext)?ext:''}`;
  const up=await supabase.storage.from('casa-oito-del-mare').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type||'image/jpeg'});
  if(up.error)throw up.error;
  return supabase.storage.from('casa-oito-del-mare').getPublicUrl(path).data.publicUrl;
}
function linkPageDefaults(){return {profile:{name:'Casa Oito Del Mare',location:'ARMAÇÃO DOS BÚZIOS · RJ',bio:'Onde o tempo desacelera e Búzios começa.',instagram:'https://www.instagram.com/casaoitodelmare/',whatsapp:'5521986362770',map:'https://www.google.com/maps/search/?api=1&query=Arma%C3%A7%C3%A3o+dos+B%C3%BAzios+RJ',contact:{phones:['(21) 98636-2770','(21) 98635-7913'],instagram:'https://www.instagram.com/casaoitodelmare/'}},appearance:{quote:'Dias de sol. Noites tranquilas.|Memórias para levar.'},availability:{enabled:true,title:'Consulte sua estadia.',subtitle:'As datas em vermelho já estão reservadas. As demais estão livres para consulta.',reservedDates:[],whatsapp:'5521986362770'},links:[]}}
async function linkPageRecord(){const result=await supabase.from('link_page_settings').select('*').eq('id',1).maybeSingle();if(result.error)throw result.error;return result.data||{id:1,...linkPageDefaults()}}
async function saveLinkPage(record){const {error}=await supabase.from('link_page_settings').upsert({id:1,profile:record.profile||{},appearance:record.appearance||{},availability:record.availability||{},links:record.links||[],updated_at:new Date().toISOString()});if(error)throw error}
async function linkPageView(){
  const record=await linkPageRecord();
  const profile=record.profile||{};const cards=Array.isArray(record.links)?record.links:[];const availability=record.availability||{};
  $('#view').innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">LINKS · EXPERIÊNCIA DIGITAL</p><h1>Página de links.</h1><p>Edite a apresentação, crie cards, troque imagens, mude destinos, destaque conteúdos ou remova o que não quiser publicar.</p></div><div class="view-head-actions"><button class="primary profile-edit-button" id="editLinkProfile">✦ Editar apresentação</button><button class="primary" id="newLinkPageCard">+ Novo card</button></div></div><div class="panel-tip"><b>Como funciona</b><p>Os cards desta tela são independentes dos cards da página inicial. Você pode criar quantos quiser e definir o tipo, destino, imagem, texto, destaque e publicação.</p></div><div class="link-admin-grid">${cards.length?cards.map((card,index)=>linkPageAdminCard(card,index)).join(''):'<div class="empty">Nenhum card cadastrado ainda.</div>'}</div></div>`;
  $('#editLinkProfile').onclick=()=>editLinkProfile(record);
  $('#newLinkPageCard').onclick=()=>editLinkPageCard(record,-1);
  document.querySelectorAll('[data-edit-link-page]').forEach(b=>b.onclick=()=>editLinkPageCard(record,Number(b.dataset.editLinkPage)));
  document.querySelectorAll('[data-del-link-page]').forEach(b=>b.onclick=async()=>{const index=Number(b.dataset.delLinkPage);if(!await askDelete('Excluir card?','O card será removido da página de links.'))return;record.links.splice(index,1);await saveLinkPage(record);await linkPageView()});
}
function linkPageAdminCard(card,index){return `<article class="link-admin-card"><div class="link-admin-thumb">${card.image_url?`<img src="${esc(card.image_url)}" alt="">`:`<span>${esc(card.icon||'8')}</span>`}</div><div class="link-admin-copy"><div class="link-admin-top"><span class="content-pill">${esc(card.type||'link')}</span>${card.featured?'<span class="content-pill featured">Destaque</span>':''}${card.active===false?'<span class="content-pill hidden">Oculto</span>':''}</div><h3>${esc(card.title||'Sem título')}</h3><p>${esc(card.subtitle||'Sem descrição')}</p><small>${esc(card.url||'Sem destino')}</small></div><div class="actions"><button data-edit-link-page="${index}">Editar</button><button class="danger" data-del-link-page="${index}">Excluir</button></div></article>`}
async function editLinkProfile(record){
  const p=record.profile||{};const c=p.contact||{};const dialog=document.createElement('dialog');dialog.className='admin-dialog';dialog.innerHTML=`<form class="admin-edit-form"><div class="admin-dialog-mark">8</div><p class="eyebrow">PÁGINA DE LINKS</p><h2>Apresentação</h2><label>Nome<input name="name" value="${esc(p.name||'Casa Oito Del Mare')}"></label><label>Localização<input name="location" value="${esc(p.location||'')}"></label><label>Bio<textarea name="bio" rows="3">${esc(p.bio||'')}</textarea></label><label>Instagram<input name="instagram" value="${esc(p.instagram||'')}"></label><label>WhatsApp<input name="whatsapp" value="${esc(p.whatsapp||'')}"></label><label>Mapa<input name="map" value="${esc(p.map||'')}"></label><label>Imagem de capa<input name="cover_image" value="${esc(p.cover_image||'')}" placeholder="URL pública ou caminho relativo"></label><label>Telefones (um por linha)<textarea name="phones" rows="3">${esc(Array.isArray(c.phones)?c.phones.join('\n'):'')}</textarea></label><label>Instagram do contato<input name="contactInstagram" value="${esc(c.instagram||p.instagram||'')}"></label><div class="admin-dialog-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary" type="submit">Salvar</button></div></form>`;
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const q=n=>f.querySelector(`[name="${n}"]`).value.trim();record.profile={...p,name:q('name'),location:q('location'),bio:q('bio'),instagram:q('instagram'),whatsapp:q('whatsapp'),map:q('map'),cover_image:q('cover_image'),contact:{phones:q('phones').split(/\n+/).map(x=>x.trim()).filter(Boolean),instagram:q('contactInstagram')}};try{await saveLinkPage(record);dialog.close();await linkPageView()}catch(error){alert(error.message)}};dialog.showModal();
}
let reservationMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let reservationScrollLockY=0;
function adminTodayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function lockReservationScroll(){if(document.body.dataset.reservationScrollLocked==='1')return;reservationScrollLockY=window.scrollY||window.pageYOffset||0;document.body.dataset.reservationScrollLocked='1';document.documentElement.classList.add('reservation-modal-open');document.body.classList.add('reservation-modal-open');document.body.style.top=`-${reservationScrollLockY}px`}
function unlockReservationScroll(){if(document.body.dataset.reservationScrollLocked!=='1')return;document.documentElement.classList.remove('reservation-modal-open');document.body.classList.remove('reservation-modal-open');document.body.style.removeProperty('top');delete document.body.dataset.reservationScrollLocked;window.scrollTo(0,reservationScrollLockY)}
function brDateFromKey(key){const m=String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:key}
function validDateKey(key){const m=String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return false;const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));return d.getFullYear()===Number(m[1])&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[3])}
function addDaysKey(key,amount){const d=new Date(`${key}T12:00:00`);d.setDate(d.getDate()+amount);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function daysBetweenKeys(a,b){const out=[];if(!validDateKey(a)||!validDateKey(b))return out;for(let k=a;k<=b;k=addDaysKey(k,1)){out.push(k);if(out.length>400)break}return out}
function reservationRecords(availability){
  const records=[];
  const source=Array.isArray(availability?.reservations)?availability.reservations:[];
  source.forEach((r,i)=>{
    if(!r)return;
    const checkIn=String(r.check_in||r.checkIn||r.date||'');
    const checkOut=String(r.check_out||r.checkOut||checkIn);
    if(!validDateKey(checkIn))return;
    const end=validDateKey(checkOut)&&checkOut>=checkIn?checkOut:checkIn;
    records.push({id:String(r.id||`${checkIn}-${end}-${i}`),check_in:checkIn,check_out:end,status:r.status||((r.reserved===false)?'available':'reserved'),name:String(r.name||''),phone:String(r.phone||''),note:String(r.note||'')});
  });
  // Compatibilidade com a estrutura antiga: uma reserva por dia vira uma reserva de 1 diária.
  (availability?.reservedDates||[]).filter(validDateKey).forEach(date=>{
    if(!records.some(r=>date>=r.check_in&&date<=r.check_out)) records.push({id:`legacy-${date}`,check_in:date,check_out:date,status:'reserved',name:'',phone:'',note:'',legacy:true});
  });
  return records.sort((a,b)=>a.check_in.localeCompare(b.check_in)||a.check_out.localeCompare(b.check_out));
}
function reservationAt(records,key){return records.find(r=>key>=r.check_in&&key<=r.check_out)||null}
function rangeConflict(records,start,end,ignoreId=''){
  return records.find(r=>r.id!==ignoreId&&r.status&&r.status!=='available'&&r.check_in<=end&&r.check_out>=start)||null;
}
function showReservationConflict(){
  const dialog=document.createElement('dialog');
  dialog.className='reservation-dialog reservation-conflict-dialog';
  dialog.innerHTML='<div class="reservation-conflict-content"><p>Há outra reserva ou bloqueio dentro deste período. Escolha outras datas.</p><button type="button" class="primary" data-ok>OK</button></div>';
  document.body.append(dialog);
  const close=()=>{if(dialog.open)dialog.close();dialog.remove()};
  dialog.querySelector('[data-ok]').onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.showModal();
}
function confirmReservationRemoval(checkIn,checkOut){
  const period=checkIn===checkOut?brDateFromKey(checkIn):`${brDateFromKey(checkIn)} a ${brDateFromKey(checkOut)}`;
  const message=checkIn===checkOut?`Excluir a reserva de ${period} e liberar esse dia?`:`Excluir a reserva de ${period} e liberar esse período?`;
  const dialog=document.createElement('dialog');
  dialog.className='reservation-dialog reservation-confirm-dialog';
  dialog.setAttribute('aria-label','Confirmar exclusão da reserva');
  dialog.innerHTML=`<div class="reservation-confirm-content"><p>${message}</p><div class="reservation-confirm-actions"><button type="button" class="secondary" data-cancel>Cancelar</button><button type="button" class="danger" data-confirm>Sim</button></div></div>`;
  document.body.append(dialog);
  return new Promise(resolve=>{
    let settled=false;
    const finish=value=>{if(settled)return;settled=true;if(dialog.open)dialog.close();dialog.remove();resolve(value)};
    dialog.querySelector('[data-cancel]').onclick=()=>finish(false);
    dialog.querySelector('[data-confirm]').onclick=()=>finish(true);
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false)});
    dialog.addEventListener('click',event=>{if(event.target===dialog)finish(false)});
    dialog.addEventListener('close',()=>{if(!settled){settled=true;dialog.remove();resolve(false)}},{once:true});
    dialog.showModal();
  });
}
async function reservationsView(){
  const record=await linkPageRecord();
  const availability=record.availability||linkPageDefaults().availability;
  const records=reservationRecords(availability);
  let draftStart=null,draftEnd=null,editingId='';
  const statusMeta={reserved:['Reservado','reserved'],pre:['Pré-reservado','pre'],blocked:['Bloqueado','blocked']};
  const showSelectionError=(message)=>{
    let box=$('#view').querySelector('#reservationRangeError');
    if(!box){box=document.createElement('div');box.id='reservationRangeError';box.className='reservation-range-error';box.setAttribute('role','alert');const panel=$('#view').querySelector('.reservation-panel');panel?.prepend(box)}
    box.textContent=message;box.hidden=false;
    clearTimeout(showSelectionError.timer);showSelectionError.timer=setTimeout(()=>{box.hidden=true},5200);
  };
  const clearSelectionError=()=>{const box=$('#view').querySelector('#reservationRangeError');if(box)box.hidden=true};
  const renderReservationCalendar=()=>{
    const first=new Date(reservationMonth.getFullYear(),reservationMonth.getMonth(),1);
    const days=new Date(reservationMonth.getFullYear(),reservationMonth.getMonth()+1,0).getDate();
    const offset=first.getDay();
    const monthLabel=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(reservationMonth);
    const cells=[];
    for(let i=0;i<offset;i++)cells.push('<span class="reservation-day empty"></span>');
    for(let d=1;d<=days;d++){
      const key=`${reservationMonth.getFullYear()}-${String(reservationMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const item=reservationAt(records,key); const status=item?.status||'available';
      const isPast=key<adminTodayKey();
      const disabledPast=isPast&&!item;
      const inDraft=draftStart&&draftEnd&&key>=draftStart&&key<=draftEnd;
      const isStart=key===draftStart,isEnd=key===draftEnd;
      const cls=['reservation-day',`status-${status}`,item?.name?'has-guest':'',inDraft?'is-range':'',isStart?'is-range-start':'',isEnd?'is-range-end':'',disabledPast?'is-date-disabled is-past':''].filter(Boolean).join(' ');
      cells.push(`<button type="button" class="${cls}" data-res-date="${key}" ${disabledPast?'disabled':''} aria-pressed="${item?'true':'false'}" aria-label="${brDateFromKey(key)}${item?', '+(statusMeta[status]?.[0]||status):disabledPast?', indisponível':''}"><span>${d}</span>${status!=='available'?'<i aria-hidden="true"></i>':''}</button>`);
    }
    const root=$('#view');root.querySelector('#reservationMonth').textContent=monthLabel;root.querySelector('#reservationGrid').innerHTML=cells.join('');
    const prevButton=root.querySelector('#reservationPrev');
    const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
    if(prevButton)prevButton.disabled=reservationMonth<=currentMonth;
    const count=records.filter(r=>r.status&&r.status!=='available').length;root.querySelector('#reservationCount').textContent=`${count} ${count===1?'reserva':'reservas'}`;
    const cardsRoot=root.querySelector('#reservationCards');
    const cards=records.filter(r=>r.status&&r.status!=='available').sort((a,b)=>a.check_in.localeCompare(b.check_in));
    cardsRoot.innerHTML=cards.length?cards.map(item=>{
      const meta=statusMeta[item.status]||['Reservado','reserved'];const phoneDigits=String(item.phone||'').replace(/\D/g,'');
      const period=item.check_in===item.check_out?brDateFromKey(item.check_in):`${brDateFromKey(item.check_in)} → ${brDateFromKey(item.check_out)}`;
      return `<article class="reservation-card status-${meta[1]}"><div class="reservation-card-head"><time datetime="${item.check_in}">${period}</time><span class="reservation-status"><i class="status-dot" aria-hidden="true"></i>${meta[0]}</span></div><div class="reservation-card-body"><strong>${esc(item.name||'Hóspede não informado')}</strong>${phoneDigits?`<span class="reservation-card-phone"><i aria-hidden="true">☎</i>${esc(item.phone)}</span>`:'<span class="reservation-card-muted">Telefone não informado</span>'}</div><div class="reservation-card-footer"><button type="button" class="reservation-card-edit" data-res-id="${esc(item.id)}">Editar</button></div></article>`;
    }).join(''):'<div class="reservation-cards-empty">Nenhuma reserva cadastrada ainda.</div>';
    // O botão Editar continua abrindo o editor. O restante do card abre apenas a visualização rápida.
    cardsRoot.querySelectorAll('.reservation-card').forEach(card=>{
      const id=card.querySelector('[data-res-id]')?.dataset.resId;
      if(!id)return;
      card.addEventListener('click',event=>{
        if(event.target.closest('.reservation-card-edit'))return;
        if(event.target.closest('a'))return;
        const item=records.find(r=>String(r.id)===String(id));
        if(item)openReservationPreview(item);
      });
    });
    cardsRoot.querySelectorAll('.reservation-card-edit').forEach(btn=>btn.addEventListener('click',event=>{
      event.stopPropagation();
      openReservationEditor(btn.dataset.resId);
    }));

    // Delegação no próprio grid: continua funcionando mesmo depois de cada render do calendário.
    const grid=root.querySelector('#reservationGrid');
    if(grid){
      grid.onclick=event=>{
        const btn=event.target.closest('button[data-res-date]');
        if(!btn || !grid.contains(btn))return;
        event.preventDefault();
        event.stopPropagation();
        const key=btn.dataset.resDate;
        const existing=reservationAt(records,key);
        if(existing){openReservationEditor(existing.id);return}
        clearSelectionError();
        if(!draftStart || draftEnd){
          draftStart=key;draftEnd=null;editingId='';renderReservationCalendar();return;
        }
        if(key<draftStart){
          draftStart=key;draftEnd=null;renderReservationCalendar();return;
        }
        const conflict=rangeConflict(records,draftStart,key,'');
        if(conflict){
          const errorText=`Há uma data ${statusMeta[conflict.status]?.[0]?.toLowerCase()||'indisponível'} entre a entrada e a saída. Escolha outro período.`;
          draftStart=null;draftEnd=null;editingId='';renderReservationCalendar();showSelectionError(errorText);return;
        }
        draftEnd=key;renderReservationCalendar();openReservationEditor(null,true);
      };
    }
    const reservationPanel=root.querySelector('.reservation-panel');
    if(reservationPanel){
      reservationPanel.dataset.selectionResetBound='1';
      const resetOutsideSelection=()=>{
        if(!draftStart&&!draftEnd)return;
        draftStart=null;draftEnd=null;editingId='';clearSelectionError();renderReservationCalendar();
      };
      root.__resetReservationSelection=resetOutsideSelection;
      if(!document.__reservationOutsideResetHandler){
        document.__reservationOutsideResetHandler=(event)=>{
          const currentRoot=document.querySelector('#view');
          const panel=currentRoot?.querySelector('.reservation-panel');
          if(!panel || panel.contains(event.target))return;
          currentRoot?.__resetReservationSelection?.();
        };
        document.addEventListener('click',document.__reservationOutsideResetHandler);
      }
    }
  };
  const openReservationPreview=(item)=>{
    if(!item)return;
    const meta=statusMeta[item.status]||['Reservado','reserved'];
    const period=item.check_in===item.check_out?brDateFromKey(item.check_in):`${brDateFromKey(item.check_in)} → ${brDateFromKey(item.check_out)}`;
    const phoneDigits=String(item.phone||'').replace(/\D/g,'');
    const whatsappPhone=phoneDigits.length===10||phoneDigits.length===11?`55${phoneDigits}`:phoneDigits.startsWith('0')&&(phoneDigits.length===11||phoneDigits.length===12)?`55${phoneDigits.slice(1)}`:phoneDigits;
    const whatsappMessage=encodeURIComponent(`Olá! Estou entrando em contato sobre a estadia de ${period} na Casa Oito Del Mare.`);
    const dialog=document.createElement('dialog');
    dialog.className='reservation-preview-dialog';
    dialog.innerHTML=`<div class="reservation-preview">
      <button type="button" class="reservation-preview-close" aria-label="Fechar">×</button>
      <div class="reservation-preview-top"><p class="eyebrow">DETALHES DA RESERVA</p><h2>${period}</h2><div class="reservation-preview-status status-${meta[1]}"><i class="status-dot" aria-hidden="true"></i>${meta[0]}</div></div>
      <div class="reservation-preview-data">
        <div><span>HÓSPEDE</span><strong>${esc(item.name||'Hóspede não informado')}</strong></div>
        <div class="reservation-preview-contact"><span>TELEFONE · WHATSAPP</span>${whatsappPhone?`<a class="reservation-preview-phone" href="https://wa.me/${whatsappPhone}?text=${whatsappMessage}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 .1C5.4.1.1 5.4.1 12c0 2.1.6 4.1 1.6 5.8L.1 24l6.4-1.7a12 12 0 0 0 5.5 1.4h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.1-3.5-8.3ZM12 21.7c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.2-.4A9.8 9.8 0 0 1 2.1 12c0-5.5 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.8-9.9 9.8Zm5.4-7.4c-.3-.2-1.7-.9-2-.9-.3-.1-.5-.2-.7.2-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3s-.2-.3-.5-.5Z"/></svg><span>${esc(item.phone)}</span><i aria-hidden="true">↗</i></a>`:`<strong class="reservation-preview-no-phone">Telefone não informado</strong>`}</div>
        ${item.note?`<div class="reservation-preview-note"><span>OBSERVAÇÃO</span><p>${esc(item.note)}</p></div>`:''}
      </div>
    </div>`;
    document.body.append(dialog);
    const close=()=>{if(dialog.open)dialog.close();dialog.remove()};
    dialog.querySelector('.reservation-preview-close').onclick=close;
    dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
    dialog.addEventListener('cancel',close);
    dialog.showModal();
  };
  const openReservationDatePicker=(options={})=>{
    const target=options.target==='check_out'?'check_out':'check_in';
    const current=options.current||null;
    const fromSelection=!!options.fromSelection;
    const seedCheckIn=options.checkIn||current?.check_in||draftStart||'';
    const seedCheckOut=options.checkOut||current?.check_out||draftEnd||seedCheckIn;
    const preserved={status:options.status||current?.status||'reserved',name:options.name ?? current?.name ?? '',phone:options.phone ?? current?.phone ?? '',note:options.note ?? current?.note ?? ''};
    let pickerMonth=new Date(validDateKey(target==='check_in'?seedCheckIn:seedCheckOut)?`${target==='check_in'?seedCheckIn:seedCheckOut}T12:00:00`:reservationMonth);
    pickerMonth=new Date(pickerMonth.getFullYear(),pickerMonth.getMonth(),1);
    const dialog=document.createElement('dialog');dialog.className='reservation-date-picker-dialog';
    const render=()=>{
      const first=new Date(pickerMonth.getFullYear(),pickerMonth.getMonth(),1),days=new Date(pickerMonth.getFullYear(),pickerMonth.getMonth()+1,0).getDate(),offset=first.getDay();
      const monthLabel=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(pickerMonth);
      const cells=[];
      for(let i=0;i<offset;i++)cells.push('<span class="reservation-day empty"></span>');
      for(let d=1;d<=days;d++){
        const key=`${pickerMonth.getFullYear()}-${String(pickerMonth.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const occupied=reservationAt(records,key);
        const ownReservation=occupied&&current&&String(occupied.id)===String(current.id);
        const conflict=occupied&&!ownReservation;
        const isPast=key<adminTodayKey();
        const beforeEntry=target==='check_out'&&seedCheckIn&&key<seedCheckIn;
        const afterExit=target==='check_in'&&seedCheckOut&&key>seedCheckOut;
        const disabled=conflict||isPast||beforeEntry||afterExit;
        const selected=key===(target==='check_in'?seedCheckIn:seedCheckOut);
        const status=conflict?(occupied.status||'reserved'):'available';
        const classes=['reservation-day',`status-${status}`,selected?'is-range-start':'',disabled?'is-date-disabled':''].filter(Boolean).join(' ');
        const label=disabled?`${brDateFromKey(key)}, indisponível`:`${brDateFromKey(key)}, disponível`;
        cells.push(`<button type="button" class="${classes}" data-picker-date="${key}" ${disabled?'disabled':''} aria-label="${label}" aria-pressed="${selected?'true':'false'}"><span>${d}</span>${conflict?'<i aria-hidden="true"></i>':''}</button>`);
      }
      dialog.innerHTML=`<div class="reservation-date-picker"><div class="reservation-date-picker-top"><div><p class="eyebrow">${target==='check_in'?'NOVA ENTRADA':'NOVA SAÍDA'}</p><h2>Escolha a data</h2><p>${target==='check_in'?'Selecione uma nova data de entrada.':'Selecione uma nova data de saída.'}</p></div><button type="button" class="reservation-close" data-picker-close aria-label="Fechar">×</button></div><div class="reservation-toolbar"><button type="button" data-picker-prev aria-label="Mês anterior">‹</button><strong>${monthLabel}</strong><button type="button" data-picker-next aria-label="Próximo mês">›</button></div><div class="reservation-week"><span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span></div><div class="reservation-grid reservation-date-picker-grid">${cells.join('')}</div><div class="reservation-summary reservation-date-picker-legend"><span><i class="reservation-legend-available-dot"></i> disponível</span><span class="reservation-legend-pre">pré-reserva</span><span class="reservation-legend-blocked">bloqueado</span><span class="reservation-legend-reserved">reservado</span></div></div>`;
      const pickerPrev=dialog.querySelector('[data-picker-prev]');
      const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);
      if(pickerPrev)pickerPrev.disabled=pickerMonth<=currentMonth;
      pickerPrev.onclick=()=>{if(pickerMonth<=currentMonth)return;pickerMonth=new Date(pickerMonth.getFullYear(),pickerMonth.getMonth()-1,1);render()};
      dialog.querySelector('[data-picker-next]').onclick=()=>{pickerMonth=new Date(pickerMonth.getFullYear(),pickerMonth.getMonth()+1,1);render()};
      dialog.querySelector('[data-picker-close]').onclick=close;
      dialog.querySelectorAll('[data-picker-date]').forEach(btn=>btn.addEventListener('click',()=>{
        const picked=btn.dataset.pickerDate;
        let nextIn=seedCheckIn,nextOut=seedCheckOut;
        if(target==='check_in'){nextIn=picked;if(nextOut&&nextIn>nextOut)nextOut=picked}else{nextOut=picked;if(nextIn&&nextOut<nextIn)nextIn=picked}
        const conflict=rangeConflict(records,nextIn,nextOut,current?.id||'');
        if(conflict){showReservationConflict();return}
        close();
        draftStart=null;draftEnd=null;editingId='';
        openReservationEditor(current?.id||null,fromSelection,{checkIn:nextIn,checkOut:nextOut,...preserved});
      }));
    };
    document.body.append(dialog);
    const close=()=>{if(dialog.open)dialog.close();dialog.remove();unlockReservationScroll()};
    dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
    dialog.addEventListener('close',()=>unlockReservationScroll(),{once:true});
    render();lockReservationScroll();dialog.showModal();
  };
  const openReservationEditor=async(id,fromSelection=false,overrides={})=>{
    const current=id?records.find(r=>r.id===id):null;
    if(id&&!current)return;
    const checkIn=overrides.checkIn||current?.check_in||draftStart||'';
    const checkOut=overrides.checkOut||current?.check_out||draftEnd||checkIn;
    const preserved={status:overrides.status??current?.status??'reserved',name:overrides.name??current?.name??'',phone:overrides.phone??current?.phone??'',note:overrides.note??current?.note??''};
    const dialog=document.createElement('dialog');dialog.className='reservation-dialog';
    dialog.innerHTML=`<form method="dialog" class="reservation-form"><div class="reservation-dialog-top"><div><p class="eyebrow">${current?'EDITAR RESERVA':'NOVA RESERVA'}</p><h2>${checkIn===checkOut?brDateFromKey(checkIn):`${brDateFromKey(checkIn)} → ${brDateFromKey(checkOut)}`}</h2><p>Confira o período e preencha os dados da estadia.</p></div><button type="button" class="reservation-close" data-close aria-label="Fechar">×</button></div><div class="reservation-date-summary"><button type="button" class="reservation-date-pick" data-date-target="check_in"><span>ENTRADA</span><b>${brDateFromKey(checkIn)}</b><small>Alterar data <i aria-hidden="true">↗</i></small></button><button type="button" class="reservation-date-pick" data-date-target="check_out"><span>SAÍDA</span><b>${brDateFromKey(checkOut)}</b><small>Alterar data <i aria-hidden="true">↗</i></small></button></div><div class="reservation-editor-section"><div class="reservation-section-heading"><span>DADOS DA ESTADIA</span><small>Informações do hóspede e situação</small></div><label class="reservation-form-field"><span>Estado da reserva</span><select name="status"><option value="pre" ${preserved.status==='pre'?'selected':''}>Pré-reserva</option><option value="reserved" ${preserved.status==='reserved'?'selected':''}>Reservado</option><option value="blocked" ${preserved.status==='blocked'?'selected':''}>Bloqueado</option></select></label><div class="reservation-fields"><label class="reservation-form-field"><span>Nome do hóspede</span><input name="name" autocomplete="name" value="${esc(preserved.name)}" placeholder="Ex.: João da Silva"></label><label class="reservation-form-field"><span>Telefone</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" value="${esc(preserved.phone)}" placeholder="(21) 99999-9999"></label></div><label class="reservation-form-field"><span>Observação <small>OPCIONAL</small></span><textarea name="note" rows="3" placeholder="Ex.: casal · aniversário · chegada às 14h">${esc(preserved.note)}</textarea></label></div><div class="reservation-dialog-actions">${current?'<button type="button" class="danger reservation-delete" data-delete>Excluir reserva</button>':''}<div class="reservation-actions-main"><button type="button" class="secondary reservation-cancel" data-close>Cancelar</button><button type="submit" class="primary">${current?'Salvar alterações':'Salvar reserva'}</button></div></div></form>`;
    document.body.append(dialog);
    let closedByDatePicker=false;
    const close=()=>{if(dialog.open)dialog.close();unlockReservationScroll();if(fromSelection&&!closedByDatePicker){draftStart=null;draftEnd=null;renderReservationCalendar()}};
    dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
    dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
    dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
    dialog.addEventListener('close',()=>{unlockReservationScroll();dialog.remove()},{once:true});
    dialog.querySelectorAll('[data-date-target]').forEach(button=>button.addEventListener('click',()=>{
      const form=dialog.querySelector('form');
      const preservedNow={status:form.querySelector('[name="status"]').value,name:form.querySelector('[name="name"]').value.trim(),phone:form.querySelector('[name="phone"]').value.trim(),note:form.querySelector('[name="note"]').value.trim()};
      closedByDatePicker=true;dialog.close();
      openReservationDatePicker({target:button.dataset.dateTarget,current,fromSelection,checkIn,checkOut,...preservedNow});
    }));
    dialog.querySelector('form').onsubmit=async e=>{
      e.preventDefault();const form=e.currentTarget;const status=form.querySelector('[name="status"]').value;const name=form.querySelector('[name="name"]').value.trim();const phone=form.querySelector('[name="phone"]').value.trim();const note=form.querySelector('[name="note"]').value.trim();
      const button=form.querySelector('[type="submit"]');button.disabled=true;button.textContent='Salvando…';
      try{
        if(!checkIn||!validDateKey(checkIn)||!checkOut||!validDateKey(checkOut)||checkOut<checkIn)throw new Error('Selecione uma entrada e uma saída válidas.');
        const conflict=rangeConflict(records,checkIn,checkOut,current?.id||'');if(conflict)throw new Error('Há outra reserva ou bloqueio dentro deste período. Escolha outras datas.');
        const item={id:current?.id||`res-${Date.now()}`,check_in:checkIn,check_out:checkOut,status,name,phone,note};
        if(current){const idx=records.findIndex(r=>r.id===current.id);if(idx>=0)records[idx]=item;else records.push(item)}else records.push(item);
        await persist();draftStart=null;draftEnd=null;editingId='';dialog.close();renderReservationCalendar();
      }catch(error){button.disabled=false;button.textContent='Salvar data';if(error.message==='Há outra reserva ou bloqueio dentro deste período. Escolha outras datas.')showReservationConflict();else alert(error.message)}
    };
    dialog.querySelector('[data-delete]')?.addEventListener('click',async()=>{const button=dialog.querySelector('[data-delete]');if(!await confirmReservationRemoval(checkIn,checkOut))return;button.disabled=true;button.textContent='Excluindo…';try{const idx=records.findIndex(r=>r.id===id);if(idx>=0)records.splice(idx,1);await persist();draftStart=null;draftEnd=null;dialog.close();renderReservationCalendar()}catch(error){button.disabled=false;button.textContent='Excluir reserva';alert(error.message)}});
    lockReservationScroll();dialog.showModal();
  };
  const persist=async()=>{
    const reservations=records.filter(r=>r.status&&r.status!=='available').map(r=>({id:r.id,check_in:r.check_in,check_out:r.check_out,status:r.status,name:r.name,phone:r.phone,note:r.note})).sort((a,b)=>a.check_in.localeCompare(b.check_in));
    const reservedDates=reservations.filter(r=>r.status==='reserved'||r.status==='blocked').flatMap(r=>daysBetweenKeys(r.check_in,r.check_out));
    const next={...availability,enabled:true,reservations,reservedDates:[...new Set(reservedDates)].sort()};
    await saveLinkPage({...record,availability:next});
  };
  $('#view').innerHTML=`<div class="view reservations-view"><div class="view-head"><div><p class="eyebrow">PÁGINA DE LINKS</p><h1>Reservas.</h1><p>1º toque define a entrada. 2º toque define a saída. O período é salvo como uma única reserva.</p></div></div><div class="reservation-layout"><section class="reservation-panel"><div id="reservationRangeError" class="reservation-range-error" role="alert" hidden></div><div class="reservation-calendar-section"><div class="reservation-toolbar"><button type="button" id="reservationPrev" aria-label="Mês anterior">‹</button><strong id="reservationMonth"></strong><button type="button" id="reservationNext" aria-label="Próximo mês">›</button></div><div class="reservation-week"><span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span></div><div class="reservation-grid" id="reservationGrid"></div><div class="reservation-summary"><span><i></i> reservado</span><span class="reservation-legend-pre">pré-reserva</span><span class="reservation-legend-blocked">bloqueado</span><span>1º entrada · 2º saída</span><b id="reservationCount">0 reservas</b></div></div><div class="reservation-cards-section"><div class="reservation-cards-title"><span>RESERVAS CADASTRADAS</span><small>Por entrada</small></div><div class="reservation-cards" id="reservationCards"></div></div></section><aside class="reservation-settings reservation-howto"><p class="eyebrow">COMO USAR</p><h2>Gerencie os períodos com poucos toques.</h2><ol><li><b>Toque na entrada</b><span>Escolha o primeiro dia do período.</span></li><li><b>Toque na saída</b><span>Escolha o último dia. O intervalo fica marcado.</span></li><li><b>Defina o estado</b><span>Reservado, Pré-reserva ou Bloqueado.</span></li><li><b>Salve</b><span>A reserva inteira é gravada como um único período.</span></li><li><b>Edite ou exclua</b><span>Use os cards abaixo do calendário para alterar ou liberar um período.</span></li></ol></aside></div></div>`;
  $('#reservationPrev').onclick=()=>{const currentMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);if(reservationMonth<=currentMonth)return;reservationMonth=new Date(reservationMonth.getFullYear(),reservationMonth.getMonth()-1,1);draftStart=draftEnd=null;renderReservationCalendar()};
  $('#reservationNext').onclick=()=>{reservationMonth=new Date(reservationMonth.getFullYear(),reservationMonth.getMonth()+1,1);draftStart=draftEnd=null;renderReservationCalendar()};
  renderReservationCalendar();
}
async function editStaySettings(record){
  const a=record.availability||{}; const dates=Array.isArray(a.reservedDates)?a.reservedDates:[];
  const dialog=document.createElement('dialog'); dialog.className='admin-dialog';
  dialog.innerHTML=`<form class="admin-edit-form"><div class="admin-dialog-mark">8</div><p class="eyebrow">PÁGINA DE LINKS</p><h2>Configurar estadia.</h2><p class="muted">Cadastre uma data por linha no padrão brasileiro <b>DD/MM/AAAA</b>. Essas datas aparecem em vermelho no calendário público.</p><label>Título do calendário<input name="title" value="${esc(a.title||'Consulte sua estadia.')}"></label><label>Texto de apoio<textarea name="subtitle" rows="3">${esc(a.subtitle||'As datas em vermelho já estão reservadas. As demais estão livres para consulta.')}</textarea></label><label>WhatsApp para consultas<input name="whatsapp" value="${esc(a.whatsapp||record.profile?.whatsapp||'')}"></label><label>Datas reservadas (uma por linha)<textarea name="reservedDates" rows="9" placeholder="10/10/2026
11/10/2026
25/10/2026">${esc(dates.map(x=>{const m=String(x).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:x}).join('\n'))}</textarea><div class="admin-dialog-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary" type="submit">Salvar calendário</button></div></form>`;
  document.body.append(dialog); dialog.querySelector('[data-close]').onclick=()=>dialog.close(); dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const q=n=>f.querySelector(`[name="${n}"]`).value.trim();const raw=q('reservedDates').split(/\s+/).map(x=>x.trim()).filter(Boolean);const parsed=[];for(const value of raw){const m=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m){alert(`Data inválida: ${value}. Use DD/MM/AAAA.`);return}const day=Number(m[1]),month=Number(m[2]),year=Number(m[3]);const dt=new Date(year,month-1,day);if(dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day){alert(`Data inválida: ${value}. Use DD/MM/AAAA.`);return}parsed.push(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`)}record.availability={enabled:true,title:q('title'),subtitle:q('subtitle'),whatsapp:q('whatsapp').replace(/\D/g,''),reservedDates:[...new Set(parsed)].sort()};try{await saveLinkPage(record);dialog.close();await linkPageView()}catch(error){alert(error.message)}};
  dialog.showModal();
}
async function editLinkPageCard(record,index){
  const row=index>=0?record.links[index]:{title:'',subtitle:'',url:'',icon:'8',type:'link',image_url:'',featured:false,active:true,note:''};
  const dialog=document.createElement('dialog');dialog.className='admin-dialog';dialog.innerHTML=`<form class="admin-edit-form"><div class="admin-dialog-mark">8</div><p class="eyebrow">PÁGINA DE LINKS</p><h2>${index>=0?'Editar card':'Novo card'}</h2><label>Título<input name="title" value="${esc(row.title||'')}" required></label><label>Texto menor<input name="subtitle" value="${esc(row.subtitle||'')}"></label><label>Tipo<select name="type"><option value="link" ${row.type==='link'||!row.type?'selected':''}>Link</option><option value="whatsapp" ${row.type==='whatsapp'?'selected':''}>WhatsApp</option><option value="instagram" ${row.type==='instagram'?'selected':''}>Instagram</option><option value="map" ${row.type==='map'?'selected':''}>Mapa</option><option value="tourism" ${row.type==='tourism'?'selected':''}>Pontos turísticos</option><option value="contact" ${row.type==='contact'?'selected':''}>Contato</option></select></label><label>Destino / URL<input name="url" value="${esc(row.url||'')}" placeholder="https://... ou #tourism"></label><label>Imagem por URL<input name="image_url" value="${esc(row.image_url||'')}" placeholder="URL pública ou caminho relativo"></label><label>Trocar imagem<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><div class="edit-inline"><label>Destaque<select name="featured"><option value="true" ${row.featured?'selected':''}>Sim</option><option value="false" ${!row.featured?'selected':''}>Não</option></select></label><label>Visível<select name="active"><option value="true" ${row.active!==false?'selected':''}>Sim</option><option value="false" ${row.active===false?'selected':''}>Não</option></select></label></div><div class="admin-dialog-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary" type="submit">Salvar card</button></div></form>`;
  document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const q=n=>f.querySelector(`[name="${n}"]`).value.trim();const button=f.querySelector('[type="submit"]');button.disabled=true;button.textContent='Salvando…';try{let image=q('image_url');const file=f.querySelector('[name="image_file"]').files[0];if(file)image=await uploadAdminImage(file,'links');const item={title:q('title'),subtitle:q('subtitle'),type:q('type'),url:q('url'),icon:'',image_url:image,featured:q('featured')==='true',active:q('active')==='true',note:'',position:index>=0?(Number(record.links[index].position)||index+1):record.links.length+1};if(index>=0)record.links[index]=item;else record.links.push(item);record.links.sort((a,b)=>(Number(a.position)||999)-(Number(b.position)||999));await saveLinkPage(record);dialog.close();await linkPageView()}catch(error){alert(error.message);button.disabled=false;button.textContent='Salvar card'}};dialog.showModal();
}
async function touristRows(){const result=await supabase.from('tourist_points').select('*').order('position',{ascending:true});if(result.error)throw result.error;return result.data||[]}
async function touristView(){const data=await touristRows();$('#view').innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">GUIA DE BÚZIOS</p><h1>Pontos turísticos.</h1><p>Crie, edite, esconda, exclua e reorganize os lugares que aparecem na página de links.</p></div><button class="primary" id="newTourist">+ Novo ponto turístico</button></div><div class="tourist-admin-grid">${data.length?data.map((row,i)=>touristAdminCard(row,i)).join(''):'<div class="empty">Nenhum ponto turístico cadastrado.</div>'}</div></div>`;$('#newTourist').onclick=()=>editTourist();document.querySelectorAll('[data-edit-tourist]').forEach(b=>b.onclick=()=>editTourist(data.find(x=>String(x.id)===String(b.dataset.editTourist))));document.querySelectorAll('[data-del-tourist]').forEach(b=>b.onclick=()=>removeTourist(b.dataset.delTourist))}
function touristAdminCard(row){return `<article class="tourist-admin-card"><img src="${esc(row.image_url||'../assets/gallery/detalhe-11.jpg')}" alt=""><div><div class="link-admin-top"><span class="content-pill">${esc(row.category||'Praia')}</span>${row.featured?'<span class="content-pill featured">Destaque</span>':''}${row.active===false?'<span class="content-pill hidden">Oculto</span>':''}</div><h3>${esc(row.title)}</h3><p>${esc(row.subtitle||row.description||'')}</p><small>Posição ${esc(row.position)}</small></div><div class="actions"><button data-edit-tourist="${esc(row.id)}">Editar</button><button class="danger" data-del-tourist="${esc(row.id)}">Excluir</button></div></article>`}
async function editTourist(row={}){const dialog=document.createElement('dialog');dialog.className='admin-dialog';dialog.innerHTML=`<form class="admin-edit-form"><div class="admin-dialog-mark">8</div><p class="eyebrow">GUIA DE BÚZIOS</p><h2>${row.id?'Editar ponto':'Novo ponto'}</h2><label>Nome<input name="title" value="${esc(row.title||'')}" required></label><label>Subtítulo<input name="subtitle" value="${esc(row.subtitle||'')}"></label><div class="edit-inline"><label>Categoria<input name="category" value="${esc(row.category||'Praia')}"></label><label>Posição<input name="position" type="number" min="1" value="${esc(row.position||1)}"></label></div><label>Descrição<textarea name="description" rows="4">${esc(row.description||'')}</textarea></label><label>Recomendação da Casa<textarea name="recommendation" rows="3">${esc(row.recommendation||'')}</textarea></label><label>Imagem por URL<input name="image_url" value="${esc(row.image_url||'')}" placeholder="URL pública ou caminho relativo"></label><label>Trocar imagem<input name="image_file" type="file" accept="image/jpeg,image/png,image/webp,image/avif"></label><label>Google Maps<input name="map_url" value="${esc(row.map_url||'')}"></label><label>TripAdvisor<input name="tripadvisor_url" value="${esc(row.tripadvisor_url||'')}" placeholder="URL da página no TripAdvisor"></label><label>Instagram<input name="instagram_url" value="${esc(row.instagram_url||'')}"></label><div class="edit-inline"><label>Destaque<select name="featured"><option value="true" ${row.featured?'selected':''}>Sim</option><option value="false" ${!row.featured?'selected':''}>Não</option></select></label><label>Visível<select name="active"><option value="true" ${row.active!==false?'selected':''}>Sim</option><option value="false" ${row.active===false?'selected':''}>Não</option></select></label></div><div class="admin-dialog-actions"><button type="button" class="secondary" data-close>Cancelar</button><button class="primary" type="submit">Salvar</button></div></form>`;document.body.append(dialog);dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const q=n=>f.querySelector(`[name="${n}"]`).value.trim();const button=f.querySelector('[type="submit"]');button.disabled=true;try{let image=q('image_url');const file=f.querySelector('[name="image_file"]').files[0];if(file)image=await uploadAdminImage(file,'tourism');const payload={title:q('title'),subtitle:q('subtitle'),category:q('category'),position:Number(q('position'))||1,description:q('description'),recommendation:q('recommendation'),image_url:image,map_url:q('map_url'),tripadvisor_url:q('tripadvisor_url'),instagram_url:q('instagram_url'),featured:q('featured')==='true',active:q('active')==='true',updated_at:new Date().toISOString()};const result=row.id?await supabase.from('tourist_points').update(payload).eq('id',row.id):await supabase.from('tourist_points').insert(payload);if(result.error)throw result.error;dialog.close();await touristView()}catch(error){alert(error.message)}finally{button.disabled=false}};dialog.showModal()}
async function removeTourist(id){if(!await askDelete('Excluir ponto turístico?','O ponto será removido do guia de Búzios.'))return;const {error}=await supabase.from('tourist_points').delete().eq('id',id);if(error)alert(error.message);else await touristView()}

function videoCard(row){const url=previewPath(row.video_url||row.url||'');return `<article class="video-admin-card"><video src="${esc(url)}" controls playsinline preload="metadata" aria-label="Prévia: ${esc(row.title||'Vídeo')}" muted></video><div class="video-admin-info"><div class="video-admin-heading"><div><h2>${esc(row.title||'Vídeo sem nome')}</h2><p>${esc(row.description||'Sem descrição')}</p></div><span class="video-state ${row.active===false?'is-hidden':''}">${row.active===false?'Oculto':'Publicado'}</span></div><small>Posição ${esc(row.displayPosition??row.position??row.sort_order??'—')}</small><div class="actions"><button data-edit="${esc(row.id)}">Editar vídeo</button><button class="danger" data-del="${esc(row.id)}">Excluir</button></div></div></article>`}
function renderVideoQueue(root,files){root.innerHTML=files.map((item,index)=>`<article class="video-queue-card" data-video-index="${index}"><video src="${esc(item.preview)}" controls playsinline muted></video><div class="video-queue-fields"><label>Título exibido<input data-field="title" value="${esc(item.title)}" required></label><label>Descrição<textarea data-field="description" rows="2" placeholder="Opcional">${esc(item.description)}</textarea></label><label>Posição na lista<input data-field="position" type="number" min="1" step="1" value="${item.position}"></label><button type="button" class="text-danger" data-remove-video="${index}">Remover da seleção</button></div></article>`).join('')}
function wireVideoUpload(data){const input=$('#videoFiles'),send=$('#sendVideos'),previews=$('#videoPreviews'),status=$('#videoStatus');let files=[];input.onchange=()=>{for(const file of input.files)files.push({file,title:file.name.replace(/\.[^.]+$/,''),description:'',position:data.length+files.length+1,preview:URL.createObjectURL(file)});input.value='';renderVideoQueue(previews,files);send.disabled=!files.length;status.textContent=files.length?`${files.length} vídeo(s) selecionado(s). Edite os títulos e a ordem antes de enviar.`:''};previews.oninput=event=>{const card=event.target.closest('[data-video-index]');if(!card)return;const item=files[Number(card.dataset.videoIndex)];item[event.target.dataset.field]=event.target.value};previews.onclick=event=>{const button=event.target.closest('[data-remove-video]');if(!button)return;const index=Number(button.dataset.removeVideo);URL.revokeObjectURL(files[index].preview);files.splice(index,1);files.forEach((item,i)=>item.position=data.length+i+1);renderVideoQueue(previews,files);send.disabled=!files.length;status.textContent=files.length?`${files.length} vídeo(s) selecionado(s).`:''};send.onclick=async()=>{send.disabled=true;let done=0;try{let currentRows=await normalizePositions('videos',data);const queue=[...previews.querySelectorAll('[data-video-index]')].map((card,index)=>{files[index].title=card.querySelector('[data-field="title"]').value.trim();files[index].description=card.querySelector('[data-field="description"]').value.trim();files[index].position=Number(card.querySelector('[data-field="position"]').value)||1;return files[index]}).sort((a,b)=>a.position-b.position);if(queue.some(item=>!item.title))throw new Error('Dê um título para cada vídeo antes de enviar.');for(const item of queue){const safe=(item.title||item.file.name).toLowerCase().replace(/[^a-z0-9._-]+/g,'-')||'video';const path=`videos/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safe}${item.file.name.match(/\.[^.]+$/)?.[0]||'.mp4'}`;const up=await supabase.storage.from('casa-oito-del-mare').upload(path,item.file,{cacheControl:'3600',upsert:false,contentType:item.file.type});if(up.error)throw up.error;const url=supabase.storage.from('casa-oito-del-mare').getPublicUrl(path).data.publicUrl;try{currentRows=await insertAtPosition('videos',{title:item.title||'Vídeo da casa',description:item.description,video_url:url,active:true},item.position,currentRows);done++}catch(error){await supabase.storage.from('casa-oito-del-mare').remove([path]);throw error}}files.forEach(item=>URL.revokeObjectURL(item.preview));await contentTable('videos');$('#videoStatus').textContent=`${done} vídeo(s) adicionado(s) com sucesso.`}catch(error){status.textContent=`Não foi possível enviar os vídeos: ${error.message||error}`;send.disabled=false}}}
function editor(table,row={}){const video=table==='videos',link=table==='links',feature=table==='activities',copy=table==='site_content',sortable=['links','gallery','activities','videos'].includes(table);const pageOptions=cardPages.map(([value,label])=>`<option value="${value}" ${(row.target_section||row.url)===value?'selected':''}>${label}</option>`).join('');const iconOptions=featureIcons.map(([value,label])=>`<option value="${value}" ${row.category===value?'selected':''}>${label}</option>`).join('');$('#view').innerHTML=`<div class="view"><div class="view-head"><div><p class="eyebrow">${esc(labels[table])}</p><h1>${row.id?'Editar':'Novo item'}.</h1><p>${copy?'Preencha uma chave curta para identificar o texto e escolha em qual área do painel ele ficará agrupado. O valor será exibido no site.':video?'Também pode enviar arquivo de vídeo pela seção anterior; este formulário serve para ajustar título, descrição e endereço do vídeo.':'Todos os campos podem ser alterados depois pelo painel.'}</p></div></div><div class="form-card"><div class="form-grid">${copy?`<label>Identificação do texto<input id="fk" value="${esc(row.key||'')}" placeholder="Ex.: hero_tagline" ${row.id?'readonly':''}></label><label>Título no painel<input id="ft" value="${esc(row.title||'')}" placeholder="Ex.: Frase principal"></label><label>Área do site<input id="fs" value="${esc(row.section||'')}" placeholder="Ex.: Início"></label><label>Visível no site<select id="fa"><option value="true" ${row.active!==false?'selected':''}>Sim</option><option value="false" ${row.active===false?'selected':''}>Não</option></select></label><label class="full">Texto exibido<textarea id="fv">${esc(row.value||'')}</textarea></label>`:`<label>Título<input id="ft" value="${esc(row.title||'')}" placeholder="Ex.: A vida à beira-mar"></label>${link?`<label>Destino do card<select id="fu">${pageOptions}</select></label>`:video?`<label class="full">URL do vídeo<input id="fu" value="${esc(row.video_url||row.url||'')}" placeholder="URL pública ou caminho relativo"></label>`:''}<label class="full">Descrição<textarea id="fd">${esc(row.subtitle||row.description||'')}</textarea></label>${feature?`<label>Ícone ilustrativo<select id="fc">${iconOptions}</select></label>`:''}${link?`<label class="full">Imagem do card<input id="fi" value="${esc(row.image_url||'')}" placeholder="URL pública ou caminho relativo"></label>`:''}${sortable?`<label>Posição na lista<input id="fo" type="number" min="1" step="1" value="${esc(row.displayPosition??row.position??row.sort_order??1)}"><small class="muted">Menor número aparece primeiro.</small></label>`:''}<label>Visível no site<select id="fa"><option value="true" ${row.active!==false?'selected':''}>Sim</option><option value="false" ${row.active===false?'selected':''}>Não</option></select></label>`}<div class="form-actions"><button type="button" id="cancel" class="secondary">Cancelar</button><button class="primary" id="save">Salvar</button></div></div></div></div>`;$('#cancel').onclick=()=>contentTable(table);$('#save').onclick=async()=>{let payload;if(copy)payload={key:$('#fk').value.trim(),title:$('#ft').value.trim(),section:$('#fs').value.trim(),value:$('#fv').value,active:$('#fa').value==='true'};else{payload={title:$('#ft').value,description:$('#fd').value,active:$('#fa').value==='true'};if(link){payload.url=$('#fu').value;payload.target_section=$('#fu').value;payload.subtitle=$('#fd').value;payload.image_url=$('#fi').value.trim();delete payload.description}if(video)payload.video_url=$('#fu').value;if(feature)payload.category=$('#fc').value;if(sortable)payload.position=Number($('#fo').value)||1}let result,recordId=row.id;if(row.id)result=await supabase.from(table).update(payload).eq('id',row.id);else{const inserted=await supabase.from(table).insert(payload).select('id').single();result=inserted;recordId=inserted.data?.id}if(result.error)alert(result.error.message);else{try{if(sortable&&recordId)await moveRecordToPosition(table,recordId,payload.position);await contentTable(table)}catch(error){alert(error.message)}}}}
async function remove(table,id){if(!await askDelete('Excluir este item?','Esta ação remove o conteúdo selecionado do site. Quer continuar?'))return;const currentRows=await rows(table);const row=currentRows.find(item=>String(item.id)===String(id));const {error}=await supabase.from(table).delete().eq('id',id);if(error){alert(error.message);return}const url=row?.image_url||row?.video_url||row?.url;const marker='/storage/v1/object/public/casa-oito-del-mare/';if(url?.includes(marker)){const path=decodeURIComponent(url.split(marker)[1]);await supabase.storage.from('casa-oito-del-mare').remove([path])}if(['gallery','videos','links','activities'].includes(table))await normalizePositions(table,currentRows.filter(item=>String(item.id)!==String(id)));if(table==='gallery')await gallery();else await contentTable(table)}
boot();
