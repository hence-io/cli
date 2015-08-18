// Plugins
var _ = require('lodash');

// glush-utils
var glush = require('glush-util');

// inquirer steps
var step0 = require('./steps/destroy-step-confirm');

var scaffold = glush.Scaffold({
  finalize: function (err) {
    scaffold.done(err, scaffold.answers);
  }
});

module.exports = function (done) {
  scaffold.start([step0], done);

  return scaffold;
};
