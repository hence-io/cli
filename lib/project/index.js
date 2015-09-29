require('../machine/globals');
require('./globals');

var _ = require('lodash');
var program = require('commander');
var programUtil = require('../util/program');
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
 * Initialize a new VM
 */
program
  .command('init')
  .description('Initialize a new VM')
  .action(function () {
    logo();

  });

programUtil.subCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
