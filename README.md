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
