# Atualização do Histórico Administrativo — 06/11/2026

## Interface
- Adicionado filtro de LOG por responsável (Fernando, Monica, Camila, Administrador e identificação indisponível).
- Melhorada a leitura: linguagem simples, tipografia maior, espaçamento e cartões com antes/depois.
- O botão Atualizar histórico mantém a ação normal com toque/clique curto. Pressionar continuamente por 20 segundos abre uma confirmação adicional para limpeza.

## Identificação
- `fernandoc8` corresponde a Fernando (não Fernanda).
- O identificador interno `fernanda` permanece por compatibilidade com sessões existentes; o nome apresentado no LOG é Fernando.
- O painel exibe rótulos de identificação (“Código Fernando”, etc.) em vez de revelar o segredo literal de autenticação no histórico. Exibir o código secreto em texto claro permitiria que qualquer pessoa com acesso ao LOG reutilizasse as credenciais.
- Registros antigos que não têm identidade assinada continuam como “Identificação não disponível”. Não é possível reconstruir com segurança quem os fez.

## Supabase — necessário antes de usar a limpeza
Execute no SQL Editor, no projeto `jkrexqaroxbcjvqiaggm`, o arquivo:
`supabase/migrations/20261106_admin_audit_purge.sql`

A função `admin_purge_audit_log()` exige `app_metadata.access_code_id = 'admin'`, apaga os registros e grava uma evidência separada em `admin_audit_purge_events`. O cliente não recebe permissão direta de DELETE.

## Limites importantes
- A tela pode mostrar os novos filtros imediatamente após publicar o frontend.
- A limpeza só funcionará após aplicar a migração SQL e entrar novamente com `adminc8`.
- A identificação das novas ações depende de publicar `admin-code-login` e fazer novo login para obter JWT atualizado. Execute:
  `npx.cmd supabase functions deploy admin-code-login --no-verify-jwt`
- Atribuição retroativa dos registros antigos não é possível quando o banco não guardou a identidade na época.
- Não foram executados testes visuais em dispositivo físico nem testes contra o projeto Supabase de produção.
