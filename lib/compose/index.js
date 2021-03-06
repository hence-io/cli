require('../machine/globals');

var _ = require('lodash');
var path = require('path-extra');
var program = require('commander');
var programUtil = require('../util/program');
var logger = require('hence-util').logger;
var inquisitorAscii = require('hence-inquisitor').ascii;
var Machine = require('../machine/machine')();
var logo = require('../logo');
var logoMessage = 'Project';
var initialMachine = Machine.getCurrent();

if (initialMachine.name) {
  logoMessage += ' (' + initialMachine.name + ')';
}

/**
 * Global program options
 */
program
  .option("-m, --machine [name]", "Which hence machine to use.")
  .option("-d, --dir [directory]", "Directory containing the docker-compose.yml and rancher-compose files, if not in current directory.")
  .option("-f, --file [filename]", "Specify an alternate compose file (default: docker-compose.yml)")
  .option("-r, --rancher-file [filename]", "Specify an alternate Rancher compose file (default: rancher-compose.yml)")
  .option("-p, --project-name [name]", "Specify an alternate project name (default: directory name)");

/**
 * Catch-all for rancher-compose commands
 */
program
  .command('*')
  .description('Run any `rancher-compose` command against a machine')
  .action(function(command, options){
    var rancherHelp = (command === 'help' || command === 'rancher-help');
    command = rancherHelp ? 'help' : command;

    var _compose = function (command, options, machine) {
      var composeCommand = 'rancher-compose';
      var file = options.file || 'docker-compose.yml';
      var rancherFile = options.rancherFile || 'rancher-compose.yml';

      if (!machine.apiKey) {
        logger.error('You must connect to a rancher machine before running this command.\n');
        logger.info('Connect to machine with:');
        return console.log('hence machine connect [machine_name]');
      }

      var composeArgs = [
        '--url=' + Machine.getDashboardPath(machine),
        '--access-key=' + machine.apiKey.publicValue,
        '--secret-key=' + machine.apiKey.secretValue,
        command
      ];

      if (options.dir) {
        options.dir = path.resolve(options.dir);
      }

      if (options.projectName) {
        composeArgs.unshift('--project-name=' + options.projectName);
      }

      composeArgs.unshift('--file=' + (options.dir ? options.dir + '/' : '' ) + file);
      composeArgs.unshift('--rancher-file=' + (options.dir ? options.dir + '/' : '' ) + rancherFile);

      if (command === 'rm') {
        composeArgs.push('-f');
      }

      var child = spawn(composeCommand, composeArgs, function (code) {
        if (code !== 0) {
          return logger.error('Process exited with a non-zero status.');
        }

        // All done!
        console.log('\n');
      });
    };

    if (!rancherHelp) {
      logo('small', 'Compose');
    }

    // Need to parse options ourselves here, as they don't work with the wildcard '*' command
    var commandOptions = program.opts();

    _.forEach(commandOptions, function (value, key) {
      options[key] = value;
    });

    if (options.machine) {
      Machine.get(options.machine, function (err, machine) {
        if (err) return logger.error(err);

        // Set up connection to the machine if no apiKeys are present
        if (!machine.apiKey) {
          Machine.connect(machine, function (err, instructions, machine) {
            if (err) return logger.error(err);

            _compose(command, options, machine);
          });
        }
        else {
          _compose(command, options, machine);
        }
      });
    } else {
      _compose(command, options, initialMachine);
    }
  });

program
  .command('rancher-help')
  .description('View the help text for rancher-compose');

programUtil.wrappedCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
