const { src, watch, dest, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const uglifycss = require("gulp-uglifycss");
const rename = require("gulp-rename");
const terser = require("gulp-terser");
const concat = require("gulp-concat");

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
		.pipe(dest("./dist/js", { sourcemaps: true }));
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
		.pipe(dest("./dist/js/pages", { sourcemaps: true }));
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

exports.default = series(buildLibsJs, buildLibsCss, scssToCss, minifyCommonJs, minifyPagesJs, watchFiles);
exports.build = series(buildLibsJs, buildLibsCss, scssToCss, minifyCommonJs, minifyPagesJs);
