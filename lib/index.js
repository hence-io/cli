require('./machine/globals');

var _ = require('lodash');
var program = require('commander');
var logger = require('hence-util').logger;
var pack = require('../package.json');
var logo = require('./logo');

program
  .version(pack.version)
  .command('machine [command]', 'Manage a hence.io Machine')
  .command('vm [command]', 'Alias of `hence machine`')
  .command('compose [command]', 'Convenience wrapper for `rancher-compose`')
  .command('project [command]', 'Manage a hence.io Project');

if (!process.argv.slice(2).length) {
  process.argv.push('help');
}

var helpCommands = [
  'help',
  '-h',
  '--help',
];

var programOptions = program.parseOptions(process.argv);
var command = programOptions.args[2] || programOptions.unknown[0];

commandExists = helpCommands.indexOf(command) >= 0 || program._execs[command] || program._events[command];

if (!commandExists) {
  logo('small', 'Command Not Found');
  logger.error('"' + command + '" is not a recognized command.');
  process.argv.splice(2, process.argv.length - 2);
  process.argv.push('help');
}
else if (_.intersection(process.argv, helpCommands).length) {
  logo();
}

program.parse(process.argv);
