// Ícones disponíveis para os cards da página de links (usado pelo site e pelo painel).
const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

export const CARD_ICONS = {
  home:      { label: 'Casa',       svg: svg('<path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>') },
  calendar:  { label: 'Calendário', svg: svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M13 14h3M8 17h3"/>') },
  tourism:   { label: 'Local',      svg: svg('<path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/>') },
  map:       { label: 'Mapa',       svg: svg('<path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z"/><path d="M9 4v14M15 6v14"/>') },
  instagram: { label: 'Instagram',  svg: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.8" r="1"/>') },
  whatsapp:  { label: 'WhatsApp',   svg: svg('<path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"/><path d="M8.7 9.2c.2-.4.5-.5.8-.3l1 .8c.3.2.3.5.1.8l-.5.7c.7 1.1 1.6 2 2.7 2.7l.7-.5c.3-.2.6-.2.8.1l.8 1c.2.3.1.6-.3.8-.6.3-1.3.4-2 .2-2.5-.8-4.6-2.9-5.4-5.4-.2-.7-.1-1.4.2-2Z"/>') },
  contact:   { label: 'Conversa',   svg: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H12l-4.8 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"/><path d="M8 8h8M8 11h5"/>') },
  phone:     { label: 'Telefone',   svg: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>') },
  mail:      { label: 'E-mail',     svg: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>') },
  gallery:   { label: 'Fotos',      svg: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/>') },
  waves:     { label: 'Mar',        svg: svg('<path d="M3 9c2 0 2-2 4.5-2S10 9 12 9s2.5-2 4.5-2S19 9 21 9"/><path d="M3 14c2 0 2-2 4.5-2S10 14 12 14s2.5-2 4.5-2S19 14 21 14"/><path d="M3 19c2 0 2-2 4.5-2S10 19 12 19s2.5-2 4.5-2S19 19 21 19"/>') },
  star:      { label: 'Destaque',   svg: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>') },
  heart:     { label: 'Favorito',   svg: svg('<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11Z"/>') },
  link:      { label: 'Link',       svg: svg('<path d="M10 13.8 8.5 15.3a3.5 3.5 0 1 1-5-5l3-3a3.5 3.5 0 0 1 5 0M14 10.2l1.5-1.5a3.5 3.5 0 1 1 5 5l-3 3a3.5 3.5 0 0 1-5 0M8.5 12h7"/>') }
};

export const cardIconSvg = key => (CARD_ICONS[key] || CARD_ICONS.link).svg;
export const isCardIcon = key => Object.prototype.hasOwnProperty.call(CARD_ICONS, key);

// Ícone padrão quando o card ainda não tem um escolhido.
export function defaultCardIcon(card = {}, resolvedType = 'link') {
  const title = String(card.title || '').toLowerCase();
  if (card.type === 'home' || /conheça a casa|conhecer a casa/.test(title)) return 'home';
  if (/consult|disponib/.test(title) || resolvedType === 'whatsapp') return 'calendar';
  if (resolvedType === 'contact') return 'whatsapp';
  return isCardIcon(resolvedType) ? resolvedType : 'link';
}

// Ícone final do card: o escolhido no painel, ou o padrão.
export function resolveCardIcon(card = {}, resolvedType = 'link') {
  return isCardIcon(card.icon) ? card.icon : defaultCardIcon(card, resolvedType);
}
