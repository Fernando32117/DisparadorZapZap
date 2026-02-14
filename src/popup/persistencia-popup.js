(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});
	const { byId, mensagem } = popup.ui;
	const { constantes, armazenamento } = globalThis.ZapZapShared;

	async function salvarDados() {
		const data = {
			numbers: byId("numbers").value,
			minInterval: byId("minInterval").value,
			maxInterval: byId("maxInterval").value,
			message1: mensagem(1).value,
			message2: mensagem(2).value,
			message3: mensagem(3).value,
		};

		try {
			await armazenamento.salvarChaveStorage(constantes.chaveDadosPopup, data);
		} catch (e) {
			armazenamento.salvarLocalStorage(
				constantes.chaveDadosPopup,
				JSON.stringify(data),
			);
		}
	}

	async function carregarDados() {
		let data = null;

		try {
			data = await armazenamento.lerChaveStorage(constantes.chaveDadosPopup);
		} catch (e) {}

		if (!data) {
			try {
				const legacy = armazenamento.lerLocalStorage(constantes.chaveDadosPopup);
				if (legacy) {
					data = JSON.parse(legacy);
					await armazenamento.salvarChaveStorage(constantes.chaveDadosPopup, data);
				}
			} catch (e) {}
		}

		if (data && typeof data === "object") {
			popup.formulario.setNumbersFromText(data.numbers || "");
			byId("minInterval").value =
				data.minInterval || constantes.intervaloPadraoMin;
			byId("maxInterval").value =
				data.maxInterval || constantes.intervaloPadraoMax;
			mensagem(1).value = data.message1 || "";
			mensagem(2).value = data.message2 || "";
			mensagem(3).value = data.message3 || "";
		}
	}

	popup.persistencia = {
		salvarDados,
		carregarDados,
	};
})();
