var _ = require('lodash');
var yaml = require('js-yaml');
var inquisitor = require('hence-inquisitor');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;
var shell = require('hence-util').globalShell;

var defaults = {
  dest: pwd(),
  yamlConfig: {},
  nfsChoices: [],
  rsyncChoices: []
};

var step = inquisitor.ScaffoldStep({
  defaults: defaults,
  content: {
    header: {
      title: "Project Location",
      details: "Let Hence know where of your project is found."
    }
  },
  prompts: [
    {
      name: 'dest',
      message: 'What is the root directory of your project?',
      "default": defaults.dest,
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a response', true)
    }
  ],
  process: function (answers, next) {
    // Trim trailing slash in destination path, and leading tilde with home dir, if present
    answers.dest = path.resolve(answers.dest.replace(/\/$/, '').replace(/^\~/, path.homedir()));

    // Ensure the destination directory exists, and that we have a hence.yml file in it
    return fs.ensureDir(answers.dest, function (err) {
      if (err) {
        return next('Sorry, we were unable to create the `' + answers.dest + '` directory');
      }

      cd(answers.dest);
      // global.project.projectDest = answers.dest;

      fs.ensureFile(answers.dest + '/hence.yml', function (err) {
        if (err) {
          return next('Sorry, we were unable to create a hence.yml file in the `' + answers.dest + '` directory');
        }

        global.project.projectDest = answers.dest;

        global.project.getDirectories = function getDirectories(srcpath) {
          return fs.readdirSync(srcpath).filter(function(file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
          });
        };

        global.project.getDefaults = function getDefaults() {
          var defaults = _.defaults(yaml.load(fs.readFileSync(global.project.projectDest + '/hence.yml', 'utf8')), {
            name: '',
            machine_name: '',
            mount: {
              nfs: [],
              rsync: [],
            }
          });
          return defaults;
        };

        global.project.defaults = global.project.getDefaults();

        global.project.getChoices = function getChoices(type) {
          // var pwd = pwd();
          var directories = global.project.getDirectories(global.project.projectDest);

          var choices = [];

          _.each(directories, function (dir, index) {
            var option = {
              name: dir
            };

            console.log (global.project.defaults);
            if (global.project.defaults.mount[type].indexOf(dir) >= 0) {
              option.checked = true;
            }
            choices.push(option);
          });

          return choices;
        };

        return next();
      });
    });
  }
});

module.exports = step;
