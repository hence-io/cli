require('./globals');

var _ = require('lodash');
var S = require('string');
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
 * Start a VM
 */
program
  .command('start [name]')
  .description('Start a VM')
  .action(function (name){
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

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
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Restart and provision the vagrant vm
      var command = 'vagrant';
      var args = ['reload', '--provision'];

      Machine.execTty(machine, command, args, function (err) {
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
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Stop the vagrant vm
      var command = 'vagrant';
      var args = ['halt'];

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM stopped!\n');
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
    logo('small');

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
 * Syncronize a for a VM's shared folders
 */
program
  .command('sync [name]')
  .description('Sync a VM\'s shared folders with the host.  Runs in watch mode by default')
  .option('-s, --single-run', 'Run a one-time sync for a VM\'s shared folders')
  .action(function (name, options) {
    Machine.get(name, function (err, machine) {
      logo('small');

      if (err) return logger.error(err);

      var mode = options.singleRun ? 'sync' : 'watch';
      var arg = options.singleRun ? 'rsync' : 'gatling-rsync-auto';

      // Sync the vagrant vm
      var command = 'vagrant';
      var args = [arg];

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM folder ' + mode + ' completed!\n');
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
      logo('small');

      if (err) return logger.error(err);

      // Start interactive console prompts
      Machine.installRecommendedPlugins(function (err, result) {
        if (err) return logger.error(err);

        logger.info(result);

        // Start and provision the vagrant vm
        var command = 'vagrant';
        var args = ['provision'];

        Machine.execTty(machine, command, args, function (err) {
          if (err) return logger.error(err);

          // All done!
          glushAscii.done('', true);
          return logger.info(machine.name + ' VM Provisioned!\n');
        });
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

/**
 * List all available machines
 */
program
  .command('list')
  .description('List all available machines')
  .option('-s, --status', 'Show machine statuses')
  .action(function (options) {
    Machine.list(options, function (err, machines) {
      logo('small');

      if (err) return logger.error(err);
      var message = machines.length ? 'Available machines (* denotes currently selected):\n' + machines + '\n' : 'No machines available.  Create one with `hence machine init`';
      // All done!
      return logger.info(message);
    });
  });

/**
 * Get and set the current machine definition
 */
program
  .command('current [name]')
  .description('Get the current machine definition, or set it by providing a name argument')
  .action(function (name) {
    logo('small');
    if (_.isString(name)) {
      return Machine.setCurrent(name, function (err, machine) {
        if (err) return logger.error(err);

        // All done!
        return console.log('\n');
      });
    }

    Machine.getCurrent(function (err, machine) {
      if (err) return logger.error(err);

      // All done!
      return logger.info('Current machine is `' + machine.name +'`\n');
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
 * View a VM's configuration
 */
program
  .command('config [name]')
  .description('View a VM\'s configuration')
  .action(function (name) {
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var config = '';
      _.forEach(machine, function (val, key) {
        config += S('').padLeft(6).s + [key.toUpperCase(), val].join(': ') + '\n';
      });
      // All done!
      return logger.info(machine.name + ' configuration:\n' + config);
    });
  });

/**
 * View a VM's running status
 */
program
  .command('status [name]')
  .description('View a VM\'s configuration')
  .action(function (name) {
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      Machine.status(machine, function (err, result) {
        if (err) return logger.error(err);

        // All done!
        return logger.info('Status: ' + result + '\n');
      });
    });
  });

/**
 * Update a VM's configuration
 */
program
  .command('update [name]')
  .description('Update a VM\'s configuration')
  .action(function (name) {
    return console.log('Update Called');
  });

/**
 * Pull latest VM provisioning updates, if available
 */
program
  .command('upgrade [name]')
  .description('Upgrade VM provisioning environment to latest')
  .action(function (name) {
    logo('small');

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Kill vagrant processes
      Machine.upgrade(machine, function (err) {
        if (err) return logger.error(err);

        // All done!
        glushAscii.done('', true);
        return logger.info(machine.name + ' VM upgraded!\n');
      });
    });
  });

/**
 * Terminate all running vagrant processes that may be locking a VM
 */
program
  .command('unlock [name]')
  .description('Terminate all running vagrant processes that may be locking a VM')
  .action(function (name) {
    logo('small');

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

if (!process.argv.slice(2).length) {
  logo();
  program.outputHelp();
}

program.parse(process.argv);
