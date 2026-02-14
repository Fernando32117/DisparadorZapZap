(function () {
	const content = (globalThis.ZapZapContent = globalThis.ZapZapContent || {});

	function obterInputMensagem() {
		return (
			document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
			document.querySelector('div[contenteditable="true"]._ak1l') ||
			document.querySelector('div[contenteditable="true"]')
		);
	}

	function obterBotaoEnviar() {
		return (
			document.querySelector('button[data-tab="11"]') ||
			document.querySelector('[data-testid="compose-btn-send"]') ||
			document.querySelector('button[aria-label*="Enviar"]') ||
			document.querySelector('button span[data-icon="send"]')?.closest("button")
		);
	}

	content.seletoresWhatsapp = {
		obterInputMensagem,
		obterBotaoEnviar,
	};
})();
