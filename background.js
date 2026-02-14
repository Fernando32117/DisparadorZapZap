const NEXT_SEND_ALARM = "dispatch-next-send";
const SAFE_TIMEOUT_MS = 25000;

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
	lastMessageIndex: -1,
};

let inMemoryTimeoutId = null;
let processing = false;
let stateLoaded = false;
let loadingStatePromise = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	void (async () => {
		await ensureStateLoaded();

		if (msg.action === "start") {
			await startDispatch(msg.payload, msg.tabId);
			return { ok: true };
		}

		if (msg.action === "togglePause") {
			await togglePauseDispatch();
			return { ok: true };
		}

		if (msg.action === "stop") {
			await stopDispatch();
			return { ok: true };
		}

		if (msg.action === "getState") {
			return { state: publicState() };
		}

		return { ok: false, error: "Acao desconhecida" };
	})()
		.then((response) => sendResponse(response))
		.catch((error) => sendResponse({ ok: false, error: error.message }));

	return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (!alarm || alarm.name !== NEXT_SEND_ALARM) return;
	void handleNextAlarm();
});

async function ensureStateLoaded() {
	if (stateLoaded) return;
	if (loadingStatePromise) return loadingStatePromise;

	loadingStatePromise = (async () => {
		const stored = await chrome.storage.local.get("dispatchInternalState");
		const saved = stored.dispatchInternalState;
		if (saved && typeof saved === "object") {
			state = sanitizeLoadedState(saved);
		}

		stateLoaded = true;

		if (state.running && !state.paused) {
			const remaining = Math.max(0, (state.nextSendAt || Date.now()) - Date.now());
			await scheduleFromExistingState(remaining);
		}
	})();

	try {
		await loadingStatePromise;
	} finally {
		loadingStatePromise = null;
	}
}

function sanitizeLoadedState(saved) {
	const merged = { ...state, ...saved };

	if (!Array.isArray(merged.numbers)) merged.numbers = [];
	if (!Array.isArray(merged.messages)) merged.messages = [];
	if (typeof merged.index !== "number") merged.index = 0;
	if (typeof merged.successCount !== "number") merged.successCount = 0;
	if (typeof merged.failedCount !== "number") merged.failedCount = 0;
	if (typeof merged.totalCount !== "number") merged.totalCount = merged.numbers.length;
	if (typeof merged.lastMessageIndex !== "number") merged.lastMessageIndex = -1;

	return merged;
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

async function handleNextAlarm() {
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
		const messageIndex = getRandomMessageIndex(
			state.messages.length,
			state.lastMessageIndex,
		);
		const message = state.messages[messageIndex];
		state.lastMessageIndex = messageIndex;

		const sent = await trySend(state.tabId, number, message);
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
			state.minInterval + Math.random() * (state.maxInterval - state.minInterval);
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

	if (delayMs > SAFE_TIMEOUT_MS) {
		chrome.alarms.create(NEXT_SEND_ALARM, { when: state.nextSendAt });
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
	await chrome.alarms.clear(NEXT_SEND_ALARM);
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
				phone: number,
			});

			if (response && response.success) {
				return true;
			}

			if (attempt === 1) {
				await sleep(2000);
			}
		} catch (error) {
			if (attempt === 1) {
				await sleep(2000);
			}
		}
	}

	return false;
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

async function persistAndBroadcast() {
	const snapshot = publicState();
	await chrome.storage.local.set({
		dispatchState: snapshot,
		dispatchInternalState: { ...state },
	});

	try {
		await chrome.runtime.sendMessage({ action: "progress", state: snapshot });
	} catch (e) {}
}

async function getActiveTabId() {
	const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
	return tabs && tabs[0] ? tabs[0].id : null;
}

function getRandomMessageIndex(totalMessages, lastIndex) {
	if (!totalMessages || totalMessages < 1) return -1;
	if (totalMessages === 1) return 0;

	let newIndex;
	do {
		newIndex = Math.floor(Math.random() * totalMessages);
	} while (newIndex === lastIndex);

	return newIndex;
}

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
