var program = require('commander');
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var beep = require('glush-util').beep;

require('./autocomplete');

program
  .command('init')
  .description('Initialize a new hence vm')
  .action(function(){
    // Check Prequisites
    require('./init/prereq')(function (err, ready) {
      if (err) return logger.error(err);

      // Start interactive console prompts
      var prompts = require('./init/prompts')(function (err, answers) {
        if (err) return logger.error(err);

        // logger.info(answers);

        require('./init/init')(answers, function (err) {
          if (err) return logger.error(err);

          // All done!
          console.log(glushAscii.spacer());
          glushAscii.done('VM Initialization Complete!', true);
          beep();
        });
      });
    });
  });

program
  .command('up')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Up Called');
  });

program
  .command('restart')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Restart Called');
  });

program
  .command('stop')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Stop Called');
  });


program
  .command('connect')
  .description('Connect to the hence Rancher instance')
  .action(function(){
    console.log('Connect Called');
  });

program
  .command('ssh')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Up Called');
  });

program
  .command('update')
  .description('Update the hence environment')
  .action(function(){
    console.log('Update Called');
  });

program
  .command('destroy')
  .description('Bring up the hence vm')
  .action(function(){
    console.log('Up Called');
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
