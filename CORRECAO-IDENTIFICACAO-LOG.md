# Correção da identificação do LOG

O LOG consultava apenas a claim `app_metadata` presente no JWT da requisição. Em algumas sessões a claim não vinha no formato esperado ou o token era antigo, resultando em "Identificação não disponível".

A nova migração:
1. tenta ler a claim assinada do JWT;
2. se ausente, consulta `auth.users.raw_app_meta_data`, campo que só pode ser alterado pela Admin API do servidor;
3. grava o código interno e o nome correspondente no evento.

Mapeamento:
- `fernandoc8` -> `fernanda` (id interno legado) -> Fernando
- `monicac8` -> Monica
- `camilac8` -> Camila
- `adminc8` -> Administrador

## Publicação obrigatória
1. Execute `supabase/migrations/20261106_fix_admin_audit_actor.sql` no SQL Editor do projeto correto.
2. Publique a função:
   `npx.cmd supabase functions deploy admin-code-login --no-verify-jwt`
3. Faça logout de todos os painéis abertos e entre novamente com o código de cada pessoa. Isso gera sessão/token novo.
4. Faça uma alteração pequena de teste e confira o novo evento.

Registros antigos sem identidade confiável não podem ser reconstruídos. Se duas pessoas usarem simultaneamente a mesma conta compartilhada, o `app_metadata` global da conta pode ser substituído pelo último login; para isolamento perfeito entre sessões simultâneas, cada pessoa precisaria de um usuário Supabase separado ou mecanismo de identidade por sessão dedicado.
