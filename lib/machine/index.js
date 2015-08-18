require('./globals');

var _ = require('lodash');
var program = require('commander');
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var beep = require('glush-util').beep;
var Machine = require('./machine')();

/**
 * Initialize a new VM
 */
program
  .command('init')
  .description('Initialize a new VM')
  .action(function(){
    // Check Prequisites
    Machine.checkPrerequisites(function (err, ready) {
      if (err) return logger.error(err);

      // Start interactive console prompts
      Machine.startWizard('init', function (err, answers) {
        if (err) return logger.error(err);

        // Create the machine definition from the prompt anwers
        Machine.create(answers, function (err, created) {
          if (err) return logger.error(err);
          logger.info('Machine definition created for `' + created.name + '`');

          // Start and provision the vagrant vm
          Machine.up(created, function (err) {
            if (err) return logger.error(err);

            // Set this machine as current
            Machine.setCurrent(created, function (err, current) {
              if (err) return logger.error(err);

              // All done!
              glushAscii.done('VM Initialization Complete!', true);
              beep();

              exec('open http://' + answers.name + ':' + answers.port);
            });
          });
        });
      });
    });
  });

/**
 * Get the current machine definition
 */
program
  .command('current [name]')
  .description('Get the current machine definition, or set it by providing a name argument')
  .action(function(name){
    if (_.isString(name)) {
      return Machine.setCurrent(name, function (err, current) {
        if (err) return logger.error(err);

        // All done!
        logger.info('Current machine set to `' + current.name +'`');
      });
    }

    return Machine.getCurrent(function (err, current) {
      if (err) return logger.error(err);

      // All done!
      logger.info('Current machine is `' + current.name +'`');
    });
  });

/**
 * Start a VM
 */
program
  .command('up [name]')
  .description('Start a VM')
  .action(function(){
    console.log('Up Called');
  });

/**
 * Restart a VM
 */
program
  .command('restart [name]')
  .description('Restart a VM')
  .action(function(){
    console.log('Restart Called');
  });

/**
 * Stop a VM
 */
program
  .command('stop [name]')
  .description('Stop a VM')
  .action(function(){
    console.log('Stop Called');
  });

/**
 * Connect to a hence machine VM and/or Rancher Dashboard
 */
program
  .command('connect [name]')
  .description('Connect to a hence machine VM and/or Rancher Dashboard')
  .action(function(){
    console.log('Connect Called');
  });

/**
 * Run up a watch to sync a VM's shared folders
 */
program
  .command('watch [name]')
  .description('Run up a watch to sync a VM\'s shared folders')
  .action(function(){
    console.log('Connect Called');
  });

/**
 * Run a one-time sync for a VM's shared folders
 */
program
  .command('sync [name]')
  .description('Run a one-time sync for a VM\'s shared folders')
  .action(function(){
    console.log('Connect Called');
  });

/**
 * SSH into a VM
 */
program
  .command('ssh [name]')
  .description('SSH into a VM')
  .action(function(){
    console.log('SSH Called');
  });

/**
 * Update a VM
 */
program
  .command('update [name]')
  .description('Update a VM')
  .action(function(){
    console.log('Update Called');
  });

/**
 * Destroy a VM
 */
program
  .command('destroy [name]')
  .description('Destroy a vm')
  .action(function (name) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);
      if (!machine) return logger.error('No machine with the name "' + name + '" exists.');

      Machine.startWizard('destroy', function (err, answers) {
        if (!answers.beginDelete) {
          return console.log(glushAscii.aborted('VM Deletion Aborted.'));
        }

        Machine.destroy(name, function (err, deleted) {
          if (err) return logger.error(err);

          // If this machine is the current, remove it
          var current = Machine.getCurrent();
          if (current && current.name === name) {
            Machine.setCurrent({}, function (err, current) {
              if (err) return logger.error(err);

              // All done!
              glushAscii.done('"' + name + '" VM Destroyed!', true);
              beep();
            });
          }
        });
      });
    });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
