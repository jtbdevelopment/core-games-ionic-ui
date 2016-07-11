var baseConfig = require('./karma-base.conf.js');

module.exports = function (config) {
  // Load base config
  baseConfig(config);

  config.files.push('src/**/*.module.js');
  config.files.push('src/**/*.js');
  config.preprocessors = {
    // source files, that you wanna generate coverage for
    // do not include tests or libraries
    // (these files will be instrumented by Istanbul)
    'src/**/*.js': ['coverage']
  };
  config.reporters.push('coverage');
  config.coverageReporter = {
    type: 'html',
    dir: 'coverage/'
  };

};
