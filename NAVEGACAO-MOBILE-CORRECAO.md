# Correção da navegação mobile — 05/11/2026

## Diagnóstico

A bottom navigation era carregada por um script clássico `defer` separado do módulo ES `admin.js`. Isso criava uma inicialização em duas etapas e mantinha a navegação mobile dependente de uma API global/fallback para os botões da sidebar. Além disso, as telas são renderizadas com consultas assíncronas ao Supabase; uma renderização iniciada antes podia terminar depois de uma navegação mais recente e sobrescrever o conteúdo, deixando o destaque da aba diferente da tela exibida.

## Alterações

- A bottom navigation agora é um módulo importado diretamente por `admin.js` e inicializado somente depois que a função central de navegação existe.
- Removido o fallback que simulava clique em botões da sidebar escondida no mobile.
- A navegação continua usando a função central `navigateAdminView`, que atualiza a tela e o estado ativo.
- Renderizações assíncronas foram serializadas com coalescência para manter apenas a solicitação de tela mais recente. Uma consulta antiga não consegue mais terminar depois e substituir a tela escolhida mais recentemente.
- Atualizada a versão de cache dos arquivos JS/CSS no HTML para evitar servir a implementação antiga após deploy.
- Reforçada a cor champanhe/dourada no texto e no ícone da aba ativa.
- Mantido o comportamento desktop; a barra inferior permanece restrita a telas de até 850px.

## Verificações realizadas

- `node --check` em todos os arquivos JavaScript do projeto: aprovado.
- Parser HTML no `admin/index.html`: aprovado.
- Conferência estática de que o script clássico duplicado da bottom navigation foi removido e de que o módulo é importado pelo `admin.js`: aprovado.

## Limitação

Não foi possível concluir um teste visual de navegador/iPhone nem autenticar no Supabase de produção nesta execução. O teste real após deploy deve confirmar: Início, Reservas, Fotos, Vídeos, Mais e LOG; e verificar que texto e ícone da aba ativa ficam champanhe/dourados.
