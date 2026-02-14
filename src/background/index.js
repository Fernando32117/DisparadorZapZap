importScripts(
	"../shared/constantes.js",
	"../shared/tipos.js",
	"../shared/tempo.js",
	"../shared/aleatoriedade.js",
	"../shared/armazenamento.js",
	"./estado-disparo.js",
	"./envio-whatsapp.js",
	"./controlador-disparo.js",
);

globalThis.ZapZapBackground.controladorDisparo
	.criarControladorDisparo()
	.init();
