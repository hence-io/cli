require('./machine/globals');

var program = require('commander');
var pack = require('../package.json');
var shell = require('hence-util').globalShell;
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var Machine = require('./machine/machine')();
var logo = require('./logo');

var logoMessage = '';
var initialMachine = Machine.getCurrent();

if (initialMachine.name) {
  logoMessage += ' (' + initialMachine.name + ')';
}

require('./autocomplete');

program
  .version(pack.version)
  .command('machine [command]', 'Manage a hence.io Machine')
  .command('vm [command]', 'Alias of `hence machine`')
  .command('project [command]', 'Manage a hence.io Project');

program
  .command('compose [command]')
  .description('Alias of `rancher-compose`')
  .option("-m, --machine [name]", "Which hence machine to use")
  .action(function(command, options){
    var _compose = function (command, machine) {
      var composeCommand = 'rancher-compose';

      var composeArgs = [
        '--url=' + Machine.getDashboardPath(machine),
        '--access-key=' + machine.apiKey.publicValue,
        '--secret-key=' + machine.apiKey.secretValue,
        command
      ];

      if (command === 'rm') {
        composeArgs.push('-f');
      }

      var child = spawn(composeCommand, composeArgs, function (code) {
        if (code !== 0) {
          return logger.error('Process exited with a non-zero status.');
        }

        // All done!
        glushAscii.done('', true);
        return logger.info('Compose `' + command + '` ran successfully on ' + machine.name + ' VM!\n');
      });
    };

    logo('small', 'Compose');

    if (options.machine) {
      Machine.get(options.machine, function (err, machine) {
        if (err) return logger.error(err);

        // Set up connection to the machine if no apiKeys are present
        if (!machine.apiKey) {
          Machine.connect(machine, function (err, instructions, machine) {
            if (err) return logger.error(err);

            _compose(command, machine);
          });
        }
        else {
          _compose(command, machine);
        }
      });
    } else {
      _compose(command, initialMachine);
    }

  });

if (!process.argv.slice(2).length) {
  logo();
  program.outputHelp();
}

program.parse(process.argv);
