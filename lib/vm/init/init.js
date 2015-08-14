var shell = require('shelljs/global');
var logger = require('hence-util').logger;

module.exports = function (answers, next) {
  var execOpts = {
    silent: true,
    async: true
  };

  cd(answers.dest);
  var child = exec('vagrant up', execOpts);

  child.stdout.on('data', function(data) {
    logger.info(data.replace(/\n$/, ""));
  });

  child.on('error', function(err) {
    return next(err);
  });

  child.on('close', function (code, signal) {
    if (code !== 0) {
      return next("Init exited with a non-zero status.");
    }

    return next();
  });
};
