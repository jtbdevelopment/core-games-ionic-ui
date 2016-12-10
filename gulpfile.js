var gulp = require('gulp');
var karma = require('karma').server;
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var path = require('path');
var plumber = require('gulp-plumber');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var bump = require('gulp-bump');
var git = require('gulp-git');
var filter = require('gulp-filter');
var tagVersion = require('gulp-tag-version');
var minifyHtml = require('gulp-htmlmin');
var angularTemplateCache = require('gulp-angular-templatecache');
/**
 * File patterns
 **/

// Root directory
var rootDirectory = path.resolve('./');

// Source directory for build process
var sourceDirectory = path.join(rootDirectory, './src');
var testDirectory = path.join(rootDirectory, './test');

var htmlFiles = [
    path.join(sourceDirectory, '/**/*.html')
];

var generatedTemplates = path.join(sourceDirectory, '/**/templates/templates.js');

var sourceFiles = [
    // Make sure module files are handled first
    path.join(sourceDirectory, '/**/*.module.js'),

    // Then add all JavaScript files
    path.join(sourceDirectory, '/**/*.js')
];

var allSourceFiles = [].concat(sourceFiles).concat(generatedTemplates);

var testFiles = [
    // Then add all JavaScript files
    path.join(testDirectory, '/**/*.js')
];

var lintFiles = [
    'gulpfile.js',
    // Karma configuration
    'karma-*.conf.js',
    //  exclude generated for line too long issue
    '!' + generatedTemplates
].concat(sourceFiles);

/**
 * Bumping version number and tagging the repository with it.
 * Please read http://semver.org/
 *
 * You can use the commands
 *
 *     gulp patch     # makes v0.1.0 → v0.1.1
 *     gulp feature   # makes v0.1.1 → v0.2.0
 *     gulp release   # makes v0.2.1 → v1.0.0
 *
 * To bump the version numbers accordingly after you did a patch,
 * introduced a feature or made a backwards-incompatible release.
 */

function inc(importance) {
    // get all the files to bump version in
    return gulp.src(['./package.json', './bower.json'])
    // bump the version number in those files
        .pipe(bump({type: importance}))
        // save it back to filesystem
        .pipe(gulp.dest('./'))
        // commit the changed version number
        .pipe(git.commit('bumps package version'))

        // read only one file to get the version number
        .pipe(filter('package.json'))
        // **tag it in the repository**
        .pipe(tagVersion());
}

gulp.task('patch', function () {
    return inc('patch');
});
gulp.task('feature', function () {
    return inc('minor');
});
gulp.task('release', function () {
    return inc('major');
});

gulp.task('cache-html', function () {
    gulp
        .src(htmlFiles)
        .pipe(minifyHtml({collapseWhitespace: true}))
        .pipe(angularTemplateCache('templates.js', {
            root: 'views/core-bs/',
            module: 'coreGamesBootstrapUi.templates',
            standalone: false,
            base: path.join(sourceDirectory, '/core-games-bootstrap-ui/templates/')
        }))
        .pipe(gulp.dest(path.join(sourceDirectory, '/core-games-bootstrap-ui/templates/')));
});

gulp.task('build', function () {
    gulp.src(allSourceFiles)
        .pipe(plumber())
        .pipe(concat('core-games-ionic-ui.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(uglify())
        .pipe(rename('core-games-ionic-ui.min.js'))
        .pipe(gulp.dest('./dist'));
});

/**
 * Process
 */
gulp.task('process-all', function (done) {
    runSequence('cache-html', 'jshint', 'test-src', 'build', done);
});

/**
 * Watch task
 */
gulp.task('watch', function () {

    // Watch JavaScript files
    gulp.watch(htmlFiles, ['process-all']);
    gulp.watch(sourceFiles, ['process-all']);
    gulp.watch(testFiles, ['process-all']);
});

/**
 * Validate source JavaScript
 */
gulp.task('jshint', function () {
    return gulp.src(lintFiles)
        .pipe(plumber())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/**
 * Run test once and exit
 */
gulp.task('test-src', function (done) {
    karma.start({
        configFile: __dirname + '/karma-src.conf.js',
        singleRun: true
    }, done);
});

/**
 * Run test once and exit
 */
gulp.task('test-dist-concatenated', function (done) {
    karma.start({
        configFile: __dirname + '/karma-dist-concatenated.conf.js',
        singleRun: true
    }, done);
});

/**
 * Run test once and exit
 */
gulp.task('test-dist-minified', function (done) {
    karma.start({
        configFile: __dirname + '/karma-dist-minified.conf.js',
        singleRun: true
    }, done);
});

gulp.task('default', function () {
    runSequence('process-all', 'watch');
});
