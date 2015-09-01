var _ = require('lodash');
var inquisitor = require('hence-inquisitor');

var options = {};

var defaults = {
  beginDelete: false
};

var step = inquisitor.ScaffoldStep({
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
