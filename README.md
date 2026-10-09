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

## Tutorial guiado das Reservas (admin/tour.js)
- O convite ao tutorial vem dentro da janela de boas-vindas ("Iniciar tutorial" / "Pular por agora" + caixa "Não mostrar esta mensagem nem o tutorial novamente"). Pode ser repetido no botão "▶ Tutorial guiado", no alto da página de Reservas.
- Estilo "jogo": 10 passos, um destaque por vez com anel, mão apontando, instrução curta e uma caixa "Entenda" explicando o campo. Avança sozinho quando a ação é feita; campos de texto têm botão OK (ou "Preencher exemplo").
- Cobre: criar reserva, ver detalhes/WhatsApp, alterar período, editar informações, pré-reserva (sinal + restante no check-in) e excluir.
- SIMULAÇÃO: nada é gravado no Supabase (persist() respeita window.__casaTour.sandbox), a agenda começa vazia (reservas reais não aparecem) e só o alvo destacado responde a toques/teclas. A agenda real é recarregada ao terminar ou pular.

## v29 — calendários unificados, correções e performance
**Calendários.** Painel (Reservas), seletor de período da edição de reserva e página de links usam agora o mesmo visual e a mesma legenda. Todo o estilo mora em `css/calendar.css` (carregado depois de `admin.css` e `links.css`); para ajustar cores, tamanhos ou legenda, mexa só nele.

**Corrigido (já estava quebrado na v28):**
- Página de links: tocar numa data não selecionava nada no Chrome/Android/desktop (captura de ponteiro no `pointerdown` redirecionava o clique).
- Página de links: arrastar com toque longo nunca funcionava (regex de data com barras duplicadas).
- Painel > Reservas: os gestos (toque longo + arraste para escolher período, deslizar para trocar de mês) nunca eram ligados, porque o código rodava antes de o calendário existir; no celular o arraste também perdia os eventos quando a grade era redesenhada.
- Painel > Reservas, mouse: o clique era redirecionado pela captura de ponteiro e não selecionava a data.
- Aviso "datas acabaram de ser reservadas" ignorava a mensagem passada.
- Título do mês saía como "Outubro De 2026".

**Performance.**
- Home: o GIF de 3,7 MB (inclusive no desktop, onde nem aparece) e o vídeo de 2,5 MB deixaram de baixar no carregamento; agora só quando o rodapé chega perto da tela. Desktop nunca baixa o GIF.
- Página de links: o SDK do Supabase deixou de ser importação fixa (a página não espera mais o CDN para executar); mapa de datas em cache.
- Painel: fontes por `<link>` (sem `@import` bloqueante), regras antigas de calendário e de boas-vindas removidas do `admin.css` (o bloco `<style id="admin-critical-style">` do `admin/index.html` foi mantido como na v28 porque a cascata do celular depende dele), lista de reservas só é refeita quando as reservas mudam, eventos do calendário ligados uma única vez. Caminhos do admin agora são relativos.

**Tutorial guiado.** Testado de ponta a ponta (12 passos, celular e desktop): conclui sem erros e sem gravar nada na agenda. Não foi alterado.

**Tela de boas-vindas.** Redesenhada em `admin/welcome.css` (arquivo único; as cinco camadas de CSS antigas foram removidas do `admin.css`): cabeçalho centralizado com emblema, as três áreas lado a lado no desktop, cartão do tutorial, opção "não mostrar" e botões num rodapé fixo (a parte de cima rola; os botões ficam sempre visíveis). No celular os botões ficam empilhados.

**Importante para publicar.** Em `admin/index.html` os CSS são carregados por caminho absoluto (`/admin/admin.css`, `/admin/overview.css`, `/admin/welcome.css`, `/css/calendar.css`). Não troque por `./...`: em hospedagens com URLs limpas o painel abre em `/admin` (sem barra final) e um caminho relativo vira `/admin.css`, que não existe — o painel fica sem CSS (só aparece o estilo embutido no HTML). Por isso também existe o `admin.js` na raiz (ele repassa para `admin/admin.js`). Ao publicar, envie a pasta inteira, incluindo os arquivos novos `css/calendar.css` e `admin/welcome.css`.

## v29 (ajustes finais) — arraste entre meses, boas-vindas e tutorial no celular, mobile
- **Arrastar para escolher período:** durante o arraste (calendário do painel, seletor de período da edição de reserva e página de links) o mês **não troca** se houver data reservada, pré-reservada ou bloqueada entre o início da seleção e o outro mês. O celular vibra de leve (sem aviso na tela). Sem reserva no caminho, a troca de mês continua funcionando.
- **Boas-vindas no celular:** folha ancorada embaixo, compacta (cabeçalho em linha, três áreas em colunas, cartão do tutorial, botão grande "Começar tutorial" e "Pular por agora" como link). Tudo cabe sem rolar na maioria dos aparelhos.
- **Tutorial no celular:** o bloco "Entenda o passo" fica recolhido (toque para abrir), então o cartão ocupa bem menos tela e deixa o calendário visível; botões maiores; animação do destaque mais leve.
- **Mobile em geral:** sem atraso de toque nos botões; desfoque de fundo (caro no celular) desligado em janelas e menus; SDK do Supabase começa a baixar mais cedo na página de links; mídia pesada do rodapé da home só baixa quando perto da tela.

## v29 (rodada final) — confete, datas da home, vídeo mobile, WhatsApp
- **Tutorial:** o fundo escurece em **todo** cartão de "Próximo passo" (antes não escurecia nos passos sem janela aberta). Confete refeito: arco com gravidade e arrasto, giro em 3D, peças variadas (retângulos, fitas, círculos, estrelas, faíscas), clarão ao redor do cartão e uma segunda leva; leve no celular (menos peças) e desligado se o aparelho pedir menos animação.
- **Aviso "Não dá para trocar de mês" removido** (o bloqueio continua; só a vibração discreta no Android).
- **Home — datas da estadia:** os campos Entrada/Saída agora abrem um calendário próprio (`js/stay-picker.js`), igual ao do painel e da página de links, com datas reservadas, pré-reservadas e bloqueadas marcadas e não selecionáveis; período com data ocupada no meio é recusado. Se o seletor não carregar, volta ao calendário nativo do navegador. A disponibilidade vem da mesma tabela `link_page_settings` da página de links.
- **Rodapé no celular:** o GIF de 3,7 MB (8 fps) foi trocado por vídeo leve de 536 KB a 30 fps (`assets/videos/buzios-footer-loop-mobile.mp4`), que só baixa perto do rodapé e pausa fora da tela. Se o autoplay for bloqueado (ex.: Modo de Pouca Energia do iPhone), entra um WebP animado (`assets/gif/buzios-footer-loop-mobile.webp`, 24 fps). O GIF antigo foi removido.
- **Botão do WhatsApp:** anéis que se expandem, "respiração" e balanço periódico do ícone (só transform/opacidade, leve no celular).

## v29 (home) — barra única de data/período
No formulário da home, os campos Entrada e Saída viraram **uma única barra de largura total** (`#stayDateBar`). Tocar nela abre o calendário (`js/stay-picker.js`, mesmo visual do painel e da página de links; datas reservadas/pré-reservadas/bloqueadas marcadas e não selecionáveis):
- **1 toque** em uma data = **diária**; a barra mostra "DIÁRIA 16/10/2026".
- **2 toques** = **período**; a barra mostra "ENTRADA 16/10/2026 → SAÍDA 19/10/2026" com o número de noites.
- Os campos `checkin`/`checkout` continuam existindo (ocultos) e a mensagem do WhatsApp segue igual. Se o seletor não carregar, a página volta a usar dois campos de data nativos.
