let running = false;
let paused = false;
let successCount = 0;
let failedCount = 0;
let totalCount = 0;

window.addEventListener("DOMContentLoaded", () => {
	loadSavedData();
	document.getElementById("numbers").addEventListener("input", saveData);
	document.getElementById("minInterval").addEventListener("input", saveData);
	document.getElementById("maxInterval").addEventListener("input", saveData);
	document.querySelectorAll(".msg").forEach((textarea) => {
		textarea.addEventListener("input", saveData);
	});
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

function showProgress() {
	document.getElementById("progressSection").style.display = "block";
}

function hideProgress() {
	document.getElementById("progressSection").style.display = "none";
}

function showCountdown() {
	document.getElementById("countdownTimer").style.display = "block";
}

function hideCountdown() {
	document.getElementById("countdownTimer").style.display = "none";
}

async function countdownTimer(seconds) {
	showCountdown();
	const countdownEl = document.getElementById("countdown");
	let remaining = Math.ceil(seconds);

	while (remaining > 0 && running && !paused) {
		countdownEl.textContent = remaining;
		await sleep(1000);
		remaining--;
	}

	hideCountdown();
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

	const messages = [...document.querySelectorAll(".msg")]
		.map((m) => m.value)
		.filter(Boolean);

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

	if (!messages.length) {
		alert("Preencha pelo menos uma mensagem");
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

	running = true;
	paused = false;
	resetProgress();
	totalCount = numbers.length;
	showProgress();
	updateProgress();

	document.getElementById("start").disabled = true;
	document.getElementById("pause").disabled = false;
	document.getElementById("stop").disabled = false;

	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	for (const number of numbers) {
		if (!running) break;

		while (paused) {
			await sleep(500);
		}

		const message = messages[Math.floor(Math.random() * messages.length)];

		// Tentar enviar com algumas tentativas, esperando carregamento do WhatsApp Web
		let sent = false;
		for (let attempt = 1; attempt <= 3 && !sent; attempt++) {
			try {
				await chrome.tabs.update(tab.id, {
					url: `https://web.whatsapp.com/send?phone=${number}`,
				});

				await sleep(7000);

				const response = await chrome.tabs.sendMessage(tab.id, {
					action: "send",
					message,
				});

				if (response && response.success) {
					sent = true;
					break;
				} else {
					await sleep(3000);
				}
			} catch (error) {
				await sleep(3000);
			}
		}

		if (sent) {
			successCount++;
		} else {
			failedCount++;
		}

		updateProgress();
		if (running && numbers.indexOf(number) < numbers.length - 1) {
			const randomDelay =
				minInterval + Math.random() * (maxInterval - minInterval);
			await countdownTimer(randomDelay);
		}
	}

	running = false;
	paused = false;
	document.getElementById("start").disabled = false;
	document.getElementById("pause").disabled = true;
	document.getElementById("stop").disabled = true;
};

document.getElementById("pause").onclick = () => {
	paused = !paused;
	const btn = document.getElementById("pause");
	if (paused) {
		btn.textContent = "▶️ Continuar";
	} else {
		btn.textContent = "⏸️ Pausar";
	}
};

document.getElementById("stop").onclick = () => {
	running = false;
	paused = false;
	document.getElementById("start").disabled = false;
	document.getElementById("pause").disabled = true;
	document.getElementById("stop").disabled = true;
	document.getElementById("pause").textContent = "⏸️ Pausar";
};

function sleep(ms) {
	return new Promise((res) => setTimeout(res, ms));
}
