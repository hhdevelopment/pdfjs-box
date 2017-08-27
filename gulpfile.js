var gulp = require('gulp'),
		  fs = require('fs'),
		  del = require('del'),
		  concat = require("gulp-concat"),
		  replace = require('gulp-replace');

gulp.task('default', ['clean', 'build']);

gulp.task('build', function () {
	var pdfthumbnails = compact(fs.readFileSync('src/pdfjsbox/pdfthumbnails.html', 'utf8'));
	var pdfthumbnail = compact(fs.readFileSync('src/pdfjsbox/pdfthumbnail.html', 'utf8'));
	var pdfview = compact(fs.readFileSync('src/pdfjsbox/pdfview.html', 'utf8'));
	var pdfcommands = compact(fs.readFileSync('src/pdfjsbox/pdfcommands.html', 'utf8'));
	gulp.src('src/pdfjsbox/pdfjsbox.css').pipe(gulp.dest('dist'));
	return gulp.src('src/pdfjsbox/pdfjsbox.*.js')
			  .pipe(concat("pdfjsbox.js"))
			  .pipe(replace("require('./pdfthumbnails.html')", "\"" + pdfthumbnails + "\""))
			  .pipe(replace("require('./pdfthumbnail.html')", "\"" + pdfthumbnail + "\""))
			  .pipe(replace("require('./pdfview.html')", "\"" + pdfview + "\""))
			  .pipe(replace("require('./pdfcommands.html')", "\"" + pdfcommands + "\""))
			  .pipe(gulp.dest('dist'));
});
function compact(src) {
	return src.toString().replace(/[\n\r]/g, "").replace(/\t+/g, " ").replace(/\"/g, "\\\"");
}
gulp.task('clean', function () {
	return del.sync(['dist/**/*']);
});
