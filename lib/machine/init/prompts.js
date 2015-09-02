// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var git = require('gulp-git');
var conflict = require('gulp-conflict');
var template = require('gulp-template');

// hence-inquisitor
var inquisitor = require('hence-inquisitor');

// inquirer steps
var steps = [
  require('./steps/init-step-install-options'),
  require('./steps/init-step-location'),
  require('./steps/init-step-config'),
  require('./steps/init-step-complete')
];

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
    intro: inquisitor.colors.bold(' Welcome to the Hence.io Machine Setup Wizard.\n') + ' Please provide the requested configuration details as prompted.\n'
  },
  inquirer: {
    customInstallOnly: function () {
      return scaffold.answers.installOption === steps[0].options.installOptions.custom;
    }
  },
  install: function (answers, done) {
    var destDir = answers.dest;
    var configDestDir = destDir + '/config';

    var cloneRemote = 'https://github.com/hence-io/hence.git';
    var cloneOptions = {
      cwd: destDir,
      quiet: false,
      args: '.'
    };

    // Clone the hence repo
    git.clone(cloneRemote, cloneOptions, function (err) {
      if (err) return done(err);

      // // Start building the pipe for installing the package
      var stream = gulp.src(answers.files)
        .pipe(template(answers), {
          interpolate: /<%=(.+?)%>/g
        })
        .pipe(conflict(configDestDir))
        .pipe(gulp.dest(configDestDir));

      return done(null, stream);
    });
  },
  finalize: function (err) {
    this.done(err, this.answers);
  }
};

var scaffold = inquisitor.Scaffold(opts);

module.exports =  scaffold;
