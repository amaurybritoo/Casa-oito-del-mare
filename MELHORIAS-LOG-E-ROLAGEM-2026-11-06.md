# Melhorias no histórico e na agenda mobile — 06/11/2026

## Histórico administrativo (LOG)
- A tela agora apresenta ações em português simples: criou, editou e excluiu.
- Cada item mostra responsável, código de acesso identificado, data/hora, área e registro afetado.
- Alterações exibem valores anteriores e novos em blocos legíveis; criação e exclusão mostram os dados disponíveis.
- Eventos antigos sem identidade vinculada aparecem como “Identificação não disponível”. Nenhuma identidade antiga é presumida.
- A identidade é adicionada pelo servidor em `app_metadata.access_code_id` após validar o código. O trigger PostgreSQL lê essa claim do JWT assinado; não confia em nome/código enviado pelo navegador.

## Agenda no celular
- A grade do calendário principal deixa de bloquear o gesto vertical (`touch-action: pan-y`).
- O gesto vertical não chama `preventDefault`; a seleção por toque e os gestos horizontais/arraste permanecem tratados pelo código existente.
- A regra é limitada à grade principal; o seletor de datas dos formulários mantém o comportamento próprio.

## Publicação necessária no Supabase
1. No SQL Editor do projeto `jkrexqaroxbcjvqiaggm`, execute novamente o arquivo `supabase/migrations/20261105_admin_audit_log.sql`. Ele é idempotente e adiciona as colunas de identificação que faltavam.
2. Publique novamente a função:
   `npx.cmd supabase functions deploy admin-code-login --no-verify-jwt`
3. A função usa `SUPABASE_SERVICE_ROLE_KEY`, secret disponibilizado no ambiente padrão das Edge Functions do Supabase. Não crie nem exponha essa chave no navegador.
4. Faça logout e login novamente com cada código para emitir um JWT com a identidade correspondente.

## Observações
- Os registros antigos não têm como recuperar com segurança qual código foi usado; aparecerão como “Identificação não disponível”.
- Como as quatro entradas compartilham a mesma conta Auth, a função atualiza `app_metadata` no momento do login e emite a sessão imediatamente depois. Cada JWT emitido contém a identidade assinada daquele acesso. Evite sessões simultâneas com códigos diferentes na mesma conta, pois a metadata da conta é compartilhada; sessões já emitidas mantêm suas claims até renovação do token.
- A rolagem foi ajustada por inspeção do fluxo de eventos e CSS. Não foi possível executar teste físico em iPhone nesta sessão.
