// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var git = require('gulp-git');
var conflict = require('gulp-conflict');
var template = require('gulp-template');

// glush-utils
var glush = require('glush-util');

// inquirer steps
var step0 = require('./steps/init-step-install-options');
var step1 = require('./steps/init-step-location');
var step2 = require('./steps/init-step-config');
var step3 = require('./steps/init-step-complete');

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
      intro: glush.colors.bold(' Welcome to the Hence.io Machine Setup Wizard.\n') + ' Please provide the requested configuration details as prompted.\n'
    },
    inquirer: {
      detailedInstallOnly: function () {
        return scaffold.answers.installOption === step0.options.installOptions.custom;
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
      scaffold.done(err, scaffold.answers);
    }
  });

  var scaffold = glush.Scaffold(opts);

  scaffold.start([step0, step1, step2, step3], done);

  return scaffold;
};
