/*
 * To run in staging mode: $ gulp
 * To run in production mode: $ gulp --type production
 */

// Modules
var autoprefixer = require('gulp-autoprefixer');
var babelify = require('babelify');
var browserify = require('browserify');
var browsersync = require('browser-sync');
var buffer = require('vinyl-buffer');
var cache = require('gulp-cached');
var connect = require('gulp-connect-php');
var del = require('del');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var imagemin = require('gulp-imagemin');
var jpegoptim = require('imagemin-jpegoptim');
var looseenvify = require('loose-envify/custom');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');
var watchify = require('watchify');

// Settings
var phpPort = 8000;
var phpRouter = 'router.php';

var dest = './compiled-assets';

var sassSrc = './assets/stylesheets/styles.scss';
var sassDest = './compiled-assets/stylesheets';
var sassGlob = './assets/stylesheets/**/*.scss';

var jsSrc = './assets/scripts/index.js';
var jsDest = './compiled-assets/scripts';
var jsGlob = './assets/scripts/**/*.js';

var imagesDest = './compiled-assets/images';
var imagesGlob = './assets/images/**/*';
var imagesOptimizationLevel = 5;

var fontsDest = './compiled-assets/fonts';
var fontsGlob = './assets/fonts/**/*';

// Sass
gulp.task('sass', function() {
  return gulp.src(sassSrc)

    // Genereate source maps only in production stage
    .pipe(plumber({errorHandler: notify.onError({
      message: '<%= error.message %>',
      title: 'Error in sass'
    })}))

    .pipe(gulpif(gutil.env.type !== 'production', sourcemaps.init()))
      .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulpif(gutil.env.type !== 'production', sourcemaps.write()))

    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))

    .pipe(plumber.stop())
    .pipe(gulp.dest(sassDest))
    .pipe(browsersync.stream());
});

if (gutil.env.type === 'production') {
  process.env.NODE_ENV = 'production';
}

// Javascript
var bundler = browserify(jsSrc, {
  insertGlobals: true,
  cache: {},
  packageCache: {},
  fullPaths: gutil.env.type !== 'production',
  debug: gutil.env.type !== 'production',
  transform: [[babelify, { presets: ['es2015'] }]],
});

bundler.transform(looseenvify({
  _: 'purge',
  NODE_ENV: 'production',
}), {
  global: true,
});

if (gutil.env.type !== 'production') {
  bundler = watchify(bundler);
  bundler.on('update', bundle);
}

gulp.task('js', bundle);

function bundle() {
  return bundler
    .bundle()
    .on('error', notify.onError({
      message: '<%= error.message %>',
      title: 'Error in javascript'
    }))
    .pipe(source('bundle.js'))
    .pipe(gulpif(gutil.env.type === 'production', buffer()))
    .pipe(gulpif(gutil.env.type === 'production', uglify()))
    .pipe(gulp.dest(jsDest))
    .pipe(browsersync.stream({once: true}));
}

// Images - gif, jpeg, png and svg
gulp.task('images', function() {
  // if (gutil.env.type === 'production') {
  //   return gulp.src(imagesGlob)
  //     .pipe(imagemin({
  //       optimizationLevel: imagesOptimizationLevel,
  //       progressive: true,
  //       interlaced: true,
  //       multipass: true,
  //       use: [jpegoptim({ max: 80 })],
  //     }))
  //     .pipe(gulp.dest(imagesDest));
  // } else {
    return gulp.src(imagesGlob)
      .pipe(gulp.dest(imagesDest));
  // }
});

// Fonts
gulp.task('fonts', function() {
  return gulp.src(fontsGlob)
    .pipe(gulp.dest(fontsDest));
});

// Watch
gulp.task('watch', function() {

  watch(sassGlob, function() {
    gulp.start('sass');
  });

  watch(imagesGlob, function() {
    gulp.start('images');
  });

  watch(fontsGlob, function() {
    gulp.start('fonts');
  });

  watch(['./**/*.php', './**/*.html', './**/*.js', '!node_modules/**'], function() {
    browsersync.reload();
  });
});

// // Clean
// gulp.task('clean', function(cb) {
//   del([dest], cb);
// });

// Php server
gulp.task('run', ['js', 'sass', 'images', 'fonts'], function() {
  connect.server({ router: phpRouter }, function() {
    browsersync.init({
      proxy: '127.0.0.1:' + phpPort,
      xip: false,
      open: false,
      notify: false
    });
  });
});

// Default
gulp.task('default', function() {
  // Don't watch when a production build is made
  if (gutil.env.type === 'production') {
    gulp.start('js');
    gulp.start('sass');
    gulp.start('images');
    gulp.start('fonts');
  } else {
    gulp.start('watch');
    gulp.start('run');
  }
});
