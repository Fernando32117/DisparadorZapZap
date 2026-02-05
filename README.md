# Disparador ZapZap (Dev)

Extensão Chrome (Manifest V3) para automatizar o envio de mensagens no WhatsApp Web com intervalos aleatórios, painel de progresso e controle de pausa. Focada em UX e fluxo confiável: o disparo continua mesmo com o popup fechado.

**Aviso importante**  
Use com responsabilidade e com consentimento explícito dos destinatários. O uso inadequado pode violar os termos do WhatsApp e gerar bloqueios.

**Resumo rápido**
- Envio para múltiplos números com mensagens variadas.
- Intervalo aleatório configurável.
- Pausar, continuar e parar a qualquer momento.
- Progresso persistente com service worker.
- Chips visuais para melhor gerenciamento dos números.

---

**Funcionalidades**
- Envio automatizado no WhatsApp Web.
- Até 3 variações de mensagem (mínimo 2 obrigatórias).
- Intervalo aleatório entre mensagens (mínimo 6s).
- Controle de execução: iniciar, pausar, continuar, parar.
- Progresso em tempo real (sucesso, falha, total).
- Countdown para próxima mensagem.
- Lista de números em chips com remoção individual e botão “Limpar todos”.
- Persistência do estado mesmo com o popup fechado.

---

**Tecnologias e arquitetura**
- **Manifest V3** com `service_worker` para manter o disparo ativo.
- **Content Script** para interação direta com o DOM do WhatsApp Web.
- **Popup UI** para configurar, iniciar e acompanhar o envio.
- **chrome.storage** para persistência do estado.

**Arquivos principais**
- `manifest.json`: configurações da extensão e permissões.
- `background.js`: motor do disparo (service worker).
- `content.js`: interação com o WhatsApp Web.
- `popup.html`: interface do usuário.
- `popup.js`: lógica da UI.
- `styles.css`: estilos visuais.

---

**Pré-requisitos**
- Google Chrome (ou navegador Chromium compatível).
- Sessão ativa no WhatsApp Web.

---

**Instalação (modo desenvolvedor)**
1. Abra `chrome://extensions/`.
2. Ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta do projeto.

---

**Como usar**
1. Abra o WhatsApp Web e confirme que está logado.
2. Abra o popup da extensão.
3. Adicione os números no campo de chips.
4. Informe as mensagens e intervalos.
5. Clique em **Disparar**.
6. Acompanhe o progresso e o countdown.

---

**Formato dos números**
- Formato Brasil: `55 + DDD + número`.
- Exemplo: `5511999999999`.
- Caracteres não numéricos são ignorados automaticamente.

---

**Boas práticas**
- Evite listas muito grandes em pouco tempo.
- Use mensagens com variações reais para reduzir bloqueios.
- Respeite consentimento e LGPD.

---

**Limitações conhecidas**
- O WhatsApp Web muda a interface com frequência. Se o envio parar, pode ser necessário atualizar seletores em `content.js`.
- O envio depende da estabilidade da conexão e do carregamento correto do WhatsApp Web.

---

**Possíveis melhorias (roadmap)**
- Exportar/Importar listas de números.
- Templates de mensagens com variáveis.
- Logs de execução detalhados.

---

**Contribuições**
Sugestões são bem-vindas. Abra uma issue com o contexto e a proposta de melhoria.

---

**Autor**
Fernando Souza  
Portfólio e redes sociais no próprio popup.

---

**Licença**
MIT
