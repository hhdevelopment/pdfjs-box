var gulp = require('gulp'),
		  fs = require('fs'),
		  del = require('del'),
		  concat = require("gulp-concat"),
		  replace = require('gulp-replace'),
		  dist = process.argv.indexOf('--dev')!==-1?'../websites/pdfjs-box/node_modules/pdfjs-box/dist':'dist';

console.log("Build folder '%s'", dist);
gulp.task('default', ['clean', 'build']);

gulp.task('build', function () {
	var pdfthumbnails = compact(fs.readFileSync('src/pdfthumbnails.html', 'utf8'));
	var pdfthumbnail = compact(fs.readFileSync('src/pdfthumbnail.html', 'utf8'));
	var pdfview = compact(fs.readFileSync('src/pdfview.html', 'utf8'));
	var pdfcommands = compact(fs.readFileSync('src/pdfcommands.html', 'utf8'));
	gulp.src('src/pdfjsbox.css').pipe(gulp.dest(dist));
	return gulp.src('src/pdfjsbox.*.js')
			  .pipe(concat("pdfjsbox.js"))
			  .pipe(replace("require('./pdfthumbnails.html')", "\"" + pdfthumbnails + "\""))
			  .pipe(replace("require('./pdfthumbnail.html')", "\"" + pdfthumbnail + "\""))
			  .pipe(replace("require('./pdfview.html')", "\"" + pdfview + "\""))
			  .pipe(replace("require('./pdfcommands.html')", "\"" + pdfcommands + "\""))
			  .pipe(gulp.dest(dist));
});
function compact(src) {
	return src.toString().replace(/[\n\r]/g, "").replace(/\t+/g, " ").replace(/\"/g, "\\\"");
}
gulp.task('clean', function () {
	return del.sync(['dist/**/*']);
});
