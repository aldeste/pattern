const gulp = require('gulp'),
  path = require('path'),
  browserSync = require('browser-sync').create(),
  argv = require('minimist')(process.argv.slice(2)),
  sass = require('gulp-sass'),
  config = require('./patternlab-config.json'),
  patternlab = require('patternlab-node')(config);
  paths = config.paths;

/**
 * Styles
 */
 gulp.task('sass', () => {
   return gulp.src('source/scss/style.scss')
     .pipe(sass.sync().on('error', sass.logError))
     .pipe(gulp.dest('source/css')) .pipe(browserSync.stream());
 });

/******************************************************
 * COPY TASKS - stream assets from source to destination
******************************************************/
// JS copy
gulp.task('pl-copy:js', () => {
  return gulp.src('**/*.js', {cwd: path.resolve(paths.source.js)})
    .pipe(gulp.dest(path.resolve(paths.public.js)));
});

// Images copy
gulp.task('pl-copy:img', () => {
  return gulp.src('**/*.*', {cwd: path.resolve(paths.source.images)})
    .pipe(gulp.dest(path.resolve(paths.public.images)));
});

// Favicon copy
gulp.task('pl-copy:favicon', () => {
  return gulp.src('favicon.ico', {cwd: path.resolve(paths.source.root)})
    .pipe(gulp.dest(path.resolve(paths.public.root)));
});

// Fonts copy
gulp.task('pl-copy:font', () => {
  return gulp.src('*', {cwd: path.resolve(paths.source.fonts)})
    .pipe(gulp.dest(path.resolve(paths.public.fonts)));
});

// CSS Copy
gulp.task('pl-copy:css', () => {
  return gulp.src(path.resolve(paths.source.css, '*.css'))
    .pipe(gulp.dest(path.resolve(paths.public.css)))
    .pipe(browserSync.stream());
});

// Styleguide Copy everything but css
gulp.task('pl-copy:styleguide', () => {
  return gulp.src(path.resolve(paths.source.styleguide, '**/!(*.css)'))
    .pipe(gulp.dest(path.resolve(paths.public.root)))
    .pipe(browserSync.stream());
});

// Styleguide Copy and flatten css
gulp.task('pl-copy:styleguide-css', () => {
  return gulp.src(path.resolve(paths.source.styleguide, '**/*.css'))
    .pipe(gulp.dest(function (file) {
      // flatten anything inside the styleguide into a single output
      // dir per http://stackoverflow.com/a/34317320/1790362
      file.path = path.join(file.base, path.basename(file.path));
      return path.resolve(path.join(paths.public.styleguide, 'css'));
    }))
    .pipe(browserSync.stream());
});

/******************************************************
 * PATTERN LAB CONFIGURATION - API with core library
 ******************************************************/
//read all paths from our namespaced config file
function getConfiguredCleanOption() {
  return config.cleanPublic;
}

function build(done) {
  patternlab.build(done, getConfiguredCleanOption());
}

gulp.task('pl-assets', gulp.series(
  gulp.parallel(
    'pl-copy:js',
    'pl-copy:img',
    'pl-copy:favicon',
    'pl-copy:font',
    'pl-copy:css',
    'pl-copy:styleguide',
    'pl-copy:styleguide-css'
  ),
  function(done) {
    done();
  }));

gulp.task('patternlab:version', function(done) {
  patternlab.version();
  done();
});

gulp.task('patternlab:help', function(done) {
  patternlab.help();
  done();
});

gulp.task('patternlab:patternsonly', function(done) {
  patternlab.patternsonly(done, getConfiguredCleanOption());
});

gulp.task('patternlab:liststarterkits', function(done) {
  patternlab.liststarterkits();
  done();
});

gulp.task('patternlab:loadstarterkit', function(done) {
  patternlab.loadstarterkit(argv.kit, argv.clean);
  done();
});

gulp.task('patternlab:build', gulp.series('pl-assets', build, function(done) {
  done();
}));

/******************************************************
 * SERVER AND WATCH TASKS
******************************************************/
// watch task utility functions
function getSupportedTemplateExtensions() {
  var engines = require('./node_modules/patternlab-node/core/lib/pattern_engines');
  return engines.getSupportedFileExtensions();
}
function getTemplateWatches() {
  return getSupportedTemplateExtensions().map(dotExtension => {
    return path.resolve(paths.source.patterns, '**/*' + dotExtension);
  });
}

function reload() {
  browserSync.reload();
}

function reloadCSS() {
  browserSync.reload('*.css');
}

function watch() {
  gulp.watch(path.resolve(paths.source.css, '**/*.css'), {
    awaitWriteFinish: true
  }).on('change', gulp.series('pl-copy:css', reloadCSS));

  gulp.watch('source/scss/**/*.scss', {
    awaitWriteFinish: true
  }).on('change', gulp.series('sass', 'pl-copy:css', reloadCSS))

  gulp.watch(path.resolve(paths.source.styleguide, '**/*.*'), {
    awaitWriteFinish: true
  }).on('change', gulp.series('pl-copy:styleguide', 'pl-copy:styleguide-css', reloadCSS));

  var patternWatches = [
    path.resolve(paths.source.patterns, '**/*.json'),
    path.resolve(paths.source.patterns, '**/*.md'),
    path.resolve(paths.source.data, '*.json'),
    path.resolve(paths.source.fonts + '/*'),
    path.resolve(paths.source.images + '/*'),
    path.resolve(paths.source.meta, '*'),
    path.resolve(paths.source.annotations + '/*')
  ].concat(getTemplateWatches());

  gulp.watch(patternWatches, {
    awaitWriteFinish: true
  }).on('change', gulp.series(build, reload));
}

gulp.task('patternlab:connect', gulp.series(done => {
  browserSync.init({
    server: {
      baseDir: path.resolve(paths.public.root)
    },
    snippetOptions: {
      // Ignore all HTML files within the templates folder
      blacklist: ['/index.html', '/', '/?*']
    },
    notify: {
      styles: [
        'display: none',
        'padding: 15px',
        'font-family: sans-serif',
        'position: fixed',
        'font-size: 1em',
        'z-index: 9999',
        'bottom: 0px',
        'right: 0px',
        'border-top-left-radius: 5px',
        'background-color: #1B2032',
        'opacity: 0.4',
        'margin: 0',
        'color: white',
        'text-align: center'
      ]
    }
  }, () => {
    console.log('PATTERN LAB NODE WATCHING FOR CHANGES');
    done();
  });
}));

/******************************************************
 * COMPOUND TASKS
******************************************************/
// gulp.task('default', gulp.series('patternlab:build'));
gulp.task('patternlab:watch', gulp.series('patternlab:build', watch));
gulp.task('patternlab:serve', gulp.series('patternlab:build', 'patternlab:connect', watch));
gulp.task('default', gulp.series('sass', 'patternlab:build', 'patternlab:connect', watch))
