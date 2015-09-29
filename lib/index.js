var _ = require('lodash');
var program = require('commander');
var programUtil = require('../util/program');
var pack = require('../package.json');

program
  .version(pack.version)
  .command('machine [command]', 'Manage a hence.io Machine')
  .command('vm [command]', 'Alias of `hence machine`')
  .command('compose [command]', 'Convenience wrapper for `rancher-compose`')
  .command('project [command]', 'Manage a hence.io Project');

programUtil.commandHelp(program);

program.parse(process.argv);
