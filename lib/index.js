require('./machine/globals');

var _ = require('lodash');
var program = require('commander');
var pack = require('../package.json');
var logo = require('./logo');

program
  .version(pack.version)
  .command('machine [command]', 'Manage a hence.io Machine')
  .command('vm [command]', 'Alias of `hence machine`')
  .command('compose [command]', 'Convenience wrapper for `rancher-compose`')
  .command('project [command]', 'Manage a hence.io Project');

if (!process.argv.slice(2).length) {
  process.argv.push('--help');
}

if (_.includes(process.argv, '--help') || _.includes(process.argv, 'help') || _.includes(process.argv, '-h')) {
  logo();
}

program.parse(process.argv);
