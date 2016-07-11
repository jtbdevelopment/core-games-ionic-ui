var baseConfig = require('./karma-base.conf.js');

module.exports = function (config) {
  // Load base config
  baseConfig(config);

  config.files.push('dist/core-games-ionic-ui.js');
};
