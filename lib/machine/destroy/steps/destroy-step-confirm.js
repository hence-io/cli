var _ = require('lodash');
var glush = require('glush-util');

var options = {};

var defaults = {
  beginDelete: false
};

var step = glush.ScaffoldStep({
  options: options,
  defaults: defaults,
  content: {
    header: {
      title: 'Deletion Confirmation Required.',
      details: 'Please confirm that you want to delete the ' + global.vm.current + ' VM (default: No)'
    }
  },
  prompts: [
    {
      type: 'confirm',
      name: 'beginDelete',
      'default': defaults.beginDelete,
      message: 'Are you sure you want to delete the ' + global.vm.current + ' VM?'
    }
  ]
});

module.exports = step;
