/// Gulp configuration for Typescript, SASS and Live Reload
'use strict';

// initialize all the requried libraries and files
var gulp = require('gulp'),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    concat = require('gulp-concat'),
    typescript = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    packageConfig = require('./package.json'),
    config = {
        app: {
            source: './src',
            dest: './dist',
            exclusions: '(*.scss|*.ts)'
        },
        autoprefixer: {
            browsers: ['Safari >= 8', 'last 2 versions']
        },
        browserSync: {
            https: {
                key: "certificates/server.key",
                cert: "certificates/server.crt"
            },
            server: {
                baseDir: './dist',
                routes: {
                    '/node_modules': 'node_modules',
                    '/bower_components': 'bower_components',
                    '/rxjs': 'node_modules/rxjs'
                },
                middleware: {
                    1: require('connect-history-api-fallback')({
                        index: './index.html',
                        verbose: true
                    })
                }
            }
        }
    };

// create the typescript project for transpiling
var tsProject = typescript.createProject('./tsconfig.json');

// clean the destination folder
gulp.task('clean', function (done) {
    return rimraf('./dist', done);
});

gulp.task('compile:common:sass', function () {
    return gulp.src(config.app.source + '/styles/**/*.scss', { base: config.app.source })
        .pipe(sass())
        .pipe(autoprefixer(config.autoprefixer))
        .pipe(concat('common-styles.css'))
        .pipe(gulp.dest(config.app.dest))
        .pipe(browserSync.stream());
});

// compile sass files found in source folder into corresponding destination folders
gulp.task('compile:sass', function () {
    return gulp.src(config.app.source + '/app/**/*.scss')
        .pipe(sass())
        .pipe(autoprefixer(config.autoprefixer))
        .pipe(gulp.dest(config.app.dest + '/app'))
        .pipe(browserSync.stream());
});

// compile all typescript files
gulp.task('compile:ts', function () {
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject))

    tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config.app.dest))
        .pipe(browserSync.stream());
});

// copy anything that is not a sass file or typescript file
gulp.task('copy', function () {
    gulp.src(config.app.source + '/**/!' + config.app.exclusions, { base: config.app.source })
        .pipe(gulp.dest(config.app.dest))
});

gulp.task('build', ['compile:sass', 'compile:common:sass', 'compile:ts', 'copy']);

// start webserver and observe fiels for changes
gulp.task('serve', ['build'], function () {
    browserSync.init(config.browserSync);

    gulp.watch(config.app.source + '/app/**/*.scss', ['compile:sass']);
    gulp.watch(config.app.source + '/styles/**/*.scss', ['compile:common:sass']);
    gulp.watch(config.app.source + '/**/*.ts', ['compile:ts']);

    gulp.watch(config.app.source + '/**/!' + config.app.exclusions, ['copy'])
        .on('change', browserSync.reload);
});