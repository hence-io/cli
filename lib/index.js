var program = require('commander');
var pack = require('../package.json');
var logo = require('./logo');

require('./autocomplete');

program
  .version(pack.version)
  .command('machine [command]', 'Manage a hence.io Machine')
  .command('vm [command]', 'Alias of `machine`');

if (!process.argv.slice(2).length) {
  logo();
  program.outputHelp();
}

program.parse(process.argv);
