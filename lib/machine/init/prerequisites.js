var shell = require('shelljs/global');
var logger = require('hence-util').logger;

module.exports = function (next) {
  var execOpts = {
    silent: true
  };

  var vagrantCheck = exec("vagrant -v | grep -w '1.[7-9].[2-9]'", execOpts);
  var virtualBoxCheck = exec("vboxmanage -v | grep -w '4.[3-9].[0-9]\\|[5-9].[0-9].[0-9]'", execOpts);

  logger.info('Checking Install Prerequisites...');

  if (virtualBoxCheck.code !== 0) {
    return next('Please install Virtualbox 4.3.0 or newer (https://www.virtualbox.org/wiki/Downloads).');
  }
  logger.info('Virtualbox 4.3.0 or newer installed.');


  if (vagrantCheck.code !== 0) {
    return next('Please install Vagrant 1.7.2 or newer (https://www.vagrantup.com/downloads.html).');
  }
  logger.info('Vagrant 1.7.2 or newer installed.\n');

  return next(null, true);
};
