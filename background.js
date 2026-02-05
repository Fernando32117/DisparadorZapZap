let state = {
	running: false,
	paused: false,
	successCount: 0,
	failedCount: 0,
	totalCount: 0,
	index: 0,
	numbers: [],
	messages: [],
	minInterval: 6,
	maxInterval: 12,
	tabId: null,
	nextSendAt: null,
	remainingMs: null,
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.action === "start") {
		startDispatch(msg.payload, msg.tabId)
			.then(() => sendResponse({ ok: true }))
			.catch((error) => sendResponse({ ok: false, error: error.message }));
		return true;
	}

	if (msg.action === "togglePause") {
		state.paused = !state.paused;
		if (state.paused && state.nextSendAt) {
			const remainingMs = Math.max(0, state.nextSendAt - Date.now());
			state.remainingMs = remainingMs;
			state.nextSendAt = null;
		} else if (!state.paused && state.remainingMs) {
			state.nextSendAt = Date.now() + state.remainingMs;
		}
		persistAndBroadcast();
		sendResponse({ ok: true });
		return true;
	}

	if (msg.action === "stop") {
		stopDispatch();
		sendResponse({ ok: true });
		return true;
	}

	if (msg.action === "getState") {
		sendResponse({ state: publicState() });
		return true;
	}
});

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
	state.index = 0;

	state.numbers = payload.numbers;
	state.messages = payload.messages;
	state.minInterval = payload.minInterval;
	state.maxInterval = payload.maxInterval;
	state.totalCount = payload.numbers.length;
	state.tabId = activeTabId;
	state.nextSendAt = null;
	state.remainingMs = null;

	persistAndBroadcast();
	runLoop();
}

async function runLoop() {
	while (state.running && state.index < state.numbers.length) {
		await waitIfPaused();

		const number = state.numbers[state.index];
		const message = randomItem(state.messages);

		const sent = await trySend(state.tabId, number, message);
		if (sent) {
			state.successCount++;
		} else {
			state.failedCount++;
		}

		state.index++;
		persistAndBroadcast();

		if (state.running && state.index < state.numbers.length) {
			const delaySeconds =
				state.minInterval + Math.random() * (state.maxInterval - state.minInterval);
			await waitWithPause(Math.ceil(delaySeconds * 1000));
		}
	}

	state.running = false;
	state.paused = false;
	state.nextSendAt = null;
	state.remainingMs = null;
	persistAndBroadcast();
}

async function trySend(tabId, number, message) {
	for (let attempt = 1; attempt <= 2; attempt++) {
		try {
			if (attempt === 1) {
				try {
					const openResponse = await chrome.tabs.sendMessage(tabId, {
						action: "openChat",
						phone: number,
					});

					if (openResponse && openResponse.success) {
						await sleep(4000);
					} else {
						throw new Error("Navegacao interna falhou");
					}
				} catch (e) {
					await chrome.tabs.update(tabId, {
						url: `https://web.whatsapp.com/send?phone=${number}`,
					});
					await sleep(6000);
				}
			} else {
				await chrome.tabs.update(tabId, {
					url: `https://web.whatsapp.com/send?phone=${number}`,
				});
				await sleep(6000);
			}

			const response = await chrome.tabs.sendMessage(tabId, {
				action: "send",
				message,
			});

			if (response && response.success) {
				return true;
			}

			await sleep(2000);
		} catch (error) {
			await sleep(2000);
		}
	}

	return false;
}

function stopDispatch() {
	state.running = false;
	state.paused = false;
	state.nextSendAt = null;
	state.remainingMs = null;
	persistAndBroadcast();
}

function publicState() {
	return {
		running: state.running,
		paused: state.paused,
		successCount: state.successCount,
		failedCount: state.failedCount,
		totalCount: state.totalCount,
		nextSendAt: state.nextSendAt,
	};
}

function persistAndBroadcast() {
	const snapshot = publicState();
	chrome.storage.local.set({ dispatchState: snapshot });
	chrome.runtime.sendMessage({ action: "progress", state: snapshot });
}

async function getActiveTabId() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	return tabs && tabs[0] ? tabs[0].id : null;
}

async function waitIfPaused() {
	while (state.running && state.paused) {
		await sleep(500);
	}
}

async function waitWithPause(totalMs) {
	if (!totalMs || totalMs <= 0) return;

	let remainingMs = totalMs;
	state.remainingMs = remainingMs;
	state.nextSendAt = Date.now() + remainingMs;
	persistAndBroadcast();

	while (state.running && remainingMs > 0) {
		if (state.paused) {
			state.remainingMs = remainingMs;
			state.nextSendAt = null;
			persistAndBroadcast();

			while (state.running && state.paused) {
				await sleep(500);
			}
			if (!state.running) break;

			remainingMs = state.remainingMs ?? remainingMs;
			state.nextSendAt = Date.now() + remainingMs;
			persistAndBroadcast();
		}

		const step = Math.min(1000, remainingMs);
		await sleep(step);
		remainingMs = state.nextSendAt
			? Math.max(0, state.nextSendAt - Date.now())
			: remainingMs;
	}

	state.nextSendAt = null;
	state.remainingMs = null;
	persistAndBroadcast();
}

function randomItem(list) {
	return list[Math.floor(Math.random() * list.length)];
}

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
