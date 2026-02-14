(function () {
	const bg = (globalThis.ZapZapBackground = globalThis.ZapZapBackground || {});
	const { sleep } = globalThis.ZapZapShared.tempo;
	const constantes = globalThis.ZapZapShared.constantes;

	async function tentarEnviar(tabId, number, message) {
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				if (attempt === 1) {
					try {
						const openResponse = await chrome.tabs.sendMessage(tabId, {
							action: constantes.acaoOpenChat,
							phone: number,
						});

						if (openResponse && openResponse.success) {
							await sleep(4000);
						} else {
							throw new Error("Navegacao interna falhou");
						}
					} catch (e) {
						await chrome.tabs.update(tabId, {
							url: `https://web.whatsapp.com/send?phone=${number}`,
						});
						await sleep(6000);
					}
				} else {
					await chrome.tabs.update(tabId, {
						url: `https://web.whatsapp.com/send?phone=${number}`,
					});
					await sleep(6000);
				}

				const response = await chrome.tabs.sendMessage(tabId, {
					action: constantes.acaoSend,
					message,
					phone: number,
				});

				if (response && response.success) {
					return true;
				}

				if (attempt === 1) {
					await sleep(2000);
				}
			} catch (error) {
				if (attempt === 1) {
					await sleep(2000);
				}
			}
		}

		return false;
	}

	bg.envioWhatsapp = {
		tentarEnviar,
	};
})();
