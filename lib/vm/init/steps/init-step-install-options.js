var _ = require('lodash');
var glush = require('glush-util');

var options = {
  installOptions: {
    detailed: 'Detailed. I crave control.',
    quick: 'Quick. I trust you.'
  }
};

var defaults = {
  installOption: options.installOptions.detailed
};

var step = glush.ScaffoldStep({
  options: options,
  defaults: defaults,
  prompts: [
    {
      type: 'list',
      name: 'installOption',
      message: 'Preform a quick set up, or detailed?',
      choices: _.values(options.installOptions),
      "default": defaults.installOptions
    }
  ]
});

module.exports = step;
