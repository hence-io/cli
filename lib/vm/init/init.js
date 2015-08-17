var shell = require('shelljs/global');
var logger = require('hence-util').logger;

module.exports = function (answers, next) {
  var execOpts = {
    silent: false, // Setting to true allows init to exit with non-zero codes in some cases
    async: true
  };

  cd(answers.dest);
  var child = exec('vagrant up', execOpts);

  // child.stdout.on('data', function(data) {
  //   logger.info(data.replace(/\n$/, ""));
  // });

  child.on('error', function(err) {
    logger.error(err.replace(/\n$/, ""));
  });

  child.on('close', function (code, signal) {
    if (code !== 0) {
      return next("Init exited with a non-zero status.");
    }

    return next();
  });
};
