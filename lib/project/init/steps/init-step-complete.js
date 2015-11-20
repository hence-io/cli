var _ = require('lodash');
var inquisitor = require('hence-inquisitor');

var options = {};

var defaults = {
  createProject: true
};

var step = inquisitor.ScaffoldStep({
  options: options,
  defaults: defaults,
  content: {
    header: {
      title: 'Configuration Changes Ready',
      details: inquisitor.colors.bold("You've finished providing all of your Project details. ")
    }
  },
  prompts: [
    {
      type: 'confirm',
      name: 'createProject',
      message: 'Everything is set, shall we proceed to create this Project?'
    }
  ]
});

module.exports = step;
