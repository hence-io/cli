// Plugins
var _ = require('lodash');

// glush-utils
var glush = require('glush-util');

// inquirer steps
var step0 = require('./steps/destroy-step-confirm');

module.exports = function (opts, done) {
  opts = _.defaultsDeep(_.cloneDeep(opts), {
    finalize: function (err) {
      scaffold.done(err, scaffold.answers);
    }
  });

  var scaffold = glush.Scaffold(opts);

  scaffold.start([step0], done);

  return scaffold;
};
