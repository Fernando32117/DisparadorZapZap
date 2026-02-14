(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});
	const { byId } = popup.ui;
	const { estado } = popup;

	function showProgress() {
		byId("progressSection").style.display = "block";
	}

	function hideProgress() {
		byId("progressSection").style.display = "none";
	}

	function showForm() {
		const f = byId("formSection");
		if (f) f.style.display = "block";
	}

	function hideForm() {
		const f = byId("formSection");
		if (f) f.style.display = "none";
	}

	function updateProgress() {
		const percent =
			estado.totalCount > 0
				? ((estado.successCount + estado.failedCount) / estado.totalCount) * 100
				: 0;
		byId("progressFill").style.width = `${percent}%`;
		byId("successCount").textContent = String(estado.successCount);
		byId("failedCount").textContent = String(estado.failedCount);
		byId("totalCount").textContent = String(estado.totalCount);
	}

	function applyState(nextState) {
		if (!nextState) return;

		const wasRunning = estado.running;

		estado.running = !!nextState.running;
		estado.paused = !!nextState.paused;
		estado.successCount = nextState.successCount || 0;
		estado.failedCount = nextState.failedCount || 0;
		estado.totalCount = nextState.totalCount || 0;

		updateProgress();

		if (estado.running !== wasRunning) {
			const statsBtn = byId("statsToggle");
			if (estado.running) {
				hideForm();
				showProgress();
				if (statsBtn) {
					statsBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Voltar';
				}
			} else {
				showForm();
				hideProgress();
				if (statsBtn) {
					statsBtn.innerHTML =
						'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';
				}
			}
		}

		byId("start").disabled = estado.running;
		byId("pause").disabled = !estado.running;
		byId("stop").disabled = !estado.running;

		const pauseBtn = byId("pause");
		pauseBtn.textContent = estado.paused ? "▶️ Continuar" : "⏸️ Pausar";

		popup.contador.syncCountdown(nextState.nextSendAt);
	}

	function requestState() {
		const action = globalThis.ZapZapShared.constantes.acaoGetState;
		chrome.runtime.sendMessage({ action }, (res) => {
			if (res && res.state) {
				applyState(res.state);
			}
		});
	}

	popup.progresso = {
		showProgress,
		hideProgress,
		showForm,
		hideForm,
		updateProgress,
		applyState,
		requestState,
	};
})();
