'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    project = require('./package.json');

var paths = {
  src: './src/' + project.name + '.js',
  dist: '.dist/' + project.name + '.js',
  vendor: './vendor/**/*.js',
  output: './dist'
}


gulp.task('build:unbundled', function() {
  return gulp.src(paths.src)
    .pipe(uglify())
    .pipe(gulp.dest(paths.output));
});

gulp.task('build:bundled', function() {
  return gulp.src([ paths.vendor, paths.src ])
    .pipe(concat(project.name + '.bundled.js'))
    .pipe(uglify())
    .pipe(gulp.dest(paths.output))
    .pipe(reload({stream: true}));
});

gulp.task('watch', function () {
  gulp.watch('demo/*').on('change', function () {
    reload();
  });
  gulp.watch('src/*.js', ['build']);
});

gulp.task('browser-sync', function () {
  return browserSync.init({
    open: true,
    port: 3000,
    startPath: 'index.html',
    notify: false,
    server: {
      baseDir: ['.', 'demo']
    }
  });
});

// build: generates uglified version
// and adds vendor scripts polyfill & smoothscroll
gulp.task('build', [ 'build:bundled', 'build:unbundled' ]);

// assign default gulp task
gulp.task('default', [ 'browser-sync', 'build', 'watch']);
