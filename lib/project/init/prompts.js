// Plugins
var _ = require('lodash');
var gulp = require('gulp');
var conflict = require('gulp-conflict');
var template = require('gulp-template');
var fs = require('fs-extra');
var path = require('path-extra');


// hence-inquisitor
var inquisitor = require('hence-inquisitor');

// inquirer steps
var steps = [
  require('./steps/init-step-location'),
  require('./steps/init-step-config'),
  require('./steps/init-step-complete')
];

// var currentMachine = global.vm.currentMachine;

var opts = {
  steps: steps,
  content: {
    intro: inquisitor.colors.bold(' Welcome to the Hence.io Project Setup Wizard.\n') + ' Please provide the requested configuration details as prompted.'
  },
  inquirer: {},
  // install: function (answers, done) {

  //   return done(null);
  // },
  finalize: function (err) {
    this.done(err, this.answers);
  }
};

var scaffold = inquisitor.Scaffold(opts);

module.exports = scaffold;
