# Melhorias de usabilidade e LOG — 05/11/2026

## Implementado
- Seção **Histórico (LOG)** dentro do submenu Configurações do painel e também dentro de **Mais** na navegação mobile.
- Tela de histórico com registros expansíveis, responsável, data/hora, área, ação, identificador e dados anteriores/posteriores.
- Filtro por área e busca textual; carrega até 250 eventos mais recentes.
- Migração `supabase/migrations/20261105_admin_audit_log.sql` cria a tabela de auditoria, restringe leitura a usuários autenticados e instala gatilhos para `gallery`, `videos`, `links`, `activities`, `site_content`, `tourist_points` e `link_page_settings`. As reservas são parte do JSON `availability` em `link_page_settings` e ficam registradas junto da alteração dessa configuração.
- Indicador global distingue **Carregando** de **Salvando** nas requisições REST do Supabase.
- Confirmação visual de salvamento (toast) nas alterações de conteúdo, página de links/reservas e pontos turísticos; mantém mensagens locais já existentes em uploads e edição de fotos.
- Melhorias mobile para tabelas, formulários, campos, botões e diálogos, com quebra de colunas e rolagem horizontal apenas para tabelas quando necessário.

## Verificações executadas
- `node --check` em `admin.js`, `bottomnav.js` e `loader.js`: aprovado.
- Parser HTML no `admin/index.html`: aprovado; nenhum ID duplicado.
- Verificação estrutural: o LOG está referenciado tanto no submenu Configurações quanto na folha **Mais**; o roteamento `audit_log` está conectado à tela de histórico.
- Não foi possível concluir um teste visual automatizado no Chromium nesta execução. Não foram realizados testes autenticados contra o projeto Supabase real.

## Ativação obrigatória no Supabase
Execute `supabase/migrations/20261105_admin_audit_log.sql` no SQL Editor do mesmo projeto Supabase usado pelo site. Sem essa migração, o item LOG abre uma mensagem orientando a ativação, mas não consegue exibir nem registrar eventos. O histórico começa a partir da execução da migração; não recupera ações anteriores.

## Observações
- A tela consulta os 250 eventos mais recentes e aplica os filtros no navegador.
- A tabela guarda snapshots JSON anteriores e posteriores. Como esses snapshots podem conter dados de reservas (por exemplo, nome e telefone do hóspede), o acesso está restrito a sessões autenticadas.
