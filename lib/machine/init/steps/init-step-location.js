var inquisitor = require('hence-inquisitor');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;

var defaults = {
  dest: path.homedir() + '/hence'
};

var step = inquisitor.ScaffoldStep({
  defaults: defaults,
  content: {
    header: {
      title: "Installation Location",
      details: "Select the install location for your Hence.io VM.\n The directory must be empty.  If it does not yet exist, we will try to create it for you."
    }
  },
  prompts: [
    {
      name: 'dest',
      message: 'What directory would you like to install to?',
      "default": defaults.dest,
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a response', true),
      when: function () { return this.inquirer.customInstallOnly(); }
    }
  ],
  process: function (answers, next) {
    // Trim trailing slash in destination path, and leading tilde with home dir, if present
    answers.dest = path.resolve(answers.dest.replace(/\/$/, '').replace(/^\~/, path.homedir()));

    // Ensure the destination directory exists, and that it's empty
    return fs.ensureDir(answers.dest, function (err) {
      if (err) {
        return next('Sorry, we were unable to create the `' + answers.dest + '` directory');
      }
      fs.readdir(answers.dest, function (err, files) {
        if (err) return next(err);
        if (files.length) return next('The directory `' + answers.dest + '` must be emptied before we can install to it.');
        return next();
      });
    });

  }
});

module.exports = step;
