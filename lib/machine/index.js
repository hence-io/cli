require('./globals');

var _ = require('lodash');
var S = require('string');
var program = require('commander');
var programUtil = require('../util/program');
var logger = require('hence-util').logger;
var inquisitorAscii = require('hence-inquisitor').ascii;
var Machine = require('./machine')();
var logo = require('../logo');
var logoMessage = 'Machine';
var initialMachine = Machine.getCurrent();

if (initialMachine.name) {
  logoMessage += ' (Current: ' + initialMachine.name + ')';
}

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

        if (!answers.beginInstall) {
          inquisitorAscii.aborted('', true);
          return logger.info('VM Installation Aborted.\n');
        }

        // Install recommended vagrant plugins if required
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

              // All done!
              inquisitorAscii.done('', true);
              logger.info(machine.name + ' VM started and set to current machine!\n');

              // Open up the Dashboard in browser
              Machine.openDashboard(machine);
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
  .option('-o, --open-dashboard', 'Open up the dashboard in-browser when ready.')
  .option('-i, --ip', 'Use the ip as the hostname when opening the dashboard. Defaults to machine name.')
  .action(function (name, options){
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Start and provision the vagrant vm
      var command = 'vagrant';
      var args = ['up', '--provision-with=shell'];

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // Set this machine as current
        Machine.setCurrent(machine, function (err, machine) {
          if (err) return logger.error(err);

          // All done!
          inquisitorAscii.done('', true);
          logger.info(machine.name + 'VM started and set to current machine!\n');

          if (options.openDashboard) {
            var useIP = !_.isUndefined(options.ip);
            Machine.openDashboard(machine, useIP);
          }
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
  .option('-o, --open-dashboard', 'Open up the dashboard in-browser when ready.')
  .option('-p, --provision', 'Force the provisioners to run on reload.')
  .option('-i, --ip', 'Use the ip as the hostname when opening the dashboard. Defaults to machine name.')
  .action(function (name, options) {
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Restart and provision the vagrant vm
      var command = 'vagrant';
      var args = ['reload'];

      if (options.provision) {
        args.push('--provision-with=shell');
      }

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
        logger.info(machine.name + ' VM restarted!\n');

        if (options.openDashboard) {
          var useIP = !_.isUndefined(options.ip);
          Machine.openDashboard(machine, useIP);
        }
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
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Stop the vagrant vm
      var command = 'vagrant';
      var args = ['halt'];

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
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
  .option('-s, --sudo', 'SSH in as root user.  Requires password, which defaults to "vagrant"')
  .action(function (name, options) {
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var command = 'vagrant';
      var args = ['ssh'];

      if (options.sudo) args.push('-c "su"');

      // SSH into the vagrant vm
      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
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
      logo('small', logoMessage);

      if (err) return logger.error(err);

      var mode = options.singleRun ? 'sync' : 'watch';
      var arg = options.singleRun ? 'rsync' : 'gatling-rsync-auto';

      // Sync the vagrant vm
      var command = 'vagrant';
      var args = [arg];

      Machine.execTty(machine, command, args, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
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
  .option('-o, --open-dashboard', 'Open up the dashboard in-browser when ready.')
  .option('-i, --ip', 'Use the ip as the hostname when opening the dashboard. Defaults to machine name.')
  .action(function (name, options) {
    Machine.get(name, function (err, machine) {
      logo('small', logoMessage);

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
          inquisitorAscii.done('', true);
          logger.info(machine.name + ' VM Provisioned!\n');

          if (options.openDashboard) {
            var useIP = !_.isUndefined(options.ip);
            Machine.openDashboard(machine, useIP);
          }
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
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);
      if (!machine) return logger.error('No machine with the name "' + name + '" exists.');

      Machine.startWizard('destroy', function (err, answers) {
        if (err) return logger.error(err);

        if (!answers.beginDelete) {
          inquisitorAscii.aborted('', true);
          return logger.info(machine.name + ' VM Destroy Aborted.\n');
        }

        Machine.destroy(machine.name, function (err, deleted) {
          if (err) return logger.error(err);

          // If this machine is the current, remove it
          var current = Machine.getCurrent();
          if (current && current.name === machine.name) {
            Machine.setCurrent({}, function (err, current) {
              if (err) return logger.error(err);

              // All done!
              inquisitorAscii.done('', true);
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
      logo('small', logoMessage);

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
    logo('small', logoMessage);
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
 * Connect to a hence machine's Docker host and Rancher Dashboard
 */
program
  .command('connect [name]')
  .description('Connect to a hence machine\'s Docker host and Rancher Dashboard')
  .option('-x, --export', 'Print only the export vars.  This is intended to be run as "eval $(hence machine connect --export)"')
  .option('-i, --install-local-packages', 'Check for and install the recommended versions of Docker and Rancher-Compose locally if missing.')
  .action(function (name, options) {
    if (!options['export']) {
      logo('small', logoMessage);
    }

    if (options.installLocalPackages) {
      Machine.installLocalPackages(function (err, result) {
        if (err) return logger.error(err);

        if (!options['export']) {
          logger.info(result + '\n');
        }

        connect(name, options);
      });
    }
    else {
      connect(name, options);
    }

    function connect(name, options) {
      Machine.get(name, function (err, machine) {
        if (err) return logger.error(err);

        Machine.connect(machine, function (err, instructions) {
          if (err) return logger.error(err);

          if (!options['export']) {
            logger.info('Please manually export the following environment variables into your current terminal session:');
          }

          process.stdout.write(instructions);

          if (!options['export']) {
            console.log('\n');
            logger.info('To export the connection variables automatically, please run the following command in your shell:');
            console.log('eval $(hence machine connect --export)\n');
          }
        });
      });
    }
  });

/**
 * Open the Rancher Dashboard in browser
 */
program
  .command('dashboard [name]')
  .description('Connect to a hence machine VM and/or Rancher Dashboard')
  .option('-i, --ip', 'Use the ip as the hostname when opening the dashboard. Defaults to machine name.')
  .action(function (name, options) {
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var useIP = !_.isUndefined(options.ip);
      Machine.openDashboard(machine, useIP);
    });
  });

/**
 * View a VM's configuration
 */
program
  .command('config [name]')
  .description('View a VM\'s configuration')
  .action(function (name) {
    logo('small', logoMessage);

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
    logo('small', logoMessage);

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
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);
      if (!machine) return logger.error('No machine with the name "' + name + '" exists.');

      initialMachine = machine;

      Machine.startWizard('update', function (err, answers) {
        if (err) return logger.error(err);

        if (!answers.beginUpdate) {
          inquisitorAscii.aborted('', true);
          return logger.info(machine.name + ' VM Update Aborted.\n');
        }

        // Halt and restart/provision the vagrant vm
        var command = 'vagrant';
        var args = ['halt', initialMachine.name];

        Machine.execTty(machine, command, args, function (err) {
          if (err) return logger.error(err);

          Machine.update(machine, answers, function (err, machine) {
            if (err) return logger.error(err);

            // Start and provision the vagrant vm
            command = 'vagrant';
            args = ['up', '--provision'];

            Machine.execTty(machine, command, args, function (err) {
              if (err) return logger.error(err);

              // All done!
              inquisitorAscii.done('', true);
              logger.info(machine.name + ' VM updated and restarted!\n');
            });
          });
        });
      });
    });
  });

/**
 * Pull latest VM provisioning updates, if available
 */
program
  .command('upgrade [name]')
  .description('Upgrade VM provisioning environment to latest')
  .action(function (name) {
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      // Kill vagrant processes
      Machine.upgrade(machine, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
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
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var command = 'ps | grep -v \'grep\' | grep vagrant | grep ' + machine.name + ' | awk \'{print $1}\' | xargs kill -9';

      // Kill vagrant processes
      Machine.exec(machine, command, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
        return logger.info(machine.name + ' VM processes killed!\n');
      });
    });
  });

/**
 * Terminate all running vagrant processes that may be locking a VM
 */
program
  .command('clear-mount-cache [name]')
  .description('Clear folder mount caches that are preventing a VM from starting')
  .action(function (name) {
    logo('small', logoMessage);

    Machine.get(name, function (err, machine) {
      if (err) return logger.error(err);

      var commands = [
        'sudo rm /etc/exports',
        'rm ' + machine.path + '/.vagrant/machines/' + machine.name + '/virtualbox/synced_folders'
      ];

      var command = commands.join(' && ');

      // Kill vagrant processes
      Machine.exec(machine, command, function (err) {
        if (err) return logger.error(err);

        // All done!
        inquisitorAscii.done('', true);
        return logger.info(machine.name + ' VM folder mount caches cleared!\n');
      });
    });
  });


programUtil.subCommandHelp(program);
programUtil.setSubCommandName(program);

program.parse(process.argv);
