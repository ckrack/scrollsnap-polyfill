'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    plumber = require('gulp-plumber'),
    notifier = require('node-notifier'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    stripDebug = require('gulp-strip-debug'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    project = require('./package.json');

var paths = {
  src: './src/**/*.js',
  dist: '.dist/',
  vendor: './vendor/**/*.js',
  output: './dist'
};


gulp.task('build:unbundled', function() {
  return gulp.src(paths.src)
    .pipe(plumber({errorHandler: function (err) {
      gutil.log(
        gutil.colors.red("js compile error:"),
        err.message
      );

      notifier.notify({ title: 'Error in Task "build:unbundled"', message: err.message });
    }}))
    .pipe(uglify())
    .pipe(gulp.dest(paths.output));
});

gulp.task('build:bundled', function() {
  return gulp.src([ paths.vendor, paths.src ])
    .pipe(plumber({errorHandler: function (err) {
      gutil.log(
        gutil.colors.red("Sass compile error:"),
        err.message
      );

      notifier.notify({ title: 'Error in Task "build:bundled"', message: err.message });
    }}))
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
    port: 3005,
    startPath: 'index.html',
    notify: false,
    server: {
      baseDir: ['.', 'demo']
    }
  });
});



gulp.task('dist', ['build'], function () {
    return gulp.src(paths.output+'/**/*.js')
        .pipe(stripDebug())
        .pipe(gulp.dest(paths.output));
});

// build: generates uglified version
// and adds vendor scripts polyfill & smoothscroll
gulp.task('build', [ 'build:bundled', 'build:unbundled' ]);

// assign default gulp task
gulp.task('default', [ 'browser-sync', 'build', 'watch']);
