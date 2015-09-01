// Plugins
var _ = require('lodash');

// hence-inquisitor
var inquisitor = require('hence-inquisitor');

// inquirer steps
var step0 = require('./steps/destroy-step-confirm');

module.exports = function (opts, done) {
  opts = _.defaultsDeep(_.cloneDeep(opts), {
    finalize: function (err) {
      scaffold.done(err, scaffold.answers);
    }
  });

  var scaffold = inquisitor.Scaffold(opts);

  scaffold.start([step0], done);

  return scaffold;
};
