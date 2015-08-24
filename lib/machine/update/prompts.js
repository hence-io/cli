// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var shell = require('hence-util').globalShell;
var conflict = require('gulp-conflict');
var template = require('gulp-template');
var path = require('path-extra');
var fs = require('fs-extra');

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
    install: function (answers, done) {
      var destDir = path.resolve(answers.dest);
      var configDestDir = destDir + '/config';

      if (currentMachine.path !== destDir) {
        // Directory change requested, so we move the repo
        fs.removeSync(destDir);
        fs.copySync(currentMachine.path, destDir);
      }

      // change to the destDir
      pushd(destDir);

      // Export to the the vagrant config file
      var stream = gulp.src(answers.files)
        .pipe(template(answers), {
          interpolate: /<%=(.+?)%>/g
        })
        // .pipe(conflict(configDestDir))
        .pipe(gulp.dest(configDestDir));

      popd();

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
