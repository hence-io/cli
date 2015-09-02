// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var shell = require('hence-util').globalShell;
var conflict = require('gulp-conflict');
var template = require('gulp-template');
var fs = require('fs-extra');

// hence-inquisitor
var inquisitor = require('hence-inquisitor');

// inquirer steps
var steps = [
  require('./steps/update-step-location'),
  require('./steps/update-step-config'),
  require('./steps/update-step-complete')
];

var currentMachine = global.vm.currentMachine;

var opts = {
  defaults: {
    dirs: {
      template: {
        customConfig: __dirname + '/template/custom.rb'
      }
    }
  },
  steps: steps,
  content: {
    intro: inquisitor.colors.bold(' Welcome to the Hence.io Machine Update Wizard.\n') + ' Please provide the requested configuration details as prompted.'
  },
  install: function (answers, done) {
    var destDir = answers.dest;
    var configDestDir = destDir + '/config';

    if (currentMachine.path !== destDir) {
      // Directory change requested, so we move the repo
      fs.removeSync(destDir);
      fs.copySync(currentMachine.path, destDir);
    }

    // change to the destDir
    cd(destDir);

    // Export to the the vagrant config file
    var stream = gulp.src(answers.files)
      .pipe(template(answers), {
        interpolate: /<%=(.+?)%>/g
      })
      // .pipe(conflict(configDestDir))
      .pipe(gulp.dest(configDestDir));

    return done(null, stream);
  },
  finalize: function (err) {
    this.done(err, this.answers);
  }
};

var scaffold = inquisitor.Scaffold(opts);

module.exports = scaffold;
