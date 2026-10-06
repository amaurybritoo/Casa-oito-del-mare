# Casa Oito Del Mare — Links Configurável v3

Base: versão estável MOBILE-GIF-FINAL + página de links configurável.

## Alterações desta versão
- Pontos turísticos viraram um card dentro da lista principal; não existe mais a aba Búzios.
- Cards de turismo possuem botões Abrir no Maps e TripAdvisor.
- TripAdvisor é configurável pelo Admin e existe fallback de busca automática.
- Capa da página de links virou carrossel com setas, dots, autoplay e gesto de swipe no mobile.
- Carrossel da capa usa, quando disponíveis, as fotos marcadas como `in_carousel` na galeria; caso contrário usa fotos locais.
- Cards da página de links receberam hierarquia visual e acabamento premium/zen.
- Migração atualiza `tourist_points.tripadvisor_url` e garante imagem no card de turismo.

## Banco
Você já pode ter executado a migração anterior. Rode novamente:
`supabase/migrations/20261001_links_page_and_tourism.sql`

Ela usa `ADD COLUMN IF NOT EXISTS` para `tripadvisor_url` e atualiza os dados sem apagar os existentes.


V4: visual premium clean na página de links, sem bordas decorativas e carrossel de capa automático, sem setas/indicadores.


## Links v5
- Visual premium sem bordas e sem faixa azul separada.
- Carrossel de capa somente automático.
- Card de Pontos turísticos abre o guia.
- Card de estadia abre calendário com datas reservadas configuráveis.
- Admin: Página de links > Configurar estadia.

## Métricas do painel
- A migração `supabase/migrations/20261002_site_analytics.sql` cria o registro anônimo de visitas e cliques no WhatsApp. Execute o SQL uma vez no SQL Editor do Supabase antes de publicar os arquivos.
- A tabela guarda somente tipo de evento, página e data. Os totais da Visão geral contam o ano corrente, desde 1º de janeiro, e começam após a ativação; a contagem reinicia no primeiro dia de cada ano.
- O indicador Agendamentos conta estadias marcadas como Pré-reserva ou Reservado no calendário do Admin; períodos Bloqueados ficam fora.
- Para habilitar o reset dos indicadores por pressão contínua de 30 segundos, execute uma vez `supabase/migrations/20261005_reset_site_analytics.sql` no SQL Editor do Supabase. O reset apaga apenas os eventos do ano atual.


## Ajustes de 06/10/2026
- Botão direito, seleção/cópia e zoom ficam bloqueados somente em telas de toque (celular/tablet). No desktop tudo funciona normalmente.
- Maré dos cards: sem rotação/escala no card, sem desfoque de fundo e com a posição do dedo avaliada uma vez por quadro. Elevação por :hover só para mouse.
- Carrossel da capa: a foto que sai fica opaca por baixo até a nova terminar de aparecer (some a faixa clara); o carrossel só avança quando a próxima foto já carregou.
- Admin > Reservas > Editar > Alterar período: mesmas regras de clique do cadastro (1º entrada, 2º saída, 3º clique na mesma data limpa, conflito mostra aviso) e feriados nacionais/RJ marcados, com o aviso do feriado ao tocar.
