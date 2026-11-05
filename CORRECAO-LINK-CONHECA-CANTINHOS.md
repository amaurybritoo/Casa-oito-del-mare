# Correção do link “Conheça cada cantinho”

- O link agora aponta para `#cards-heading`, ID colocado diretamente no cabeçalho “UM CONVITE PARA FICAR / Escolha seu caminho”.
- Um listener dedicado impede a navegação nativa problemática e calcula a posição de rolagem considerando a altura real do menu fixo.
- A rolagem respeita `prefers-reduced-motion` e atualiza o fragmento da URL sem provocar salto de página.
- O `data-copy="intro_link"` foi mantido no span interno, preservando a edição do texto pelo painel.
- A versão do script `app.js` foi atualizada para reduzir o risco de cache antigo na Vercel.
