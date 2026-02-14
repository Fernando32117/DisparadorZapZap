(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});
	const telefone = shared.telefone;

	function extrairTelefonesValidos(rawNumbers) {
		const texto = rawNumbers || "";
		let extraidos = texto.match(/\+?\d{8,15}/g) || [];

		if (!extraidos.length) {
			extraidos = texto
				.split(/[,\n\r;]+/)
				.map((s) => s.trim())
				.filter(Boolean);
		}

		const numeros = extraidos
			.map((n) => telefone.normalizar(n))
			.filter((n) => n.length >= 12);

		return [...new Set(numeros)];
	}

	function extrairTelefonesInvalidos(rawNumbers) {
		const texto = rawNumbers || "";
		const lista = texto
			.split(/[,\n\r;]+/)
			.map((s) => s.trim())
			.filter(Boolean);

		return lista
			.map((s) => telefone.normalizar(s))
			.filter((n) => n.length && n.length < 12);
	}

	shared.validacoes = {
		extrairTelefonesValidos,
		extrairTelefonesInvalidos,
	};
})();
