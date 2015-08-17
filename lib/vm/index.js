require('./globals');

var program = require('commander');
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var beep = require('glush-util').beep;
var Machine = require('./machine')();


/**
 * Init a new VM
 */
program
  .command('init')
  .description('Initialize a new hence vm')
  .action(function(){
    // Check Prequisites
    Machine.checkPrerequisites(function (err, ready) {
      if (err) return logger.error(err);

      // Start interactive console prompts
      Machine.startWizard('init', function (err, answers) {
        if (err) return logger.error(err);

        Machine.create(answers, function (err, created) {
          if (err) return logger.error(err);
          logger.info("Machine definition created.", created);

          Machine.up(created, function (err) {
            if (err) return logger.error(err);

            // All done!
            console.log(glushAscii.spacer());
            glushAscii.done('VM Initialization Complete!', true);
            beep();

            exec('open http://' + answers.name + ':' + answers.port);
          });
        });
      });
    });
  });

/**
 * Bring up a VM
 */
program
  .command('up [name]')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Up Called');
  });

/**
 * Restart up a VM
 */
program
  .command('restart')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Restart Called');
  });

/**
 * Stop up a VM
 */
program
  .command('stop')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Stop Called');
  });

/**
 * Connect up a VM dashboard
 */
program
  .command('connect')
  .description('Connect to the hence Rancher instance')
  .action(function(){
    console.log('Connect Called');
  });

/**
 * SSH into a VM
 */
program
  .command('ssh')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Up Called');
  });

/**
 * Update the hence environment
 */
program
  .command('update')
  .description('Update the hence environment')
  .action(function(){
    console.log('Update Called');
  });

/**
 * Destroy a VM
 */
program
  .command('destroy [name]')
  .description('Destroy a hence vm')
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

          // All done!
          console.log(glushAscii.spacer());
          glushAscii.done('"' + name + '" VM Destroyed!', true);
          beep();
        });
      });
    });
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
