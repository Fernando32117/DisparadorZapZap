(function () {
	const bg = (globalThis.ZapZapBackground = globalThis.ZapZapBackground || {});
	const constantes = globalThis.ZapZapShared.constantes;

	function criarEstadoInicial() {
		return {
			running: false,
			paused: false,
			successCount: 0,
			failedCount: 0,
			totalCount: 0,
			index: 0,
			numbers: [],
			messages: [],
			minInterval: constantes.intervaloPadraoMin,
			maxInterval: constantes.intervaloPadraoMax,
			tabId: null,
			nextSendAt: null,
			remainingMs: null,
			lastMessageIndex: -1,
		};
	}

	function sanitizarEstadoCarregado(saved, estadoBase) {
		const merged = { ...estadoBase, ...saved };

		if (!Array.isArray(merged.numbers)) merged.numbers = [];
		if (!Array.isArray(merged.messages)) merged.messages = [];
		if (typeof merged.index !== "number") merged.index = 0;
		if (typeof merged.successCount !== "number") merged.successCount = 0;
		if (typeof merged.failedCount !== "number") merged.failedCount = 0;
		if (typeof merged.totalCount !== "number")
			merged.totalCount = merged.numbers.length;
		if (typeof merged.lastMessageIndex !== "number")
			merged.lastMessageIndex = -1;

		return merged;
	}

	function estadoPublico(estado) {
		return {
			running: estado.running,
			paused: estado.paused,
			successCount: estado.successCount,
			failedCount: estado.failedCount,
			totalCount: estado.totalCount,
			nextSendAt: estado.nextSendAt,
		};
	}

	bg.estadoDisparo = {
		criarEstadoInicial,
		sanitizarEstadoCarregado,
		estadoPublico,
	};
})();
