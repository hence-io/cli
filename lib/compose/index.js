require('../machine/globals');

var _ = require('lodash');
var path = require('path-extra');
var program = require('commander');
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
  .option("-d, --dir [directory]", "Directory containing the docker-compose.yml and rancher-compose files, if not in current directory.");

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
        composeArgs.unshift('--file=' + options.dir + '/docker-compose.yml');
        composeArgs.unshift('--rancher-file=' + options.dir + '/rancher-compose.yml');
      }

      if (command === 'rm') {
        composeArgs.push('-f');
      }

      var child = spawn(composeCommand, composeArgs, function (code) {
        if (code !== 0) {
          return logger.error('Process exited with a non-zero status.');
        }

        // All done!
        inquisitorAscii.done('', true);
        return logger.info('Compose `' + command + '` ran successfully on ' + machine.name + ' VM!\n');
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

if (!process.argv.slice(2).length) {
  logo();
  process.argv.push('--help');
}

program._name = _.last(process.argv[1].split('/')).replace('hence-', '');

program.parse(process.argv);
