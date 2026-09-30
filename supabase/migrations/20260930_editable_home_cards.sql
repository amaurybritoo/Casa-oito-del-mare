-- Casa Oito Del Mare: migração compatível com o esquema informado pelo usuário.
-- Pode ser executada novamente: os registros iniciais são inseridos sem duplicar itens.

-- Cards da página inicial: links.title, subtitle, url, target_section, image_url, position.
insert into public.links (title, subtitle, link_type, url, target_section, image_url, position, active)
select seed.title, seed.subtitle, 'internal', seed.route, seed.route, seed.image_url, seed.position, true
from (values
  ('Por dentro da Casa', 'Uma casa feita para receber bem, com espaços acolhedores e um jeitinho de casa de família.', 'casa', './assets/gallery/casa-04.jpg', 10),
  ('A vida à beira-mar', 'Praia calma em frente, jardim, piscina e uma rotina sem pressa.', 'estrutura', './assets/gallery/detalhe-03.jpg', 20),
  ('Búzios em movimento', 'Sol, mar e um horizonte que pede mais um dia.', 'buzios', './assets/gallery/detalhe-13.jpg', 30),
  ('Sua estadia começa aqui', 'Consulte datas e converse diretamente com as proprietárias.', 'reserva', './assets/gallery/casa-01.jpg', 40)
) as seed(title, subtitle, route, image_url, position)
where not exists (
  select 1 from public.links existing
  where coalesce(existing.target_section, existing.url) = seed.route
);

-- Completa somente cards vazios; preserva nomes, textos e ordem já editados.
update public.links as existing
set subtitle = seed.subtitle,
    position = case when existing.position = 0 then seed.position else existing.position end
from (values
  ('casa', 'Uma casa feita para receber bem, com espaços acolhedores e um jeitinho de casa de família.', 10),
  ('estrutura', 'Praia calma em frente, jardim, piscina e uma rotina sem pressa.', 20),
  ('buzios', 'Sol, mar e um horizonte que pede mais um dia.', 30),
  ('reserva', 'Consulte datas e converse diretamente com as proprietárias.', 40)
) as seed(route, subtitle, position)
where coalesce(existing.target_section, existing.url) = seed.route
  and coalesce(existing.subtitle, '') = '';

update public.links
set title = 'Búzios em movimento'
where coalesce(target_section, url) = 'buzios' and title = 'Búzios à sua espera';

-- Fotos: gallery usa position (não sort_order).
insert into public.gallery (title, description, image_url, position, active)
select seed.title, '', seed.image_url, seed.position, true
from (values
  ('Sala de estar', './assets/gallery/casa-04.jpg', 10),
  ('Sala de jantar', './assets/gallery/casa-01.jpg', 20),
  ('Cozinha', './assets/gallery/casa-02.jpg', 30),
  ('Quarto', './assets/gallery/casa-03.jpg', 40),
  ('Jardim e fachada', './assets/gallery/casa-05.jpg', 50),
  ('Quarto', './assets/gallery/casa-06.jpg', 60),
  ('Detalhes do quarto', './assets/gallery/casa-07.jpg', 70),
  ('Banheiro', './assets/gallery/casa-08.jpg', 80),
  ('Banheiro', './assets/gallery/casa-09.jpg', 90),
  ('Quarto', './assets/gallery/casa-10.jpg', 100),
  ('Banheiro da suíte', './assets/gallery/casa-11.jpg', 110),
  ('Sala de TV', './assets/gallery/casa-12.jpg', 120),
  ('Quarto', './assets/gallery/casa-13.jpg', 130),
  ('Jardim com vista para o mar', './assets/gallery/detalhe-03.jpg', 140),
  ('Mar em frente à casa', './assets/gallery/detalhe-04.jpg', 150),
  ('Fachada', './assets/gallery/detalhe-05.jpg', 160),
  ('Praia em frente', './assets/gallery/detalhe-07.jpg', 170),
  ('Varanda e mar', './assets/gallery/detalhe-11.jpg', 180),
  ('Praia de Búzios', './assets/gallery/detalhe-13.jpg', 190),
  ('Sala de estar', './assets/gallery/detalhe-14.jpg', 200),
  ('Fachada entre coqueiros', './assets/gallery/detalhe-16.jpg', 210),
  ('Sala de jantar', './assets/gallery/detalhe-17.jpg', 220),
  ('Mar em Búzios', './assets/gallery/casa-14.jpg', 230),
  ('Detalhes de Búzios', './assets/gallery/detalhe-01.jpg', 240),
  ('Entrada da casa', './assets/gallery/detalhe-02.jpg', 250),
  ('Piscina do condomínio', './assets/gallery/detalhe-06.jpg', 260),
  ('Pássaros sobre o mar', './assets/gallery/detalhe-08.jpg', 270),
  ('Pôr do sol em Búzios', './assets/gallery/detalhe-09.jpg', 280),
  ('Sala com vista para o jardim', './assets/gallery/detalhe-10.jpg', 290),
  ('Stand up paddle em Búzios', './assets/gallery/detalhe-12.jpg', 300),
  ('Suíte com varanda', './assets/gallery/detalhe-15.jpg', 310)
) as seed(title, image_url, position)
where not exists (select 1 from public.gallery existing where existing.image_url = seed.image_url);

-- Comodidades: activities também usa position.
insert into public.activities (title, description, category, position, active)
select seed.title, seed.description, seed.category, seed.position, true
from (values
  ('4 quartos, até 8 hóspedes', 'São 3 suítes e 1 quarto com banheiro anexo, que também atende como banheiro social.', 'quartos', 10),
  ('A poucos passos do mar', 'Praia calma, sem ondas, em frente à casa — boa para crianças, stand up e canoa.', 'praia', 20),
  ('Funcionária incluída', 'Limpeza e cozinha já incluídas no valor da diária.', 'limpeza', 30),
  ('Churrasqueira e área gourmet', 'Estrutura para almoços longos, do churrasco aos frutos do mar.', 'gourmet', 40),
  ('Piscina e sauna', 'Estrutura do condomínio, de frente para o gramado.', 'piscina', 50),
  ('Wi-Fi e Smart TV', 'Internet em toda a casa e Smart TV para o fim do dia.', 'wifi', 60),
  ('3 vagas de garagem', 'Vagas dentro do condomínio.', 'carro', 70),
  ('Pets bem-vindos', 'Nas áreas comuns, sempre de coleira.', 'pets', 80),
  ('Check-in e check-out', 'Horários a combinar com o proprietário.', 'horario', 90)
) as seed(title, description, category, position)
where not exists (select 1 from public.activities existing where existing.category = seed.category);

-- Vídeos do esquema enviado: a coluna correta é video_url e a ordem é position.
insert into public.videos (title, description, video_url, position, active)
select seed.title, seed.description, seed.video_url, seed.position, true
from (values
  ('Búzios 1', 'Casa Oito Del Mare e Búzios.', './assets/videos/buzios-01.mp4', 10),
  ('Búzios 2', 'Casa Oito Del Mare e Búzios.', './assets/videos/buzios-02.mp4', 20),
  ('Búzios 3', 'Casa Oito Del Mare e Búzios.', './assets/videos/buzios-03.mp4', 30),
  ('Búzios 4', 'Casa Oito Del Mare e Búzios.', './assets/videos/buzios-04.mp4', 40)
) as seed(title, description, video_url, position)
where not exists (select 1 from public.videos existing where existing.video_url = seed.video_url);

-- Textos editáveis pelo painel.
create table if not exists public.site_content (
  id bigint generated by default as identity primary key,
  key text not null unique,
  title text not null,
  value text not null default '',
  section text not null default 'Geral',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
drop policy if exists "Public can read active site content" on public.site_content;
create policy "Public can read active site content" on public.site_content
  for select to anon, authenticated using (active = true);
drop policy if exists "Authenticated can manage site content" on public.site_content;
create policy "Authenticated can manage site content" on public.site_content
  for all to authenticated using (true) with check (true);
insert into public.site_content (key,title,value,section,active) values
 ('hero_tagline','Frase de abertura','O mar logo ali. O tempo, todo seu.','Início',true),
 ('intro_eyebrow','Chamada da apresentação','UM REFÚGIO DE FAMÍLIA','Início',true),
 ('intro_body','Texto de apresentação','Há mais de quinze anos, a Casa Oito é o refúgio de uma família. Um lugar de silêncio, mar calmo e dias inteiros sem pressa — para chegar, respirar fundo e se sentir em casa.','Início',true),
 ('intro_link','Link da apresentação','Conheça cada cantinho','Início',true),
 ('quote_text','Frase de destaque','“É praticamente obrigatório caminhar nessa praia de manhã.”','Início',true),
 ('footer_eyebrow','Chamada do rodapé','O MAR JÁ ESTÁ ESPERANDO','Rodapé',true),
 ('footer_title','Título do rodapé','Seu próximo dia leve.','Rodapé',true),
 ('drawer_casa_title','Título · A casa','Por dentro da Casa Oito.','A casa',true),
 ('drawer_casa_body','Apresentação · A casa','Os espaços da casa, os detalhes de família e a paisagem que dá vontade de ficar mais um pouco.','A casa',true),
 ('drawer_structure_title','Título · Estrutura','Conforto de casa, pé na areia.','A experiência',true),
 ('drawer_structure_body','Apresentação · Estrutura','A Casa Oito recebe famílias com comodidade e simplicidade. A praia em frente e as áreas do condomínio completam os dias de descanso.','A experiência',true),
 ('drawer_structure_note','Frase · Estrutura','Quinze anos de histórias de família, cuidados e manhãs que começam com o som do mar.','A experiência',true),
 ('drawer_buzios_title','Título · Búzios','Búzios em movimento.','Búzios',true),
 ('drawer_buzios_body','Apresentação · Búzios','Armação dos Búzios, Rio de Janeiro. A Casa Oito fica à beira-mar, num condomínio familiar e tranquilo. A praia em frente é praticamente exclusiva dos condomínios, com poucas entradas.','Búzios',true),
 ('drawer_reserve_title','Título · Reservas','Venha viver essa experiência.','Reservas',true),
 ('drawer_reserve_body','Apresentação · Reservas','Consulte datas, tire dúvidas e combine sua estadia diretamente com as proprietárias.','Reservas',true),
 ('drawer_privacy','Informação de privacidade','O condomínio é familiar e tranquilo. Para preservar a privacidade, o endereço completo é informado no momento da reserva. Check-in e check-out são combinados com as proprietárias.','Reservas',true)
on conflict (key) do nothing;

-- O esquema enviado só tinha leitura pública. O painel autenticado precisa editar seus próprios conteúdos.
-- Estas políticas concedem escrita apenas a usuários autenticados do projeto Supabase.
do $$ declare t text; begin
  foreach t in array array['links','gallery','activities','videos'] loop
    execute format('drop policy if exists %I on public.%I', 'Authenticated can manage ' || t, t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', 'Authenticated can manage ' || t, t);
  end loop;
end $$;

notify pgrst, 'reload schema';
