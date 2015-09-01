require('../machine/globals');

var _ = require('lodash');
var S = require('string');
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
 * Initialize a new Project
 */
program
  .command('init')
  .description('Initialize a new Project')
  .action(function () {
    logo();
  });


if (!process.argv.slice(2).length) {
  logo();
  program.outputHelp();
}

program._name = _.last(process.argv[1].split('/')).replace('hence-', '');

program.parse(process.argv);
