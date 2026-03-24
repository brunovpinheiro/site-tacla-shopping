const { src, watch, dest, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const uglifycss = require("gulp-uglifycss");
const rename = require("gulp-rename");
const terser = require("gulp-terser");
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const https = require("https");

// Configuração das bibliotecas de terceiros
const libsConfig = {
	js: ["./src/js/lib/fancybox.js"], // Adicione aqui os caminhos dos arquivos JS das bibliotecas quando necessário
	css: ["./src/scss/lib/fancybox.scss"],
};

// Concatenar e minificar bibliotecas JS
const buildLibsJs = (cb) => {
	if (libsConfig.js.length === 0) {
		console.log("⚠️  Nenhuma biblioteca JS configurada. Pulando buildLibsJs...");
		return cb();
	}
	return src(libsConfig.js, { sourcemaps: true })
		.pipe(concat("libs.js"))
		.pipe(terser())
		.pipe(rename("libs.min.js"))
		.pipe(dest("./dist/js", { sourcemaps: true }));
};

// Compilar bibliotecas SCSS para CSS
const buildLibsCss = () => {
	return src(libsConfig.css, { sourcemaps: true })
		.pipe(
			sass({
				api: "modern",
			}).on("error", sass.logError),
		)
		.pipe(concat("libs.css"))
		.pipe(
			uglifycss({
				uglyComments: true,
			}),
		)
		.pipe(rename("libs.min.css"))
		.pipe(dest("./dist/css", { sourcemaps: true }));
};

// Compilar SCSS para CSS
const scssToCss = () => {
	return src("./src/scss/*.scss", { sourcemaps: true })
		.pipe(
			sass({
				api: "modern",
			}).on("error", sass.logError),
		)
		.pipe(concat("style.css"))
		.pipe(
			uglifycss({
				uglyComments: true,
			}),
		)
		.pipe(rename("style.min.css"))
		.pipe(dest("./dist/css", { sourcemaps: true }))
		.pipe(browserSync.stream());
};

// Minificar JS comum
const minifyCommonJs = () => {
	return src("./src/js/common.js", { sourcemaps: true })
		.pipe(terser())
		.pipe(rename("common.min.js"))
		.pipe(dest("./dist/js", { sourcemaps: true }))
		.pipe(browserSync.stream());
};

// Minificar JS das páginas
const minifyPagesJs = () => {
	return src("./src/js/pages/*.js", { sourcemaps: true })
		.pipe(terser())
		.pipe(
			rename(function (path) {
				path.basename = path.basename + ".min";
			}),
		)
		.pipe(dest("./dist/js/pages", { sourcemaps: true }))
		.pipe(browserSync.stream());
};

// Servidor local com CORS habilitado
const serve = (cb) => {
	browserSync.init({
		server: {
			baseDir: "./dist",
			middleware: [
				function (req, res, next) {
					res.setHeader("Access-Control-Allow-Origin", "*");
					res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
					res.setHeader("Access-Control-Allow-Headers", "Content-Type");
					next();
				},
			],
		},
		port: 3000,
		open: false,
		notify: false,
		ui: false,
	});
	cb();
};

// Watch files
const watchFiles = () => {
	watch("./src/scss/**/*.scss", scssToCss);
	watch("./src/js/common.js", minifyCommonJs);
	watch("./src/js/pages/*.js", minifyPagesJs);

	// Só observa arquivos JS das libs se houver algum configurado
	if (libsConfig.js.length > 0) {
		watch(libsConfig.js, buildLibsJs);
	}

	watch(libsConfig.css, buildLibsCss);
};

// Purgar cache do JSDelivr
const purgeUrls = [
	"https://purge.jsdelivr.net/gh/brunovpinheiro/site-tacla-shopping/dist/js/common.min.js",
	"https://purge.jsdelivr.net/gh/brunovpinheiro/site-tacla-shopping/dist/css/style.min.css",
];

const purgeJsDelivr = (cb) => {
	let completed = 0;

	purgeUrls.forEach((url) => {
		https
			.get(url, (res) => {
				const file = url.split("/").pop();
				if (res.statusCode === 200) {
					console.log(`✅ Cache purgado: ${file}`);
				} else {
					console.warn(`⚠️  Resposta inesperada (${res.statusCode}): ${file}`);
				}
				completed++;
				if (completed === purgeUrls.length) cb();
			})
			.on("error", (err) => {
				console.error(`❌ Erro ao purgar cache: ${err.message}`);
				completed++;
				if (completed === purgeUrls.length) cb();
			});
	});
};

exports.purge = purgeJsDelivr;
exports.build = series(buildLibsJs, buildLibsCss, scssToCss, minifyCommonJs, minifyPagesJs);
exports.deploy = series(buildLibsJs, buildLibsCss, scssToCss, minifyCommonJs, minifyPagesJs, purgeJsDelivr);
exports.default = series(buildLibsJs, buildLibsCss, scssToCss, minifyCommonJs, minifyPagesJs, serve, watchFiles);
