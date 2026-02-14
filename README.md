# Disparador ZapZap (Dev)

ExtensÃ£o Chrome (Manifest V3) para automatizar o envio de mensagens no WhatsApp Web com intervalos aleatÃ³rios, painel de progresso e controle de pausa. Focada em UX e fluxo confiÃ¡vel: o disparo continua mesmo com o popup fechado.

**Aviso importante**  
Use com responsabilidade e com consentimento explÃ­cito dos destinatÃ¡rios. O uso inadequado pode violar os termos do WhatsApp e gerar bloqueios.

**Resumo rÃ¡pido**
- Envio para mÃºltiplos nÃºmeros com mensagens variadas.
- Intervalo aleatÃ³rio configurÃ¡vel.
- Pausar, continuar e parar a qualquer momento.
- Progresso persistente com service worker.
- Chips visuais para melhor gerenciamento dos nÃºmeros.

---

**Funcionalidades**
- Envio automatizado no WhatsApp Web.
- AtÃ© 3 variaÃ§Ãµes de mensagem (mÃ­nimo 2 obrigatÃ³rias).
- Intervalo aleatÃ³rio entre mensagens (configurÃ¡vel pelo usuÃ¡rio).
- Controle de execuÃ§Ã£o: iniciar, pausar, continuar, parar.
- Progresso em tempo real (sucesso, falha, total).
- Countdown para prÃ³xima mensagem.
- Lista de nÃºmeros em chips com remoÃ§Ã£o individual e botÃ£o â€œLimpar todosâ€.
- PersistÃªncia do estado mesmo com o popup fechado.

---

**Tecnologias e arquitetura**
- **Manifest V3** com `service_worker` para manter o disparo ativo.
- **Content Script** para interaÃ§Ã£o direta com o DOM do WhatsApp Web.
- **Popup UI** para configurar, iniciar e acompanhar o envio.
- **chrome.storage** para persistÃªncia do estado.

**Arquivos principais**
- `manifest.json`: configuraÃ§Ãµes da extensÃ£o e permissÃµes.
- `src/background/index.js`: motor do disparo (service worker).
- `src/content/index.js`: integraÃ§Ã£o com o WhatsApp Web.
- `popup.html`: interface do usuÃ¡rio.
- `src/popup/index.js`: lÃ³gica da UI.
- `styles.css`: estilos visuais.

---

**PrÃ©-requisitos**
- Google Chrome (ou navegador Chromium compatÃ­vel).
- SessÃ£o ativa no WhatsApp Web.

---

**InstalaÃ§Ã£o (modo desenvolvedor)**
1. Abra `chrome://extensions/`.
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactaÃ§Ã£o**.
4. Selecione a pasta do projeto.

---

**Como usar**
1. Abra o WhatsApp Web e confirme que estÃ¡ logado.
2. Abra o popup da extensÃ£o.
3. Adicione os nÃºmeros no campo de chips.
4. Informe as mensagens e intervalos.
5. Clique em **Disparar**.
6. Acompanhe o progresso e o countdown.

---

**Formato dos nÃºmeros**
- Formato Brasil: `55 + DDD + nÃºmero`.
- Exemplo: `5511999999999`.
- Caracteres nÃ£o numÃ©ricos sÃ£o ignorados automaticamente.

---

**Boas prÃ¡ticas**
- Evite listas muito grandes em pouco tempo.
- Use mensagens com variaÃ§Ãµes reais para reduzir bloqueios.
- Respeite consentimento e LGPD.

---

**LimitaÃ§Ãµes conhecidas**
- O WhatsApp Web muda a interface com frequÃªncia. Se o envio parar, pode ser necessÃ¡rio atualizar seletores em `src/content/seletores-whatsapp.js`.
- O envio depende da estabilidade da conexÃ£o e do carregamento correto do WhatsApp Web.

---

**PossÃ­veis melhorias (roadmap)**
- Exportar/Importar listas de nÃºmeros.
- Templates de mensagens com variÃ¡veis.
- Logs de execuÃ§Ã£o detalhados.

---

**ContribuiÃ§Ãµes**
SugestÃµes sÃ£o bem-vindas. Abra uma issue com o contexto e a proposta de melhoria.

---

**Autor**
Fernando Souza  
- Portfólio: https://portifolio-fernando-souza.onrender.com/
- LinkedIn: https://www.linkedin.com/in/gerfernandosouza/
- GitHub: https://github.com/Fernando32117

---

**LicenÃ§a**
MIT

