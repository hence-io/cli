require('../machine/globals');
require('./globals');

var _ = require('lodash');
var program = require('commander');
var programUtil = require('../util/program');
var logger = require('hence-util').logger;
var inquisitorAscii = require('hence-inquisitor').ascii;
var Machine = require('../machine/machine')();
var Project = require('./project')();
var logo = require('../logo');
var logoMessage = 'Project';
var initialMachine = Machine.getCurrent();
var initialProject = Project.getCurrent();

if (initialProject.name) {
  logoMessage += ' (' + initialMachine.name + ')';
}

/**
 * Initialize a new Project
 */
program
  .command('init')
  .description('Initialize a new Project')
  .action(function () {
    logo();
    // Start interactive console prompts
    Project.startWizard('init', function (err, answers) {
      if (err) return logger.error(err);

      if (!answers.createProject) {
        inquisitorAscii.aborted('', true);
        return logger.info('VM Installation Aborted.\n');
      }

      // Create the machine definition from the prompt anwers
      Project.create(answers, function (err, project) {
        if (err) return logger.error(err);
        logger.info('Project definition created for `' + project.name + '`');
      });
    });

  });

programUtil.subCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
