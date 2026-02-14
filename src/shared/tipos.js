(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	/**
	 * @typedef {Object} EstadoDisparo
	 * @property {boolean} running
	 * @property {boolean} paused
	 * @property {number} successCount
	 * @property {number} failedCount
	 * @property {number} totalCount
	 * @property {number} index
	 * @property {string[]} numbers
	 * @property {string[]} messages
	 * @property {number} minInterval
	 * @property {number} maxInterval
	 * @property {number|null} tabId
	 * @property {number|null} nextSendAt
	 * @property {number|null} remainingMs
	 * @property {number} lastMessageIndex
	 */

	/**
	 * @typedef {Object} DadosPopup
	 * @property {string} numbers
	 * @property {string|number} minInterval
	 * @property {string|number} maxInterval
	 * @property {string} message1
	 * @property {string} message2
	 * @property {string} message3
	 */

	shared.tipos = {};
})();
