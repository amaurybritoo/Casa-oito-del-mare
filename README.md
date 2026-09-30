# Casa Oito Del Mare

Site da Casa Oito Del Mare com as fotos e os vídeos recebidos, identidade visual renovada, galeria ampliável e cards editáveis, textos administráveis, envio de fotos e vídeos pelo painel, ondas animadas e formulário de contato.

## Abrir localmente

Na pasta do projeto, inicie um servidor local com Python (`python -m http.server 5500`) e acesse `http://localhost:5500/`. Para o painel, acesse `http://localhost:5500/admin/`. Os navegadores não carregam os módulos do projeto ao abrir o HTML diretamente como `file://`.

## Ativar a edição no painel

O painel usa o projeto Supabase que já está configurado em `js/config.js`. Para carregar as fotos, vídeos, textos, comodidades e cards que já acompanham este projeto — e habilitar a ordenação — execute o arquivo atualizado `supabase/migrations/20260930_editable_home_cards.sql` no SQL Editor desse mesmo projeto Supabase. A migração é repetível: pode executá-la novamente se a versão anterior foi usada. Ela segue o esquema que você enviou: cards usam `subtitle`, `target_section` e `position`; fotos e comodidades usam `position`; vídeos usam `video_url` e `position`. Não tenta gravar `description` em `links`, `sort_order` nas tabelas nem `url` em `videos`. Também cria `public.site_content`, importa os registros iniciais, habilita edição por contas autenticadas e solicita atualização do catálogo da API. Após a mensagem de sucesso, volte ao painel e recarregue. Entre com a conta administrativa já cadastrada.

No painel, **Cards da página inicial** permite alterar títulos, descrições, destinos, imagens e posição. **Galeria da casa** permite editar nomes, descrições, posição e visibilidade das fotos. **Comodidades da casa** controla os destaques da estadia; **Vídeos da casa** permite editar título, descrição, ordem e visibilidade, além de enviar vídeos MP4 ou WebM do dispositivo. **Textos do site** lista os textos cadastrados para edição e exclusão. Se aparecer `Could not find the table public.site_content in the schema cache`, execute o arquivo SQL atualizado por inteiro no projeto Supabase usado em `js/config.js`, aguarde a conclusão e atualize o painel. Se você já tentou a migração antiga, use esta versão completa: ela foi reescrita para corresponder às colunas do seu schema colado. Não crie a tabela manualmente. O painel explica as ações e a ordenação; itens ocultos permanecem salvos. Há um botão “Ir para o site” no painel; no site, o botão flutuante do WhatsApp abre uma conversa com a Mônica. A chuva de logos foi removida.

## Informações confirmadas

- 4 quartos (3 suítes e 1 quarto com banheiro anexo), para até 8 hóspedes.
- Casa à beira-mar; praia calma em frente.
- Funcionária, limpeza e cozinha incluídas no valor da diária.
- Churrasqueira e área gourmet, Wi-Fi, Smart TV e três vagas no condomínio.
- Piscina e sauna do condomínio; pets permitidos nas áreas comuns com coleira.
- O endereço completo é informado no momento da reserva.
- Reservas: Camila, (21) 98635-7913; Mônica, (21) 98636-2770. Instagram: @casaoitodelmare.


O vídeo original `DawGcs6vp1d` aparece em loop e sem som ao lado do formulário. Os vídeos da galeria mantêm o formato original e se ajustam à largura da tela. O formulário no rodapé prepara uma mensagem e abre o WhatsApp da Camila ou da Mônica para a pessoa revisar e enviar. Ele não envia automaticamente. A navegação acompanha a rolagem; o layout prioriza telas pequenas.

## Página de links

A página links.html foi criada como uma página de links para bio do Instagram, com identidade da Casa Oito Del Mare, contatos de Camila e Mônica, link do Instagram, acesso ao site e mapa da região de Búzios. Depois de publicar, use https://SEU-DOMINIO/links.html no perfil. O endereço completo da casa não é exibido; ele é informado durante a consulta de reserva.

