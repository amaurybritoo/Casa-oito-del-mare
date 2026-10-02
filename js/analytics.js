import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

const endpoint = `${SUPABASE_URL}/rest/v1/rpc/record_site_event`;

export function recordSiteEvent(eventType, page) {
  if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_')) return;
  fetch(endpoint, {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_event_type: eventType, p_page: page })
  }).catch(() => {});
}

export function trackPageVisit(page) {
  const key = `casa-oito-visit:${page}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {}
  recordSiteEvent('visit', page);
}

export function trackWhatsappLinks(page) {
  document.addEventListener('click', event => {
    if (!event.defaultPrevented && event.target.closest('a[href*="wa.me/"]')) recordSiteEvent('whatsapp_click', page);
  });
}
