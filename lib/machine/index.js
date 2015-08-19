require('./globals');

var _ = require('lodash');
var program = require('commander');
var logger = require('hence-util').logger;
var glushAscii = require('glush-util').ascii;
var Machine = require('./machine')();
var logo = require('../logo');

/**
 * Initialize a new VM
 */
program
  .command('init')
  .description('Initialize a new VM')
  .action(function () {
    logo();

    // Check Prequisites
    Machine.checkPrerequisites(function (err, ready) {
      if (err) return logger.error(err);

      // Start interactive console prompts
      Machine.startWizard('init', function (err, answers) {
        if (err) return logger.error(err);

        // Start interactive console prompts
        Machine.installRecommendedPlugins(function (err, result) {
          if (err) return logger.error(err);

          logger.info(result);

          // Create the machine definition from the prompt anwers
          Machine.create(answers, function (err, machine) {
            if (err) return logger.error(err);
            logger.info('Machine definition created for `' + machine.name + '`');

            // Start and provision the vagrant vm
            var command = 'vagrant';
            var args = ['up', '--provision'];

            Machine.execTty(machine, command, args, function (err) {
              if (err) return logger.error(err);

              // Set this machine as current
              Machine.setCurrent(machine, function (err, machine) {
                if (err) return logger.error(err);

                // All done!
                glushAscii.done('', true);
                logger.info(machine.name + ' VM started and set to current machine!\n');

                // Open up the Dashboard in browser
                exec('open http://' + machine.name + ':' + machine.port);
              });
            });
          });
        });
      });
    });
  });

/**
 * Install recommended vagrant plugins
 */
program
  .command('install-vagrant-plugins')
  .description('Install recommended vagrant plugins')
  .action(function () {
    logo('small');

    // Check Prequisites
    Machine.checkPrerequisites(function (err, ready) {
      if (err) return logger.error(err);

      // Start interactive console prompts
      Machine.installRecommendedPlugins(function (err, result) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(result + '\n');
      });
    });
  });

/**
 * List all available machines
 */
program
  .command('list')
  .description('List all available machines')
  .action(function () {
    Machine.list(function (err, machines) {
      if (err) return logger.error(err);
      var message = machines.length ? 'Available machines:\n' + machines + '\n' : 'No machines available.  Create one with `hence machine init`';
      // All done!
      return logger.info(message);
    });
  });

/**
 * Get the current machine definition
 */
program
  .command('current [name]')
  .description('Get the current machine definition, or set it by providing a name argument')
  .action(function (name) {
    if (_.isString(name)) {
      return Machine.setCurrent(name, function (err, machine) {
        if (err) return logger.error(err);

        // All done!
        return logger.info('Current machine set to `' + machine.name + '`\n');
      });
    }

    Machine.getCurrent(function (err, machine) {
      if (err) return logger.error(err);

      // All done!
      return logger.info('Current machine is `' + machine.name +'`\n');
    });
  });

/**
 * Start a VM
 */
program
  .command('start [name]')
  .description('Start a VM')
  .action(function (name){
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Start and provision the vagrant vm
      Machine.exec(machine, 'vagrant up --provision', function (err) {
        if (err) return logger.error(err);

        // Set this machine as current
        Machine.setCurrent(machine, function (err, machine) {
          if (err) return logger.error(err);

          // All done!
          glushAscii.done('', true);
          return logger.info(machine.name + 'VM started and set to current machine!\n');
        });
      });
    });
  });

/**
 * Restart a VM
 */
program
  .command('restart [name]')
  .description('Restart a VM')
  .action(function (name) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Restart and provision the vagrant vm
      Machine.exec(machine, 'vagrant reload --provision', function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM restarted!\n');
      });
    });
  });

/**
 * Stop a VM
 */
program
  .command('stop [name]')
  .description('Stop a VM')
  .action(function (name) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Stop the vagrant vm
      Machine.exec(machine, 'vagrant halt', function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM stopped!\n');
      });
    });
  });


/**
 * Provision a VM
 */
program
  .command('provision [name]')
  .description('Provision a VM')
  .action(function (name) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Start and provision the vagrant vm
      Machine.exec(machine, 'vagrant provision', function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM Provisioned!\n');
      });
    });
  });

/**
 * Connect to a hence machine VM and/or Rancher Dashboard
 */
program
  .command('connect [name]')
  .description('Connect to a hence machine VM and/or Rancher Dashboard')
  .action(function (name) {
    console.log('Connect Called');
  });

/**
 * Syncronize a for a VM's shared folders
 */
program
  .command('sync [name]')
  .description('Sync a VM\'s shared folders with the host.  Runs in watch mode by default')
  .option('-s, --single-run', 'Run a one-time sync for a VM\'s shared folders')
  .action(function (name, options) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var mode = options.singleRun ? 'sync' : 'watch';
      var command = options.singleRun ? 'vagrant rsync' : 'vagrant gatling-rsync-auto';

      // Sync the vagrant vm
      Machine.exec(machine, command, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM folder ' + mode + ' completed!\n');
      });
    });
  });

/**
 * SSH into a VM
 */
program
  .command('ssh [name]')
  .description('SSH into a VM')
  .option('-s, --sudo', 'SSH in as root user')
  .action(function (name, options) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var command = 'vagrant';
      var args = ['ssh'];

      if (options.sudo) args.push('-c "su"');

      // SSH into the vagrant vm
      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM ssh session completed!\n');
      });
    });
  });

/**
 * Update a VM
 */
program
  .command('update [name]')
  .description('Update a VM')
  .action(function (name) {
    return console.log('Update Called');
  });

/**
 * Terminate all running vagrant processes that may be locking a VM
 */
program
  .command('killall [name]')
  .description('Terminate all running vagrant processes that may be locking a VM')
  .action(function (name) {
    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var command = 'ps | grep -v \'grep\' | grep vagrant | grep ' + machine.name + ' | awk \'{print $1}\' | xargs kill -9';

      // Kill vagrant processes
      Machine.exec(machine, command, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM processes killed!\n');
      });
    });
  });

/**
 * Destroy a VM
 */
program
  .command('destroy [name]')
  .description('Destroy a vm')
  .action(function (name) {
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);
      if (!machine) return logger.error('No machine with the name "' + name + '" exists.');

      Machine.startWizard('destroy', function (err, answers) {
        if (!answers.beginDelete) {
          return console.log(glushAscii.aborted('VM Deletion Aborted.'));
        }

        Machine.destroy(machine.name, function (err, deleted) {
          if (err) return logger.error(err);

          // If this machine is the current, remove it
          var current = Machine.getCurrent();
          if (current && current.name === machine.name) {
            Machine.setCurrent({}, function (err, current) {
              if (err) return logger.error(err);

              // All done!
              glushAscii.done('', true);
              return logger.info(machine.name + ' VM Destroyed!\n');
            });
          }
        });
      });
    });
  });



if (!process.argv.slice(2).length) {
  logo();
  program.outputHelp();
}

program.parse(process.argv);
