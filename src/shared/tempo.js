(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	shared.tempo = {
		sleep(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		},
	};
})();
