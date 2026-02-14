(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});

	popup.estado = {
		running: false,
		paused: false,
		successCount: 0,
		failedCount: 0,
		totalCount: 0,
		countdownIntervalId: null,
		currentNextSendAt: null,
		numbersList: [],
	};

	popup.ui = {
		byId(id) {
			return document.getElementById(id);
		},
		mensagem(index) {
			return document.querySelector(`[data-msg="${index}"]`);
		},
	};
})();
