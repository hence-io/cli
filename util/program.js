var _ = require('lodash');
var logo = require('../lib/logo.js');
var logger = require('hence-util').logger;

var commandHelp = function (program) {
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
  else if (process.argv.length < 5 && _.intersection(process.argv, helpCommands).length) {
    logo();
  }
};

var subCommandHelp = function (program) {
  if (!process.argv.slice(2).length || process.argv[2] === 'help') {
    if (process.argv[2] !== 'help') {
      logo();
    }

    process.argv.splice(2, process.argv.length - 2);
    process.argv.push('--help');
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
    process.argv.splice(2, process.argv.length -2);

    if (!_.intersection(process.argv, helpCommands).length) {
      process.argv.push('--help');
    }
  }
};

var wrappedCommandHelp = function (program) {
  if (!process.argv.slice(2).length || process.argv[2] === 'help') {
    if (process.argv[2] !== 'help') {
      logo();
    }

    process.argv.splice(2, process.argv.length - 2);
    process.argv.push('--help');
  }
};

var setSubCommandName = function (program) {
  program._name = _.last(process.argv[1].split('/')).replace('hence-', '');
};

module.exports = {
  commandHelp: commandHelp,
  subCommandHelp: subCommandHelp,
  wrappedCommandHelp: wrappedCommandHelp,
  setSubCommandName: setSubCommandName
};
