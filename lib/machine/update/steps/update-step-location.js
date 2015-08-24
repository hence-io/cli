var glush = require('glush-util');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;

var currentMachine = global.vm.currentMachine;

var defaults = {
  dest: currentMachine.path
};

var step = glush.ScaffoldStep({
  defaults: defaults,
  content: {
    header: {
      title: "Installation Location",
      details: "Set the file system location for your Hence.io VM.\n Only change this if you would like to move the current vm to a new location.\n Otherwise, hit 'enter' to continue."
    }
  },
  prompts: [
    {
      name: 'dest',
      message: 'What directory should your vm reside in?',
      "default": defaults.dest,
      validate: glush.inquirer.validatePrompt('isNull', 'You must provide a response', true)
    }
  ],
  process: function (answers, next) {
    // Trim trailing slash in destination path, and leading tilde with home dir, if present
    answers.dest = path.resolve(answers.dest.replace(/\/$/, '').replace(/^\~/, path.homedir()));

    if (answers.dest !== currentMachine.path) {
      // Ensure the new destination directory exists, and that it's empty
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

    return next();
  }
});

module.exports = step;
