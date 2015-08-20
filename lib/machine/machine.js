var _ = require('lodash');
var S = require('string');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;
var shell = require('hence-util').globalShell;
var git = require('gulp-git');

var jsonReadOptions = {
  throws: false
};

/**
 * @contructor
 */
var Machine = function () {
  var self = {};

  _.extend(self, {
    /**
     * Return a newline-separated list of machines
     * @param  {Function} next [callback]
     * @return {string} [a newline-separated list of machines]
     */
    list: function list (opts, next) {
      fs.readJson(global.vm.machinesFile, jsonReadOptions, function(err, machines) {
        if (err) return next(err);

        var current = self.getCurrent();

        var machinesList = [];
        var longestName = 0;
        _.forEach(machines, function (machine, key) {
          var prefix = (current.name === key) ? '* ' : '  ';

          longestName = key.length > longestName ? key.length : longestName;

          machinesList.push(S('').padLeft(4).s + prefix + key);
        });

        var statusCount = 0;
        if (opts.status) {
          _.forEach(machines, function (machine, key) {
            if (machine.type === 'local') {
              var spacing = longestName - key.length;
              machinesList[statusCount] += S('').padLeft(spacing).s + '  (' + S(self.status(machine, {async: false})).trim().s + ')';
            }

            statusCount++;
          });
        }

        return next(null, machinesList.join('\n'));
      });
    },

    /**
     * Get all machine data
     * @param  {Function} next [callback]
     * @return {Object} [Machine data keyed by name]
     */
    getMachines: function getMachines (next) {
      if (typeof(next) === 'function') {
        return fs.readJson(global.vm.machinesFile, jsonReadOptions, function (err, machines) {
          return next(err, machines || {});
        });
      }
      return fs.readJsonSync(global.vm.machinesFile, jsonReadOptions) || {};
    },

    /**
     * Set all machine data
     * @param {Object} machines [Machine data keyed by name]
     * @param {Function} next [callback]
     * @return {Object} [machines]
     */
    setMachines: function setMachines (machines, next) {
      if (_.isPlainObject(machines)) {
        return fs.outputJson(global.vm.machinesFile, machines, function (err) {
          return next(err, machines);
        });
      }
      else {
        return next('You must supply a machines data object.');
      }
    },

    /**
     * Get the current machine definition
     * @param  {Function} next [callback]
     * @return {[type]} [current machine definition]
     */
    getCurrent: function getCurrent (next) {
      if (typeof(next) === 'function') {
        return fs.readJson(global.vm.currentMachineFile, jsonReadOptions, function (err, current) {
          return next(err, current || {});
        });
      }
      return fs.readJsonSync(global.vm.currentMachineFile, jsonReadOptions) || {};
    },

    /**
     * Set the current machine to use
     * @param {String|Object} name [machine name | machine definition object]
     * @param {Function} next [callback]
     */
    setCurrent: function setCurrent (current, next) {
      var nameProvided = _.isString(current);
      var name = nameProvided ? current : current.name;
      var machines = self.getMachines();
      var machine = machines[name];

      var _setCurrent = function (machine, next) {
        global.vm.current = machine.name;

        return fs.outputJson(global.vm.currentMachineFile, machine, function (err) {
          if (err) return next(err);
          logger.info('Current machine set to `' + machine.name + '`');
          return next(null, machine);
        });
      };

      if (nameProvided) {
        if (!machine) {
          // Doesn't exist
          return next('No machine with the name "' + name + '" exists.');
        }

        return _setCurrent(machine, next);
      }
      else {
        return _setCurrent(current, next);
      }
    },

    /**
     * Get an individual machine definition
     * @param  {String} name [machine name]
     * @param  {Function} next [callback]
     * @return {Object} [machine data]
     */
    get: function get (name, next) {
      var args = _.dropRight(arguments);
      name = _.isString(_.last(args)) ? name : self.getCurrent().name;

      // if no name was provided, and we couldn't find one from a currently connected machine, return error
      if (!name) return next('Please provide a machine name, or connect to an existing machine before running this command.');

      self.setCurrent(name, function (err) {
        if (err) return next(err);

        var machines = self.getMachines();
        return next(null, machines[name]);
      });
    },

    /**
     * Prepare machine config data object
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    prepareConfig: function prepareConfig (data) {
      var config = {
        name: data.name,
        type: data.type || 'local',
        path: path.resolve(data.dest),
        ip: data.ip,
        port: data.port
      };

      if (config.type === 'local') {
        _.extend(config, {
          cpus: data.cpus,
          memory: data.memory
        });
      }

      return config;
    },

    /**
     * Create a new machine definition
     * @param  {Object} data [the machine data]
     * @param  {Function} next [callback]
     * @return {Object} [the saved machine data]
     */
    create: function create (data, next) {
      var config = self.prepareConfig(data);

      var machines = self.getMachines();

      if (machines[config.name]) {
        // Already exists
        return next('A machine with the name "' + config.name + '" already exists. \nPlease try again with a unique machine name.');
      }

      machines[config.name] = config;

      // Name is unique, so lets set it in the machinesFile
      return self.setMachines(machines, function (err, machines) {
        return next(err, config);
      });
    },

    /**
     * Delete a machine definition
     * @param  {String} name [the machine data]
     * @param  {Function} next [callback]
     * @return {Object} [the saved machine data]
     */
    destroy: function destroy (name, next) {
      var machines = self.getMachines();
      var machine = machines[name];

      if (!machine) {
        // Doesn't exist
        return next('No machine with the name "' + name + '" exists.');
      }

      delete machines[name];

      var command = 'vagrant';
      var args = ['destroy', '--force'];

      // Destroy the vagrant vm
      self.execTty(machine, command, args, function (err) {
        if (err) logger.error(err);

        self.exec(machine, 'rm -rf .vagrant', function (err) {
          if (err) return next(err);

          self.setMachines(machines, function (err, machines) {
            return next(err, {deleted: name});
          });
        });
      });
    },

    /**
     * Update a machine definition
     * @param  {String} name [machine name]
     * @param  {Object} data [data to extend]
     * @param  {Function} next [callback]
     * @return {Object} [machine definition]
     */
    extend: function extend (name, data, next) {
      var machines = self.getMachines();

      if (!machines[name]) {
        // Doesn't exist
        return next('No machine with the name "' + name + '" exists.');
      }
      _.extend(machines[name], data);

      // Name is unique, so lets set it in the machinesFile
      return self.setMachines(function (err, machines) {
        return next(err, machines[name]);
      });
    },

    connect: function connect (name, next) {

    },

    /**
     * Check local OS prerequisites for installation/provisioning of machine
     * @param  {Function} next [callback]
     */
    checkPrerequisites: function checkPrerequisites (next) {
      return require('./init/prerequisites')(next);
    },

    /**
     * Install recommedended vagrant plugins
     * @param  {Function} next [callback]
     */
    installRecommendedPlugins: function installRecommendedPlugins (next) {
      return require('./init/install-plugins')(next);
    },

    /**
     * Start the setup wizard
     * @param  {String} type [init|destroy]
     * @param  {Function} next [callback]
     */
    startWizard: function startWizard (type, opts, next) {
      var args = _.dropRight(arguments);
      next = _.last(arguments);
      opts = _.isPlainObject(_.last(args)) ? opts : {};

      return require('./' + type + '/prompts')(opts, next);
    },

    /**
     * Get running status of a machine
     * @param  {Object} machine [the machine definition]
     * @param  {Function} next [callback]
     */
    status: function status (machine, opts, next) {
      var command = 'vagrant status | grep virtualbox | awk \'{print $2}\'';

      var execOpts = {
        silent: true,
        async: true
      };

      if (_.isFunction(opts)) {
        next = opts;
        opts = execOpts;
      }

      _.extend(execOpts, opts);

      if (execOpts.async) {
        self.exec(machine, command, execOpts, function (err, result) {
          return next(err, result[0]);
        });
      }
      else {
        return exec('cd ' + machine.path + ' && ' + command, execOpts).output;
      }
    },

    /**
     * Execute an asynchronous shell command from the machine path
     * @param  {Object} config [the machine definition]
     * @param  {String} command [the vagrant command to run]
     * @param  {Function} next [callback]
     */
    exec: function (config, command, opts, next) {
      var args = _.dropRight(arguments);
      next = _.last(arguments);
      opts = _.isPlainObject(_.last(args)) ? opts : {};

      var execOpts = _.defaultsDeep(_.cloneDeep(opts), {
        silent: false,
        async: true
      });

      cd(config.path);

      var child = exec(command, execOpts);
      var dataOutput = [];

      child.on('error', function(err) {
        logger.error(err);
      });

      child.stdout.on('data', function(data) {
        dataOutput.push(S(data).trim().s);
      });

      child.on('close', function (code, signal) {
        if (code !== 0) {
          return next("Process exited with a non-zero status.");
        }

        return next(null, dataOutput);
      });
    },

    /**
     * Execute an asynchronous shell command from the machine path
     * @param  {Object} config [the machine definition]
     * @param  {String} command [the vagrant command to run]
     * @param  {Function} next [callback]
     */
    execTty: function execTty (config, command, args, next) {
      if (_.isFunction(args)) {
        next = args;
        args = [];
      }

      args.push(config.name);

      cd(config.path);

      var child = spawn(command, args, function (code) {
        if (code !== 0) {
          return next("Process exited with a non-zero status.");
        }

        return next();
      });
    },

    upgrade: function upgrade (config, next) {
      cd(config.path);

      var pullOptions = {
        quiet: false,
        args: '--rebase -f -v'
      };

      // Clone the hence repo
      git.pull('origin', 'master', pullOptions, function (err) {
        return next(err);
      });
    }

  });

  return self;
};

module.exports = Machine;
