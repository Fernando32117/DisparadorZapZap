(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	shared.aleatoriedade = {
		indiceMensagemSemRepeticao(totalMensagens, ultimoIndice) {
			if (!totalMensagens || totalMensagens < 1) return -1;
			if (totalMensagens === 1) return 0;

			let novoIndice;
			do {
				novoIndice = Math.floor(Math.random() * totalMensagens);
			} while (novoIndice === ultimoIndice);

			return novoIndice;
		},
	};
})();
