var _ = require('lodash');
var inquisitor = require('hence-inquisitor');

var options = {};

var defaults = {
  beginUpdate: true
};

var step = inquisitor.ScaffoldStep({
  options: options,
  defaults: defaults,
  content: {
    header: {
      title: 'Configuration Changes Ready',
      details: inquisitor.colors.bold("You've finished providing all of your configuration details. ") +
      " We're ready to reconfigure and restart your VM."
    }
  },
  prompts: [
    {
      type: 'confirm',
      name: 'beginUpdate',
      message: 'Everything is set, shall we proceed to reconfigure and restart your VM now?'
    }
  ]
});

module.exports = step;
