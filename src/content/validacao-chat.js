(function () {
	const content = (globalThis.ZapZapContent = globalThis.ZapZapContent || {});

	function temAvisoNumeroInvalido() {
		const errorSelectors = [
			'div[data-id="invalid-phone-alert"]',
			'span[data-icon="alert-phone"]',
		];

		for (const selector of errorSelectors) {
			const errorElement = document.querySelector(selector);
			if (errorElement && errorElement.offsetParent !== null) {
				return true;
			}
		}

		return false;
	}

	content.validacaoChat = {
		temAvisoNumeroInvalido,
	};
})();
