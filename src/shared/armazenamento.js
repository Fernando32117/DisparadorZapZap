(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	shared.armazenamento = {
		async lerChaveStorage(chave) {
			const result = await chrome.storage.local.get(chave);
			return result[chave];
		},

		async salvarChaveStorage(chave, valor) {
			await chrome.storage.local.set({ [chave]: valor });
		},

		lerLocalStorage(chave) {
			try {
				return localStorage.getItem(chave);
			} catch (e) {
				return null;
			}
		},

		salvarLocalStorage(chave, valor) {
			try {
				localStorage.setItem(chave, valor);
				return true;
			} catch (e) {
				return false;
			}
		},
	};
})();
