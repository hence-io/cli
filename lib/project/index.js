require('../machine/globals');
require('./globals');

var _ = require('lodash');
var program = require('commander');
var programUtil = require('../util/program');
var logger = require('hence-util').logger;
var inquisitorAscii = require('hence-inquisitor').ascii;
var Machine = require('../machine/machine')();
var logo = require('../logo');
var logoMessage = 'Project';
var initialMachine = Machine.getCurrent();
var initialProject = Project.getCurrent();

if (initialProject.name) {
  logoMessage += ' (' + initialMachine.name + ')';
}

/**
 * Initialize a new VM
 */
program
  .command('init')
  .description('Initialize a new Project')
  .action(function () {
    logo();

    // Start interactive console prompts
      Project.startWizard('init', function (err, answers) {
        if (err) return logger.error(err);

        if (!answers.beginInstall) {
          inquisitorAscii.aborted('', true);
          return logger.info('VM Installation Aborted.\n');
        }

        // Install recommended vagrant plugins if required
        Project.installRecommendedPlugins(function (err, result) {
          if (err) return logger.error(err);

          logger.info(result);

          // Create the machine definition from the prompt anwers
          Project.create(answers, function (err, machine) {
            if (err) return logger.error(err);
            logger.info('Project definition created for `' + machine.name + '`');

            // Start and provision the vagrant vm
            var command = 'vagrant';
            var args = ['up', '--provision'];

            Project.execTty(machine, command, args, function (err) {
              if (err) return logger.error(err);

              // All done!
              inquisitorAscii.done('', true);
              logger.info(machine.name + ' VM started and set to current machine!\n');

              // Open up the Dashboard in browser
              var dashboardPath = Project.getDashboardPath(machine);
              exec('open ' + dashboardPath);
            });
          });
        });
      });
    });

  });

programUtil.subCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
