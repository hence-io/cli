var shell = require('shelljs/global');
var logger = require('hence-util').logger;

/**
 * Initialize the vagrant vm
 * @param  {Object} config [the machine definition]
 * @param  {Function} next [callback]
 */
module.exports = function (config, next) {
  var execOpts = {
    silent: false, // Setting to true allows init to exit with non-zero codes in some cases
    async: true
  };

  cd(config.path);
  var child = exec('vagrant destroy --force ' + config.name, execOpts);

  child.on('error', function(err) {
    logger.error(err.replace(/\n$/, ""));
  });

  child.on('close', function (code, signal) {
    return next();
  });
};
