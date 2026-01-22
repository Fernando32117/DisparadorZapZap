# Disparador ZapZap (Dev)

Extensão Chrome simples para envio automatizado de mensagens via WhatsApp Web. Permite enviar uma mensagem (com até 3 variações) para vários números, com intervalos aleatórios configuráveis para parecer mais natural.

**Aviso:** Use com responsabilidade. O envio massivo de mensagens pode levar ao bloqueio de contas.

---

**Funcionalidades**
- Envio de mensagens para múltiplos números (formato Brasil: `55 + DDD + número`).
- Até 3 variações de mensagem (mínimo 1 obrigatório).
- Intervalo aleatório entre envios (configurável, mínimo 6s).
- Pausar/Continuar e Parar processo de disparo.
- Barra de progresso com contadores de sucesso/falha.

---

**Pré-requisitos**
- Google Chrome (ou navegador compatível com extensões Chromium).
- Conta WhatsApp ativa e sessão iniciada em WhatsApp Web.

---

**Instalação (modo desenvolvedor)**
1. Abra o Chrome e vá para `chrome://extensions/`.
2. Ative o *Modo do desenvolvedor* (canto superior direito).
3. Clique em "Carregar sem compactação" (Load unpacked) e selecione a pasta do projeto.
4. A extensão será adicionada; abra o ícone da extensão para usar.

---

**Como usar**
1. Abra WhatsApp Web e verifique que sua sessão está ativa.
2. Clique no ícone da extensão e preencha os campos:
   - `Números`: cada número em uma nova linha, no formato `55DDDNNNNNNNN` (sem espaços).
   - `Mensagem 1`: obrigatória.
   - `Mensagem 2` e `Mensagem 3`: opcionais (serão escolhidas aleatoriamente).
   - `Mínimo` e `Máximo`: intervalo em segundos (mínimo 6s).
3. Clique em `🚀 Disparar`. A extensão abrirá cada chat no WhatsApp Web e enviará a mensagem.
4. Use `⏸️ Pausar` para interromper temporariamente ou `🛑 Parar` para encerrar completamente.
5. Acompanhe progresso, sucessos e falhas pelo painel.

---

**Formato dos números**
- Exemplo (Brasil): `5511999999999` (55 + DDD + número).
- A extensão filtra caracteres não numéricos automaticamente.

---

**Mensagens e comportamento**
- Pelo menos 1 mensagem é obrigatória.
- As mensagens são selecionadas aleatoriamente entre as variações fornecidas.
- Há um delay mínimo recomendado de 6 segundos entre envios para reduzir risco de bloqueio.

---

**Erros comuns & soluções**
- `Input não encontrado` ou `Botão não encontrado`:
  - Certifique-se de que o WhatsApp Web esteja totalmente carregado e que o chat do número esteja acessível.
  - Atualize a página do WhatsApp Web e tente novamente.
- Verifique se o seletor do campo de mensagem mudou (interfaces do WhatsApp podem atualizar). O arquivo relevante é [content.js](content.js).

---

**Arquivos principais**
- [manifest.json](manifest.json): configuração da extensão (manifest v3, permissões e host_permissions).
- [content.js](content.js): script injetado no WhatsApp Web que encontra o campo de entrada, insere a mensagem e aciona o envio.
- [popup.html](popup.html): interface da extensão.
- [popup.js](popup.js): lógica da UI e fluxo de envio (controle de intervalos, progressos, start/pause/stop).
- [styles.css](styles.css): estilos da UI.

---

**Desenvolvimento**
- Para ajustar seletores ou comportamento no WhatsApp Web, edite `content.js`.
- Utilize `console` do devtools para debugar mensagens/erros do script injetado.

---

**Considerações legais e éticas**
- Não use esta ferramenta para spam, assédio ou qualquer atividade que viole os termos do WhatsApp ou legislações locais.
- Respeite o consentimento dos destinatários.

---

**Contribuições**
- Sugestões e melhorias são bem-vindas. Abra uma issue descrevendo alteração proposta.

---

**Licença**
MIT License. Veja o arquivo LICENSE se desejar adicionar informações formais.
