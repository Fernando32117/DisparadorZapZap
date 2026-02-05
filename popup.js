let running = false;
let paused = false;
let successCount = 0;
let failedCount = 0;
let totalCount = 0;
let countdownIntervalId = null;
let currentNextSendAt = null;

window.addEventListener("DOMContentLoaded", async () => {
	loadSavedData();
	document.getElementById("numbers").addEventListener("input", saveData);
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

function saveData() {
	const data = {
		numbers: document.getElementById("numbers").value,
		minInterval: document.getElementById("minInterval").value,
		maxInterval: document.getElementById("maxInterval").value,
		message1: document.querySelector('[data-msg="1"]').value,
		message2: document.querySelector('[data-msg="2"]').value,
		message3: document.querySelector('[data-msg="3"]').value,
	};
	localStorage.setItem("zapzapData", JSON.stringify(data));
}

function loadSavedData() {
	const saved = localStorage.getItem("zapzapData");
	if (saved) {
		try {
			const data = JSON.parse(saved);
			document.getElementById("numbers").value = data.numbers || "";
			document.getElementById("minInterval").value = data.minInterval || 6;
			document.getElementById("maxInterval").value = data.maxInterval || 12;
			document.querySelector('[data-msg="1"]').value = data.message1 || "";
			document.querySelector('[data-msg="2"]').value = data.message2 || "";
			document.querySelector('[data-msg="3"]').value = data.message3 || "";
		} catch (e) {}
	}
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
	countdownIntervalId = setInterval(updateCountdownDisplay, 1000);
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
	const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
	document.getElementById("countdown").textContent = remaining;
}

document.getElementById("start").onclick = async () => {
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

	if (minInterval < 6) {
		alert("Intervalo mínimo deve ser 6 segundos");
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
