(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});
	const { byId } = popup.ui;
	const { estado } = popup;

	function showCountdown() {
		byId("countdownTimer").style.display = "block";
	}

	function hideCountdown() {
		byId("countdownTimer").style.display = "none";
	}

	function syncCountdown(nextSendAt) {
		if (estado.running && !estado.paused && nextSendAt) {
			if (estado.currentNextSendAt !== nextSendAt || !estado.countdownIntervalId) {
				startCountdown(nextSendAt);
			} else {
				updateCountdownDisplay();
			}
		} else {
			stopCountdown();
		}
	}

	function startCountdown(nextSendAt) {
		estado.currentNextSendAt = nextSendAt;
		showCountdown();
		updateCountdownDisplay();

		if (estado.countdownIntervalId) {
			clearInterval(estado.countdownIntervalId);
		}
		estado.countdownIntervalId = setInterval(updateCountdownDisplay, 250);
	}

	function stopCountdown() {
		estado.currentNextSendAt = null;
		if (estado.countdownIntervalId) {
			clearInterval(estado.countdownIntervalId);
			estado.countdownIntervalId = null;
		}
		hideCountdown();
	}

	function updateCountdownDisplay() {
		if (!estado.currentNextSendAt) return;
		const remainingMs = estado.currentNextSendAt - Date.now();
		const remaining = Math.max(0, Math.floor(remainingMs / 1000));
		byId("countdown").textContent = String(remaining);
	}

	popup.contador = {
		syncCountdown,
		startCountdown,
		stopCountdown,
		updateCountdownDisplay,
	};
})();
