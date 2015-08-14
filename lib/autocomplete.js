var complete = require('complete');

complete({
  program: 'hence',
  // Commands
  commands: {
    'vm': function(words, prev, cur) {
      complete.output(cur, ['init', 'up', 'reload', 'destroy', 'ssh']);
    }
  },
  commandOptions: {
    vm: ['--version']
  },
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
