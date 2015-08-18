var _ = require('lodash');
var glush = require('glush-util');

var options = {};

var defaults = {
  beginInstall: true
};

var step = glush.ScaffoldStep({
  options: options,
  defaults: defaults,
  content: {
    header: {
      title: 'Installation Ready',
      details: glush.colors.bold("You've finished providing all of your installation details. ") +
      " We're ready to configure and install your package."
    }
  },
  prompts: [
    {
      type: 'confirm',
      name: 'beginInstall',
      message: 'Everything is set, shall we proceed to install your vm now?'
    }
  ],
  process: function (answers, next) {
    // Flag whether or not the user aborted the install process
    if (!answers.beginInstall) {
      answers.aborted = true;
    }

    return next();
  }
});

module.exports = step;
