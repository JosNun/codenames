'use strict';

const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('sass', () => {
  return gulp
    .src('site/styles/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('site/css'));
});

gulp.task('sass:watch', () => {
  gulp.watch('./site/styles/**/*.scss', ['sass']);
});
