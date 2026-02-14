(function () {
	const constantes = globalThis.ZapZapShared.constantes;
	const { enviarMensagem, abrirChat } = globalThis.ZapZapContent.envioMensagem;

	chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
		if (msg.action === constantes.acaoSend) {
			(async () => {
				try {
					const response = await enviarMensagem(msg);
					sendResponse(response);
				} catch (error) {
					sendResponse({
						success: false,
						error: error && error.message ? error.message : String(error),
					});
				}
			})();
			return true;
		}

		if (msg.action === constantes.acaoOpenChat) {
			(async () => {
				try {
					const response = abrirChat(msg.phone);
					sendResponse(response);
				} catch (error) {
					sendResponse({
						success: false,
						error: error && error.message ? error.message : String(error),
					});
				}
			})();
			return true;
		}
	});
})();
