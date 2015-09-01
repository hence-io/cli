var _ = require('lodash');
var inquisitor = require('hence-inquisitor');

var options = {};

var defaults = {
  beginInstall: true
};

var step = inquisitor.ScaffoldStep({
  options: options,
  defaults: defaults,
  content: {
    header: {
      title: 'Installation Ready',
      details: inquisitor.colors.bold("You've finished providing all of your installation details. ") +
      " We're ready to configure and install your package."
    }
  },
  prompts: [
    {
      type: 'confirm',
      name: 'beginInstall',
      message: 'Everything is set, shall we proceed to install your VM now?'
    }
  ]
});

module.exports = step;
