var _ = require('lodash');
var shell = require('shelljs/global');

module.exports = function (next) {
  var execOpts = {
    silent: true
  };

  var dependancies = [
    'docker|1.9.0',
    'rancher-compose|0.5.2|gte|v'
  ];

  var missing = [];

  _.forEach(dependancies, function (dependancy) {
    var pkg = dependancy.split('|');
    var name = pkg[0];
    var minVersion = pkg[1];
    var comparator = pkg[2] || 'eq';
    var versionPrefix = pkg[3] || '';

    var checkString = "";

    switch (comparator) {
      case 'gte':
        var vParts = minVersion.split('.');
        checkString = versionPrefix + vParts[0] + '.[' + vParts[1] + '-9]' + '.[' + vParts[2] + '-9]';
        checkString += '\\|[' + versionPrefix + (parseInt(vParts[0], 10) + 1) + '-9].[0-9].[0-9]';
        break;

      case 'eq':
        checkString = versionPrefix + minVersion;
        break;
    }

    var check = exec(name + " -v | grep -w '" + checkString + "'", execOpts);

    if (check.code !== 0) {
      missing.push(name);
    }
  });

  if (missing.length) {
    var installCommands = [];

    _.forEach(missing, function (name) {
      switch (name) {
        case 'docker':
          installCommand = 'rm -f /usr/local/bin/docker && ' +
              'curl -L https://get.docker.com/builds/Darwin/x86_64/docker-1.9.0 > /usr/local/bin/docker && ' +
              'chmod +x /usr/local/bin/docker';
          break;

        case 'rancher-compose':
          installCommand = 'rm -f /usr/local/bin/rancher-compose && ' +
              'curl -L https://github.com/rancher/rancher-compose/releases/download/v0.5.2/rancher-compose-darwin-amd64-v0.5.2.tar.gz | ' +
              'tar xzf - -C /usr/local/bin --strip-components 2 && ' +
              'chmod +x /usr/local/bin/rancher-compose';
          break;
      }

      installCommands.push(installCommand);
    });

    // Install missing dependancies
    exec(installCommands.join(' && '), {silent: false}, function (code, output) {
      if (code !== 0) {
        return next('Process exited with a non-zero status.');
      }
      return next(null, 'Installed Packages: ' + missing.join(', '));
    });
  }
  else {
    return next(null, 'All recommended packages were already installed');
  }
};
