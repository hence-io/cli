require('./globals');

var _ = require('lodash');
var S = require('string');
var program = require('commander');
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var Machine = require('./machine')();
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

program.parse(process.argv);
