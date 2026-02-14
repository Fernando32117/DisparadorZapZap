(function () {
	const content = (globalThis.ZapZapContent = globalThis.ZapZapContent || {});
	const { sleep } = globalThis.ZapZapShared.tempo;
	const { obterInputMensagem, obterBotaoEnviar } = content.seletoresWhatsapp;
	const { temAvisoNumeroInvalido } = content.validacaoChat;

	async function enviarMensagem(msg) {
		// Aguarda para garantir renderizacao da conversa.
		await sleep(500);

		if (temAvisoNumeroInvalido()) {
			return { success: false, error: "Numero invalido ou nao existe" };
		}

		const input = obterInputMensagem();
		if (!input) {
			return { success: false, error: "Input nao encontrado" };
		}

		input.focus();
		input.textContent = "";

		const dataTransfer = new DataTransfer();
		dataTransfer.setData("text/plain", msg.message);
		const event = new ClipboardEvent("paste", {
			clipboardData: dataTransfer,
			bubbles: true,
			cancelable: true,
		});
		input.dispatchEvent(event);
		await sleep(100);

		input.dispatchEvent(new Event("input", { bubbles: true }));
		await sleep(1000);

		const sendBtn = obterBotaoEnviar();
		if (
			sendBtn &&
			!sendBtn.querySelector('[data-icon="ptt"]') &&
			!sendBtn.querySelector('[data-icon="mic"]')
		) {
			sendBtn.click();
			return { success: true };
		}

		return { success: false, error: "Botao nao encontrado" };
	}

	function abrirChat(phone) {
		const link = document.createElement("a");
		link.href = `https://web.whatsapp.com/send?phone=${phone}`;
		link.style.display = "none";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		return { success: true };
	}

	content.envioMensagem = {
		enviarMensagem,
		abrirChat,
	};
})();
