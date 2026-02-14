(function () {
	const shared = (globalThis.ZapZapShared = globalThis.ZapZapShared || {});

	shared.constantes = {
		chaveDadosPopup: "zapzapData",
		chaveEstadoDisparoPublico: "dispatchState",
		chaveEstadoDisparoInterno: "dispatchInternalState",
		acaoStart: "start",
		acaoTogglePause: "togglePause",
		acaoStop: "stop",
		acaoGetState: "getState",
		acaoProgress: "progress",
		acaoSend: "send",
		acaoOpenChat: "openChat",
		alarmeProximoEnvio: "dispatch-next-send",
		timeoutSeguroMs: 25000,
		intervaloPadraoMin: 6,
		intervaloPadraoMax: 12,
	};
})();
