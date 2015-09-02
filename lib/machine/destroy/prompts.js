// Plugins
var _ = require('lodash');

// hence-inquisitor
var inquisitor = require('hence-inquisitor');

// inquirer steps
var steps = [
  require('./steps/destroy-step-confirm')
];

var opts = {
  steps: steps,
  finalize: function (err) {
    this.done(err, this.answers);
  }
};

var scaffold = inquisitor.Scaffold(opts);

module.exports = scaffold;
