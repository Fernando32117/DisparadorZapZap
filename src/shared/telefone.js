(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	shared.telefone = {
		normalizar(valor) {
			if (!valor) return "";
			return String(valor).replace(/\D/g, "");
		},
	};
})();
