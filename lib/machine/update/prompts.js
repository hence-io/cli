// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var shell = require('hence-util').globalShell;
var conflict = require('gulp-conflict');
var template = require('gulp-template');

// glush-utils
var glush = require('glush-util');

// inquirer steps
var step0 = require('./steps/update-step-location');
var step1 = require('./steps/update-step-config');
var step2 = require('./steps/update-step-complete');

var currentMachine = global.vm.currentMachine;

module.exports = function (opts, done) {
  opts = _.defaultsDeep(_.cloneDeep(opts), {
      defaults: {
      dirs: {
        template: {
          customConfig: __dirname + '/template/custom.rb'
        }
      }
    },
    content: {
      intro: glush.colors.bold(" Welcome to the Hence.io Machine Generator. ") + "Your vm generation is about to begin.\n"
    },
    inquirer: {
      detailedInstallOnly: function () {
        return scaffold.answers.installOption === step0.options.installOptions.custom;
      }
    },
    install: function (answers, done) {
      var destDir = answers.dest;
      if (currentMachine.path !== destDir) {
        // Directory change requested, so we move the repo
        mv(currentMachine.path, destDir);
      }

      // change to the destDir
      cd(destDir);

      // Export to the the vagrant config file
      var stream = gulp.src(answers.files)
        .pipe(template(answers), {
          interpolate: /<%=(.+?)%>/g
        })
        .pipe(conflict(configDestDir))
        .pipe(gulp.dest(configDestDir));

      return done(null, stream);
    },
    finalize: function (err) {
      scaffold.done(err, scaffold.answers);
    }
  });

  var scaffold = glush.Scaffold(opts);

  scaffold.start([step0, step1, step2], done);

  return scaffold;
};
