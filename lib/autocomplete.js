var _ = require('lodash');
var complete = require('complete');

var commands = {
  machine: function(words, prev, cur) {
    complete.output(cur, ['init', 'start', 'restart', 'destroy', 'provision', 'ssh', 'kill-running-processes']);
  }
};

var commandOptions = {
  machine: ['--version']
};

// Set up any aliases
var commandAliases = {
  machine: 'vm'
};

_.forEach(commandAliases, function (alias, key) {
  commands[alias] = commands[key];
  commandOptions[alias] = commandOptions[key];
});

complete({
  program: 'hence',
  // Commands
  commands: commands,
  commandOptions: commandOptions,
  // Position-independent options.
  // These will attempted to be
  // matched if `commands` fails
  // to match.
  options: {
    '--help': {},
    '-h': {},
    '--version': {}
  }
});
