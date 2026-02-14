(function () {
	const bg = (globalThis.ZapZapBackground = globalThis.ZapZapBackground || {});
	const { constantes, armazenamento, aleatoriedade } = globalThis.ZapZapShared;
	const { criarEstadoInicial, sanitizarEstadoCarregado, estadoPublico } =
		bg.estadoDisparo;
	const { tentarEnviar } = bg.envioWhatsapp;

	function criarControladorDisparo() {
		let state = criarEstadoInicial();
		let inMemoryTimeoutId = null;
		let processing = false;
		let stateLoaded = false;
		let loadingStatePromise = null;
		let listenersRegistrados = false;

		async function ensureStateLoaded() {
			if (stateLoaded) return;
			if (loadingStatePromise) return loadingStatePromise;

			loadingStatePromise = (async () => {
				const saved = await armazenamento.lerChaveStorage(
					constantes.chaveEstadoDisparoInterno,
				);
				if (saved && typeof saved === "object") {
					state = sanitizarEstadoCarregado(saved, state);
				}

				stateLoaded = true;

				if (state.running && !state.paused) {
					const remaining = Math.max(
						0,
						(state.nextSendAt || Date.now()) - Date.now(),
					);
					await scheduleFromExistingState(remaining);
				}
			})();

			try {
				await loadingStatePromise;
			} finally {
				loadingStatePromise = null;
			}
		}

		async function handleRuntimeMessage(msg) {
			await ensureStateLoaded();

			if (msg.action === constantes.acaoStart) {
				await startDispatch(msg.payload, msg.tabId);
				return { ok: true };
			}

			if (msg.action === constantes.acaoTogglePause) {
				await togglePauseDispatch();
				return { ok: true };
			}

			if (msg.action === constantes.acaoStop) {
				await stopDispatch();
				return { ok: true };
			}

			if (msg.action === constantes.acaoGetState) {
				return { state: estadoPublico(state) };
			}

			return { ok: false, error: "Acao desconhecida" };
		}

		async function startDispatch(payload, tabId) {
			if (state.running) return;

			const activeTabId = tabId ?? (await getActiveTabId());
			if (!activeTabId) {
				throw new Error("Aba ativa nao encontrada");
			}

			state.running = true;
			state.paused = false;
			state.successCount = 0;
			state.failedCount = 0;
			state.totalCount = payload.numbers.length;
			state.index = 0;

			state.numbers = payload.numbers;
			state.messages = payload.messages;
			state.minInterval = payload.minInterval;
			state.maxInterval = payload.maxInterval;
			state.tabId = activeTabId;
			state.nextSendAt = null;
			state.remainingMs = null;
			state.lastMessageIndex = -1;

			await clearScheduledDispatch();
			await persistAndBroadcast();
			await processNextNumber();
		}

		async function togglePauseDispatch() {
			state.paused = !state.paused;

			if (state.paused) {
				if (state.nextSendAt) {
					state.remainingMs = Math.max(0, state.nextSendAt - Date.now());
				}
				state.nextSendAt = null;
				await clearScheduledDispatch();
				await persistAndBroadcast();
				return;
			}

			const remaining = Math.max(0, state.remainingMs || 0);
			await scheduleNextDispatch(remaining);
		}

		async function stopDispatch() {
			state.running = false;
			state.paused = false;
			state.nextSendAt = null;
			state.remainingMs = null;
			state.lastMessageIndex = -1;
			await clearScheduledDispatch();
			await persistAndBroadcast();
		}

		async function handleNextAlarm(alarm) {
			if (!alarm || alarm.name !== constantes.alarmeProximoEnvio) return;
			await ensureStateLoaded();
			if (!state.running || state.paused) return;

			state.nextSendAt = null;
			state.remainingMs = null;
			await persistAndBroadcast();
			await processNextNumber();
		}

		async function processNextNumber() {
			if (processing) return;
			if (!state.running || state.paused) return;

			processing = true;
			try {
				if (state.index >= state.numbers.length) {
					await finishDispatch();
					return;
				}

				const number = state.numbers[state.index];
				const messageIndex = aleatoriedade.indiceMensagemSemRepeticao(
					state.messages.length,
					state.lastMessageIndex,
				);
				const message = state.messages[messageIndex];
				state.lastMessageIndex = messageIndex;

				const sent = await tentarEnviar(state.tabId, number, message);
				if (sent) {
					state.successCount++;
				} else {
					state.failedCount++;
				}

				state.index++;

				if (state.index >= state.numbers.length) {
					await finishDispatch();
					return;
				}

				await persistAndBroadcast();
				const delaySeconds =
					state.minInterval +
					Math.random() * (state.maxInterval - state.minInterval);
				await scheduleNextDispatch(Math.ceil(delaySeconds * 1000));
			} finally {
				processing = false;
			}
		}

		async function finishDispatch() {
			state.running = false;
			state.paused = false;
			state.nextSendAt = null;
			state.remainingMs = null;
			state.lastMessageIndex = -1;
			await clearScheduledDispatch();
			await persistAndBroadcast();
		}

		async function scheduleFromExistingState(remainingMs) {
			await clearScheduledDispatch();

			if (!state.running || state.paused) return;

			const delayMs = Math.max(0, remainingMs);
			state.remainingMs = delayMs;
			state.nextSendAt = Date.now() + delayMs;
			await persistAndBroadcast();

			if (delayMs === 0) {
				void processNextNumber();
				return;
			}

			if (delayMs > constantes.timeoutSeguroMs) {
				chrome.alarms.create(constantes.alarmeProximoEnvio, {
					when: state.nextSendAt,
				});
				return;
			}

			inMemoryTimeoutId = setTimeout(() => {
				inMemoryTimeoutId = null;
				void processNextNumber();
			}, delayMs);
		}

		async function scheduleNextDispatch(delayMs) {
			await scheduleFromExistingState(delayMs);
		}

		async function clearScheduledDispatch() {
			if (inMemoryTimeoutId) {
				clearTimeout(inMemoryTimeoutId);
				inMemoryTimeoutId = null;
			}
			await chrome.alarms.clear(constantes.alarmeProximoEnvio);
		}

		async function persistAndBroadcast() {
			const snapshot = estadoPublico(state);
			await chrome.storage.local.set({
				[constantes.chaveEstadoDisparoPublico]: snapshot,
				[constantes.chaveEstadoDisparoInterno]: { ...state },
			});

			try {
				await chrome.runtime.sendMessage({
					action: constantes.acaoProgress,
					state: snapshot,
				});
			} catch (e) {}
		}

		async function getActiveTabId() {
			const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
			return tabs && tabs[0] ? tabs[0].id : null;
		}

		function init() {
			if (listenersRegistrados) return;
			listenersRegistrados = true;

			chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
				void handleRuntimeMessage(msg)
					.then((response) => sendResponse(response))
					.catch((error) =>
						sendResponse({ ok: false, error: error.message || String(error) }),
					);
				return true;
			});

			chrome.alarms.onAlarm.addListener((alarm) => {
				void handleNextAlarm(alarm);
			});
		}

		return { init };
	}

	bg.controladorDisparo = {
		criarControladorDisparo,
	};
})();
