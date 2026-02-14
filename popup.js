let running = false;
let paused = false;
let successCount = 0;
let failedCount = 0;
let totalCount = 0;
let countdownIntervalId = null;
let currentNextSendAt = null;
let numbersList = [];
const POPUP_DATA_KEY = "zapzapData";

window.addEventListener("DOMContentLoaded", async () => {
	await loadSavedData();
	setupNumbersInput();
	setupClearNumbers();
	document.getElementById("minInterval").addEventListener("input", saveData);
	document.getElementById("maxInterval").addEventListener("input", saveData);
	document.querySelectorAll(".msg").forEach((textarea) => {
		textarea.addEventListener("input", saveData);
	});

	// Se a aba ativa não for o WhatsApp Web, redireciona para https://web.whatsapp.com
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
			return;
		}
	} catch (e) {
		try {
			chrome.tabs.create({ url: "https://web.whatsapp.com" });
		} catch (e2) {}
		window.close();
		return;
	}

	hideProgress();
	showForm();

	const statsBtn = document.getElementById("statsToggle");
	if (statsBtn) {
		statsBtn.innerHTML =
			'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';
		statsBtn.addEventListener("click", () => {
			const prog = document.getElementById("progressSection");
			const form = document.getElementById("formSection");
			const progVisible =
				prog && window.getComputedStyle(prog).display !== "none";
			if (progVisible) {
				hideProgress();
				showForm();
				statsBtn.innerHTML =
					'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';
			} else {
				showProgress();
				hideForm();
				statsBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Voltar';
			}
		});
	}

	chrome.runtime.onMessage.addListener((msg) => {
		if (msg.action === "progress") {
			applyState(msg.state);
		}
	});

	requestState();
});

async function saveData() {
	const data = {
		numbers: document.getElementById("numbers").value,
		minInterval: document.getElementById("minInterval").value,
		maxInterval: document.getElementById("maxInterval").value,
		message1: document.querySelector('[data-msg="1"]').value,
		message2: document.querySelector('[data-msg="2"]').value,
		message3: document.querySelector('[data-msg="3"]').value,
	};
	try {
		await chrome.storage.local.set({ [POPUP_DATA_KEY]: data });
	} catch (e) {
		try {
			localStorage.setItem(POPUP_DATA_KEY, JSON.stringify(data));
		} catch (e2) {}
	}
}

async function loadSavedData() {
	let data = null;

	try {
		const stored = await chrome.storage.local.get(POPUP_DATA_KEY);
		data = stored[POPUP_DATA_KEY] || null;
	} catch (e) {}

	// Migra dados antigos do localStorage para storage da extensão.
	if (!data) {
		try {
			const legacy = localStorage.getItem(POPUP_DATA_KEY);
			if (legacy) {
				data = JSON.parse(legacy);
				await chrome.storage.local.set({ [POPUP_DATA_KEY]: data });
			}
		} catch (e) {}
	}

	if (data && typeof data === "object") {
		setNumbersFromText(data.numbers || "");
		document.getElementById("minInterval").value = data.minInterval || 6;
		document.getElementById("maxInterval").value = data.maxInterval || 12;
		document.querySelector('[data-msg="1"]').value = data.message1 || "";
		document.querySelector('[data-msg="2"]').value = data.message2 || "";
		document.querySelector('[data-msg="3"]').value = data.message3 || "";
	}
}

function setupNumbersInput() {
	const input = document.getElementById("numbersInput");
	if (!input) return;

	input.addEventListener("keydown", (event) => {
		if (
			event.key === "Enter" ||
			event.key === "," ||
			event.key === ";" ||
			event.key === " "
		) {
			event.preventDefault();
			commitPendingNumber();
		} else if (event.key === "Backspace" && !input.value) {
			removeLastNumber();
		}
	});

	input.addEventListener("blur", () => {
		commitPendingNumber();
	});

	input.addEventListener("paste", (event) => {
		const text = (event.clipboardData || window.clipboardData).getData("text");
		if (text) {
			event.preventDefault();
			addNumbersFromText(text);
		}
	});
}

function setupClearNumbers() {
	const btn = document.getElementById("clearNumbers");
	if (!btn) return;
	btn.addEventListener("click", () => {
		numbersList = [];
		renderNumberChips();
		updateNumbersValue();
		saveData();
	});
	updateClearButtonState();
}

function commitPendingNumber() {
	const input = document.getElementById("numbersInput");
	if (!input) return;
	if (input.value && input.value.trim()) {
		addNumbersFromText(input.value);
		input.value = "";
	}
}

function setNumbersFromText(text) {
	numbersList = [];
	addNumbersFromText(text, true);
}

function addNumbersFromText(text, replaceList = false) {
	const raw = text || "";
	let extracted = raw.match(/\+?\d{8,15}/g) || [];
	if (!extracted.length) {
		extracted = raw
			.split(/[,\n\r; ]+/)
			.map((s) => s.trim())
			.filter(Boolean);
	}

	const toAdd = extracted
		.map((n) => n.replace(/\D/g, ""))
		.filter((n) => n.length >= 12);

	if (replaceList) {
		numbersList = [];
	}

	let changed = false;
	for (const number of toAdd) {
		if (!numbersList.includes(number)) {
			numbersList.push(number);
			changed = true;
		}
	}

	renderNumberChips();
	updateNumbersValue();

	if (changed) {
		saveData();
	}
}

function removeNumber(number) {
	const next = numbersList.filter((n) => n !== number);
	if (next.length !== numbersList.length) {
		numbersList = next;
		renderNumberChips();
		updateNumbersValue();
		saveData();
	}
}

function removeLastNumber() {
	if (!numbersList.length) return;
	numbersList.pop();
	renderNumberChips();
	updateNumbersValue();
	saveData();
}

function renderNumberChips() {
	const container = document.getElementById("numbersChips");
	if (!container) return;
	container.innerHTML = "";

	for (const number of numbersList) {
		const chip = document.createElement("span");
		chip.className = "chip";
		chip.textContent = number;

		const removeBtn = document.createElement("button");
		removeBtn.type = "button";
		removeBtn.setAttribute("aria-label", `Remover ${number}`);
		removeBtn.textContent = "x";
		removeBtn.addEventListener("click", () => removeNumber(number));

		chip.appendChild(removeBtn);
		container.appendChild(chip);
	}

	updateClearButtonState();
}

function updateNumbersValue() {
	const textarea = document.getElementById("numbers");
	if (!textarea) return;
	textarea.value = numbersList.join("\n");
}

function updateClearButtonState() {
	const btn = document.getElementById("clearNumbers");
	if (!btn) return;
	btn.disabled = numbersList.length === 0;
}

function updateProgress() {
	const percent = ((successCount + failedCount) / totalCount) * 100;
	document.getElementById("progressFill").style.width = percent + "%";
	document.getElementById("successCount").textContent = successCount;
	document.getElementById("failedCount").textContent = failedCount;
	document.getElementById("totalCount").textContent = totalCount;
}

function resetProgress() {
	successCount = 0;
	failedCount = 0;
	totalCount = 0;
	updateProgress();
}

function applyState(state) {
	if (!state) return;

	const wasRunning = running;

	running = !!state.running;
	paused = !!state.paused;
	successCount = state.successCount || 0;
	failedCount = state.failedCount || 0;
	totalCount = state.totalCount || 0;

	updateProgress();

	if (running !== wasRunning) {
		const statsBtn = document.getElementById("statsToggle");
		if (running) {
			hideForm();
			showProgress();
			if (statsBtn)
				statsBtn.innerHTML =
					'<i class="fa-solid fa-rotate-left"></i> Voltar';
		} else {
			showForm();
			hideProgress();
			if (statsBtn)
				statsBtn.innerHTML =
					'<i class="fa-solid fa-chart-bar"></i> Progresso do Disparo';
		}
	}

	document.getElementById("start").disabled = running;
	document.getElementById("pause").disabled = !running;
	document.getElementById("stop").disabled = !running;

	const pauseBtn = document.getElementById("pause");
	pauseBtn.textContent = paused ? "▶️ Continuar" : "⏸️ Pausar";

	syncCountdown(state.nextSendAt);
}

function requestState() {
	chrome.runtime.sendMessage({ action: "getState" }, (res) => {
		if (res && res.state) {
			applyState(res.state);
		}
	});
}

function showProgress() {
	document.getElementById("progressSection").style.display = "block";
}

function hideProgress() {
	document.getElementById("progressSection").style.display = "none";
}

function showForm() {
	const f = document.getElementById("formSection");
	if (f) f.style.display = "block";
}

function hideForm() {
	const f = document.getElementById("formSection");
	if (f) f.style.display = "none";
}

function showCountdown() {
	document.getElementById("countdownTimer").style.display = "block";
}

function hideCountdown() {
	document.getElementById("countdownTimer").style.display = "none";
}

function syncCountdown(nextSendAt) {
	if (running && !paused && nextSendAt) {
		if (currentNextSendAt !== nextSendAt || !countdownIntervalId) {
			startCountdown(nextSendAt);
		} else {
			updateCountdownDisplay();
		}
	} else {
		stopCountdown();
	}
}

function startCountdown(nextSendAt) {
	currentNextSendAt = nextSendAt;
	showCountdown();
	updateCountdownDisplay();
	if (countdownIntervalId) clearInterval(countdownIntervalId);
	countdownIntervalId = setInterval(updateCountdownDisplay, 250);
}

function stopCountdown() {
	currentNextSendAt = null;
	if (countdownIntervalId) {
		clearInterval(countdownIntervalId);
		countdownIntervalId = null;
	}
	hideCountdown();
}

function updateCountdownDisplay() {
	if (!currentNextSendAt) return;
	const remainingMs = currentNextSendAt - Date.now();
	const remaining = Math.max(0, Math.floor(remainingMs / 1000));
	document.getElementById("countdown").textContent = remaining;
}

document.getElementById("start").onclick = async () => {
	commitPendingNumber();
	const rawNumbers = document.getElementById("numbers").value || "";
	let extracted = rawNumbers.match(/\+?\d{8,15}/g) || [];
	if (!extracted.length) {
		extracted = rawNumbers
			.split(/[,\n\r;]+/)
			.map((s) => s.trim())
			.filter(Boolean);
	}
	let numbers = extracted
		.map((n) => n.replace(/\D/g, ""))
		.filter((n) => n.length >= 12);

	// Remover duplicados
	numbers = [...new Set(numbers)];

	const rawList = rawNumbers
		.split(/[,\n\r;]+/)
		.map((s) => s.trim())
		.filter(Boolean);
	const normalizedFromRaw = rawList.map((s) => s.replace(/\D/g, ""));
	const invalids = normalizedFromRaw.filter((n) => n.length && n.length < 12);
	const msg1 = document.querySelector('[data-msg="1"]').value.trim();
	const msg2 = document.querySelector('[data-msg="2"]').value.trim();
	const msg3 = document.querySelector('[data-msg="3"]').value.trim();

	if (!msg1) {
		alert("Mensagem 1 é obrigatória");
		return;
	}

	if (!msg2) {
		alert("Mensagem 2 é obrigatória");
		return;
	}

	const messages = [msg1, msg2];
	if (msg3) messages.push(msg3);

	const minInterval = Number(document.getElementById("minInterval").value);
	const maxInterval = Number(document.getElementById("maxInterval").value);

	if (!numbers.length) {
		alert(
			"Preencha pelo menos um número válido (ex: 5511999999999 ou +5511999999999)",
		);
		return;
	}

	if (invalids.length) {
		alert(
			"Alguns números foram ignorados por estarem em formato inválido:\n" +
				invalids.join(", "),
		);
	}

	if (messages.length < 2) {
		alert("Preencha pelo menos duas mensagens");
		return;
	}

	if (!Number.isFinite(minInterval) || minInterval < 0) {
		alert("Intervalo mínimo deve ser um número maior ou igual a 0");
		return;
	}

	if (!Number.isFinite(maxInterval) || maxInterval < 0) {
		alert("Intervalo máximo deve ser um número maior ou igual a 0");
		return;
	}

	if (maxInterval < minInterval) {
		alert("Intervalo máximo deve ser maior que o mínimo");
		return;
	}

	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tab || !tab.id) {
		alert("Aba ativa nao encontrada");
		return;
	}

	await chrome.runtime.sendMessage({
		action: "start",
		tabId: tab.id,
		payload: { numbers, messages, minInterval, maxInterval },
	});

	requestState();
};

document.getElementById("pause").onclick = async () => {
	await chrome.runtime.sendMessage({ action: "togglePause" });
	requestState();
};

document.getElementById("stop").onclick = async () => {
	await chrome.runtime.sendMessage({ action: "stop" });
	requestState();
};

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
