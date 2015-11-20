var _ = require('lodash');
var inquisitor = require('hence-inquisitor');
var path = require('path-extra');
var fs = require('fs-extra');
var yaml = require('js-yaml');
var Project = require('../../project')();

var step = inquisitor.ScaffoldStep({
  // defaults: getDefaults(),
  defaults: function () { return global.project.getDefaults(); },
  content: {
    header: {
      title: "Project Configuration Details",
      details: "Please set your initial Project configuration. These options can be changed at a later point."
    }
  },
  prompts: [
    {
      name: 'name',
      message: 'What is your Human-Readable Project name?',
      "default": function () { return global.project.getDefaults().name; },
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a project name', true)
    },
    {
      name: 'machine_name',
      message: 'What is your Project\'s machine name?',
      "default": function () { return global.project.getDefaults().machine_name; },
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a project machine name', true)
    },
    {
      name: 'mount_rsync',
      message: "What folder(s) would you like mounted over Rsync?\n This method is recommended for one-way mounting of application code, as it is more performant than nfs.",
      type: 'checkbox',
      choices: function () { return global.project.getChoices('rsync'); },
    },
    {
      name: 'mount_nfs',
      message: "What folder(s) would you like mounted over NFS?\n This method is recommended for two-way mounting of application assets. More convenient.  Less performant.",
      type: 'checkbox',
      choices: function () { return global.project.getChoices('nfs'); },
    }
  ],
  process: function (answers, next) {
    // console.log('post_config_anwers', answers);

    // Check if vm name is already taken
    var project = Project.getProjects();

    if (project[answers.machine_name]) {
      // Already exists
      return next('A project with the name "' + answers.machine_name + '" already exists. \nPlease try again with a unique project name, or delete the existing project definition with:\n`hence project delete ' + answers.machine_name + '`');
    }

    return next();
  }
});

module.exports = step;
