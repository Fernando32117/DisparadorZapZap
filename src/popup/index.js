(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});
	const { byId } = popup.ui;
	const { constantes } = globalThis.ZapZapShared;

	async function validarAbaAtivaWhatsapp() {
		try {
			const [tab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (!tab || !tab.url || !tab.url.includes("web.whatsapp.com")) {
				if (tab && tab.id) {
					chrome.tabs.update(tab.id, { url: "https://web.whatsapp.com" });
				} else {
					chrome.tabs.create({ url: "https://web.whatsapp.com" });
				}
				window.close();
				return false;
			}
			return true;
		} catch (e) {
			try {
				chrome.tabs.create({ url: "https://web.whatsapp.com" });
			} catch (e2) {}
			window.close();
			return false;
		}
	}

	function configurarBotaoProgresso() {
		const statsBtn = byId("statsToggle");
		if (!statsBtn) return;

		statsBtn.innerHTML =
			'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';

		statsBtn.addEventListener("click", () => {
			const prog = byId("progressSection");
			const progVisible = prog && window.getComputedStyle(prog).display !== "none";
			if (progVisible) {
				popup.progresso.hideProgress();
				popup.progresso.showForm();
				statsBtn.innerHTML =
					'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';
			} else {
				popup.progresso.showProgress();
				popup.progresso.hideForm();
				statsBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Voltar';
			}
		});
	}

	function configurarEventosCampos() {
		byId("minInterval").addEventListener("input", popup.persistencia.salvarDados);
		byId("maxInterval").addEventListener("input", popup.persistencia.salvarDados);
		document.querySelectorAll(".msg").forEach((textarea) => {
			textarea.addEventListener("input", popup.persistencia.salvarDados);
		});
	}

	function configurarEventosRuntime() {
		chrome.runtime.onMessage.addListener((msg) => {
			if (msg.action === constantes.acaoProgress) {
				popup.progresso.applyState(msg.state);
			}
		});
	}

	async function iniciarDisparo() {
		const dados = popup.formulario.coletarPayloadDisparo();
		if (!dados.ok) {
			alert(dados.error);
			return;
		}

		if (dados.invalids && dados.invalids.length) {
			alert(
				"Alguns numeros foram ignorados por estarem em formato invalido:\n" +
					dados.invalids.join(", "),
			);
		}

		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (!tab || !tab.id) {
			alert("Aba ativa nao encontrada");
			return;
		}

		await chrome.runtime.sendMessage({
			action: constantes.acaoStart,
			tabId: tab.id,
			payload: dados.payload,
		});

		popup.progresso.requestState();
	}

	function configurarBotoesAcao() {
		byId("start").onclick = async () => {
			await iniciarDisparo();
		};

		byId("pause").onclick = async () => {
			await chrome.runtime.sendMessage({ action: constantes.acaoTogglePause });
			popup.progresso.requestState();
		};

		byId("stop").onclick = async () => {
			await chrome.runtime.sendMessage({ action: constantes.acaoStop });
			popup.progresso.requestState();
		};
	}

	window.addEventListener("DOMContentLoaded", async () => {
		await popup.persistencia.carregarDados();
		popup.formulario.setupNumbersInput();
		popup.formulario.setupClearNumbers();
		configurarEventosCampos();

		const valido = await validarAbaAtivaWhatsapp();
		if (!valido) return;

		popup.progresso.hideProgress();
		popup.progresso.showForm();
		configurarBotaoProgresso();
		configurarEventosRuntime();
		configurarBotoesAcao();
		popup.progresso.requestState();
	});
})();
