chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.action !== "send") return;

	(async () => {
		try {
			const input =
				document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
				document.querySelector('div[contenteditable="true"]._ak1l') ||
				document.querySelector('div[contenteditable="true"]');

			if (!input) {
				console.error("Input não encontrado");
				sendResponse({ success: false, error: "Input não encontrado" });
				return;
			}

			input.focus();

			// Limpar campo antes de inserir
			input.textContent = "";

			// Método mais confiável para inserir texto
			const dataTransfer = new DataTransfer();
			dataTransfer.setData("text/plain", msg.message);
			const event = new ClipboardEvent("paste", {
				clipboardData: dataTransfer,
				bubbles: true,
				cancelable: true,
			});
			const pasteHandled = input.dispatchEvent(event);

			// Aguardar um pouco para o evento ser processado
			await sleep(100);

			// Fallback para método antigo APENAS se o paste não funcionou
			if (!input.textContent || input.textContent.trim() === "") {
			}

			input.dispatchEvent(new Event("input", { bubbles: true }));

			await sleep(1000);

			const sendBtn =
				document.querySelector('button[data-tab="11"]') ||
				document.querySelector('[data-testid="compose-btn-send"]') ||
				document.querySelector('span[data-icon="send"]')?.parentElement;

			if (sendBtn) {
				sendBtn.click();
				sendResponse({ success: true });
			} else {
				console.error("Botão de enviar não encontrado");
				sendResponse({ success: false, error: "Botão não encontrado" });
			}
		} catch (error) {
			console.error("Erro ao enviar mensagem:", error);
			sendResponse({ success: false, error: error.message });
		}
	})();

	return true; // Indica que a resposta será enviada de forma assíncrona
});

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
