require('../machine/globals');
require('./globals');

var _ = require('lodash');
var S = require('string');
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
  logoMessage += ' (' + initialProject.name + ')';
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

/**
 * List all available projects
 */
program
  .command('list')
  .description('List all available projects')
  .option('-m, --machine', 'Specify a machine to mount to check mount status on.  Defaults to current machine name.')
  .action(function (options) {
    logo('small', logoMessage);

    Machine.get(options.machine, function (err, machine) {
      if (err) return logger.error(err);

      Project.list(machine, function (err, projects) {

        if (err) return logger.error(err);
        var message = projects.length ? 'Available projects (* denotes currently selected, (M) denotes currently mounted):\n' + projects + '\n' : 'No projects available.  Create one with `hence project init`';
        // All done!
        return logger.info(message);
      });
    });
  });

/**
 * Get and set the current project definition
 */
program
  .command('current [name]')
  .description('Get the current project definition, or set it by providing a name argument')
  .action(function (name) {
    logo('small', logoMessage);
    if (_.isString(name)) {
      return Project.setCurrent(name, function (err, project) {
        if (err) return logger.error(err);

        // All done!
        return console.log('\n');
      });
    }

    Project.getCurrent(function (err, project) {
      if (err) return logger.error(err);

      // All done!
      return logger.info('Current project is `' + project.machine_name +'`\n');
    });
  });

/**
 * Mount a Project
 */
program
  .command('mount [name]')
  .description('Mount a Project into a VM')
  .option('-m, --machine', 'Specify a machine to mount to.  Defaults to current machine name.')
  .action(function (name, options) {
    logo('small', logoMessage);

    Machine.get(options.machine, function (err, machine) {
      if (err) return logger.error(err);

      Project.get(name, function (err, project) {
        if (err) return logger.error(err);

        Project.mount(project, machine, function (err, project) {
          if (err) return logger.error(err);

          // All done!
          return logger.info('`' + project.machine_name + '` project successfully mounted in the `' + machine.name + '` VM\n');
        });
      });
    });
  });

/**
 * Unmount a Project
 */
program
  .command('unmount [name]')
  .description('Unmount a Project from a VM')
  .option('-m, --machine', 'Specify a machine to unmount from.  Defaults to current machine name.')
  .option('-a, --all', 'Unmount all projects from VM.')
  .action(function (name, options) {
    logo('small', logoMessage);

    Machine.get(options.machine, function (err, machine) {
      if (err) return logger.error(err);

      if (options.all) {
        projects = Project.getProjects();
        totalProjects = Object.keys(projects).length;
        totalProcessed = 0;

        _.forEach(projects, function (project, key) {
          Project.unmount(project, machine, function (err, result) {
            totalProcessed ++;

            if (err) logger.error(err);

            var message = '`' + project.machine_name + '` project ' + result + ' from the `' + machine.name + '` VM';

            if (totalProcessed === totalProjects) {
              message += '\n';
            }

            // All done!
            return logger.info(message);
          });
        });
      }
      else {
        Project.get(projectName, function (err, project) {
        if (err) return logger.error(err);

        Project.unmount(project, machine, function (err, result) {
          if (err) return logger.error(err);

          // All done!
          return logger.info('`' + project.machine_name + '` project ' + result + ' from the `' + machine.name + '` VM\n');
        });
      });
      }
    });
  });

/**
 * View a Project's configuration
 */
program
  .command('config [name]')
  .description('View a Project\'s configuration')
  .action(function (name) {
    logo('small', logoMessage);

    Project.get(name, function (err, project) {
      if (err) return logger.error(err);

      var config = '';
      _.forEach(project, function (val, key) {
        config += S('').padLeft(6).s + [key.toUpperCase(), val].join(': ') + '\n';
      });
      // All done!
      return logger.info('`' + project.machine_name + '` project configuration:\n' + config);
    });
  });

programUtil.subCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
