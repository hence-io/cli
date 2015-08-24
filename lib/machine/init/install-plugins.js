var _ = require('lodash');
var shell = require('shelljs/global');
var logger = require('hence-util').logger;

module.exports = function (next) {
  var execOpts = {
    silent: true
  };

  var plugins = [
    'vagrant-vbguest',
    'vagrant-gatling-rsync',
    'vagrant-hostsupdater'
  ];

  var missing = [];

  _.forEach(plugins, function (plugin) {
    var check = exec("vagrant plugin list | grep -w " + plugin + " 2>&1 >/dev/null", execOpts);
    if (check.code !== 0) {
      missing.push(plugin);
    }
  });

  if (missing.length) {
    var toInstall = missing.join(' ');

    // Install missing plugins
    exec('vagrant plugin install ' + toInstall, {silent: false}, function (code, output) {
      if (code !== 0) {
        return next("Process exited with a non-zero status.");
      }
      return next(null, 'Installed Plugins: ' + toInstall.replace(' ', ', '));
    });

  }
  else {
    return next(null, 'All recommended plugins were already installed');
  }
};
