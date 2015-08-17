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
  var child = exec('vagrant up --provision', execOpts);

  child.on('close', function (code, signal) {
    if (code !== 0) {
      return next("Init exited with a non-zero status.");
    }

    return next();
  });
};
