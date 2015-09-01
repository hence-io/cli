var _ = require('lodash');
var inquisitor = require('hence-inquisitor');

var options = {
  installOptions: {
    custom: 'Set up my own custom configuration.',
    defaults: 'Go with the defaults.'
  }
};

var defaults = {
  installOption: options.installOptions.custom
};

var step = inquisitor.ScaffoldStep({
  options: options,
  defaults: defaults,
  prompts: [
    {
      type: 'list',
      name: 'installOption',
      message: 'Perform a custom set up, or use the default settings?',
      choices: _.values(options.installOptions),
      "default": defaults.installOptions
    }
  ]
});

module.exports = step;
