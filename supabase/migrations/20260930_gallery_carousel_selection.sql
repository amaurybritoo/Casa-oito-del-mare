-- Selecione quais fotos entram no carrossel principal da página inicial.
-- Execute uma vez no Supabase SQL Editor. As fotos que já estavam no carrossel começam marcadas.
alter table public.gallery
  add column if not exists in_carousel boolean not null default false;

-- Completa a galeria com as nove fotos originais que faltavam do arquivo src.
-- O INSERT pode ser repetido sem criar duplicatas e coloca as imagens novas no final.
insert into public.gallery (title, description, image_url, position, active)
select seed.title, seed.description, seed.image_url,
       coalesce((select max(position) from public.gallery), 0) + seed.row_offset,
       true
from (values
  ('Mar em Búzios', 'Um recorte do mar e das atividades à beira-mar.', './assets/gallery/casa-14.jpg', 10),
  ('Detalhes de Búzios', 'Um pequeno registro das lembranças do destino.', './assets/gallery/detalhe-01.jpg', 20),
  ('Entrada da casa', 'Detalhes acolhedores que dão boas-vindas.', './assets/gallery/detalhe-02.jpg', 30),
  ('Piscina do condomínio', 'Um convite para aproveitar os dias de sol.', './assets/gallery/detalhe-06.jpg', 40),
  ('Pássaros sobre o mar', 'A natureza e a tranquilidade de Búzios.', './assets/gallery/detalhe-08.jpg', 50),
  ('Pôr do sol em Búzios', 'O fim de tarde visto da região da casa.', './assets/gallery/detalhe-09.jpg', 60),
  ('Sala com vista para o jardim', 'Um cantinho para relaxar entre um passeio e outro.', './assets/gallery/detalhe-10.jpg', 70),
  ('Stand up paddle em Búzios', 'O mar calmo também convida a remar.', './assets/gallery/detalhe-12.jpg', 80),
  ('Suíte com varanda', 'Um dos ambientes acolhedores da casa.', './assets/gallery/detalhe-15.jpg', 90)
) as seed(title, description, image_url, row_offset)
where not exists (
  select 1 from public.gallery existing where existing.image_url = seed.image_url
);

-- Mantém marcadas as quatro imagens que já compunham o carrossel.
update public.gallery
set in_carousel = true
where image_url in (
  './assets/gallery/detalhe-03.jpg',
  './assets/gallery/detalhe-11.jpg',
  './assets/gallery/detalhe-13.jpg',
  './assets/gallery/casa-05.jpg'
);



-- Exibe posições curtas e consecutivas no painel, preservando a ordem atual.
with ordered as (select id, row_number() over (order by position, id) as new_position from public.gallery)
update public.gallery as item set position=ordered.new_position from ordered where item.id=ordered.id and item.position is distinct from ordered.new_position;
with ordered as (select id, row_number() over (order by position, id) as new_position from public.links)
update public.links as item set position=ordered.new_position from ordered where item.id=ordered.id and item.position is distinct from ordered.new_position;
with ordered as (select id, row_number() over (order by position, id) as new_position from public.activities)
update public.activities as item set position=ordered.new_position from ordered where item.id=ordered.id and item.position is distinct from ordered.new_position;
with ordered as (select id, row_number() over (order by position, id) as new_position from public.videos)
update public.videos as item set position=ordered.new_position from ordered where item.id=ordered.id and item.position is distinct from ordered.new_position;

notify pgrst, 'reload schema';


