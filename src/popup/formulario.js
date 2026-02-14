(function () {
	const popup = (globalThis.ZapZapPopup = globalThis.ZapZapPopup || {});
	const { byId, mensagem } = popup.ui;
	const { estado } = popup;
	const { validacoes } = globalThis.ZapZapShared;

	function setupNumbersInput() {
		const input = byId("numbersInput");
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
		const btn = byId("clearNumbers");
		if (!btn) return;

		btn.addEventListener("click", () => {
			estado.numbersList = [];
			renderNumberChips();
			updateNumbersValue();
			popup.persistencia.salvarDados();
		});

		updateClearButtonState();
	}

	function commitPendingNumber() {
		const input = byId("numbersInput");
		if (!input) return;
		if (input.value && input.value.trim()) {
			addNumbersFromText(input.value);
			input.value = "";
		}
	}

	function setNumbersFromText(text) {
		estado.numbersList = [];
		addNumbersFromText(text, true);
	}

	function addNumbersFromText(text, replaceList) {
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
			estado.numbersList = [];
		}

		let changed = false;
		for (const number of toAdd) {
			if (!estado.numbersList.includes(number)) {
				estado.numbersList.push(number);
				changed = true;
			}
		}

		renderNumberChips();
		updateNumbersValue();

		if (changed) {
			popup.persistencia.salvarDados();
		}
	}

	function removeNumber(number) {
		const next = estado.numbersList.filter((n) => n !== number);
		if (next.length !== estado.numbersList.length) {
			estado.numbersList = next;
			renderNumberChips();
			updateNumbersValue();
			popup.persistencia.salvarDados();
		}
	}

	function removeLastNumber() {
		if (!estado.numbersList.length) return;
		estado.numbersList.pop();
		renderNumberChips();
		updateNumbersValue();
		popup.persistencia.salvarDados();
	}

	function renderNumberChips() {
		const container = byId("numbersChips");
		if (!container) return;
		container.innerHTML = "";

		for (const number of estado.numbersList) {
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
		const textarea = byId("numbers");
		if (!textarea) return;
		textarea.value = estado.numbersList.join("\n");
	}

	function updateClearButtonState() {
		const btn = byId("clearNumbers");
		if (!btn) return;
		btn.disabled = estado.numbersList.length === 0;
	}

	function coletarPayloadDisparo() {
		commitPendingNumber();

		const rawNumbers = byId("numbers").value || "";
		const numbers = validacoes.extrairTelefonesValidos(rawNumbers);
		const invalids = validacoes.extrairTelefonesInvalidos(rawNumbers);
		const msg1 = mensagem(1).value.trim();
		const msg2 = mensagem(2).value.trim();
		const msg3 = mensagem(3).value.trim();

		if (!msg1) {
			return { ok: false, error: "Mensagem 1 e obrigatoria" };
		}

		if (!msg2) {
			return { ok: false, error: "Mensagem 2 e obrigatoria" };
		}

		const messages = [msg1, msg2];
		if (msg3) messages.push(msg3);

		const minInterval = Number(byId("minInterval").value);
		const maxInterval = Number(byId("maxInterval").value);

		if (!numbers.length) {
			return {
				ok: false,
				error:
					"Preencha pelo menos um numero valido (ex: 5511999999999 ou +5511999999999)",
			};
		}

		if (messages.length < 2) {
			return { ok: false, error: "Preencha pelo menos duas mensagens" };
		}

		if (!Number.isFinite(minInterval) || minInterval < 0) {
			return {
				ok: false,
				error: "Intervalo minimo deve ser um numero maior ou igual a 0",
			};
		}

		if (!Number.isFinite(maxInterval) || maxInterval < 0) {
			return {
				ok: false,
				error: "Intervalo maximo deve ser um numero maior ou igual a 0",
			};
		}

		if (maxInterval < minInterval) {
			return { ok: false, error: "Intervalo maximo deve ser maior que o minimo" };
		}

		return {
			ok: true,
			payload: { numbers, messages, minInterval, maxInterval },
			invalids,
		};
	}

	popup.formulario = {
		setupNumbersInput,
		setupClearNumbers,
		commitPendingNumber,
		setNumbersFromText,
		coletarPayloadDisparo,
	};
})();
