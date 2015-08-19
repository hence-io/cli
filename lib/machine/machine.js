var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;
var shell = require('hence-util').globalShell;

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
    list: function (next) {
      fs.readJson(global.vm.machinesFile, jsonReadOptions, function(err, machines) {
        if (err) return next(err);

        var current = self.getCurrent();

        var machinesList = [];
        _.forEach(machines, function (val, key) {
          var prefix = (current.name === key) ? '* ' : '  ';
          machinesList.push(prefix + key);
        });

        return next(null, machinesList.join('\n'));
      });
    },

    /**
     * Get all machine data
     * @param  {Function} next [callback]
     * @return {Object} [Machine data keyed by name]
     */
    getMachines: function (next) {
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
    setMachines: function (machines, next) {
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
    getCurrent: function (next) {
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
    setCurrent: function (current, next) {
      var nameProvided = _.isString(current);
      var name = nameProvided ? current : current.name;
      var machines = self.getMachines();
      var machine = machines[name];

      var _setCurrent = function (machine, next) {
        global.vm.current = machine.name;

        return fs.outputJson(global.vm.currentMachineFile, machine, function (err) {
          return next(err, machine);
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
    get: function (name, next) {
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
     * Create a new machine definition
     * @param  {Object} data [the machine data]
     * @param  {Function} next [callback]
     * @return {Object} [the saved machine data]
     */
    create: function (data, next) {
      var config = {
        name: data.name,
        path: path.resolve(data.dest),
        ip: data.ip,
        port: data.port
      };

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
    destroy: function (name, next) {
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
    extend: function (name, data, next) {
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

    connect: function (name, next) {

    },

    /**
     * Check local OS prerequisites for installation/provisioning of machine
     * @param  {Function} next [callback]
     */
    checkPrerequisites: function (next) {
      return require('./init/prerequisites')(next);
    },

    /**
     * Install recommedended vagrant plugins
     * @param  {Function} next [callback]
     */
    installRecommendedPlugins: function (next) {
      return require('./init/install-plugins')(next);
    },

    /**
     * Start the setup wizard
     * @param  {String} type [init|destroy]
     * @param  {Function} next [callback]
     */
    startWizard: function (type, opts, next) {
      var args = _.dropRight(arguments);
      next = _.last(arguments);
      opts = _.isPlainObject(_.last(args)) ? opts : {};

      return require('./' + type + '/prompts')(opts, next);
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

      child.on('error', function(err) {
        logger.error(err);
      });

      child.on('close', function (code, signal) {
        if (code !== 0) {
          return next("Process exited with a non-zero status.");
        }

        return next();
      });
    },

    /**
     * Execute an asynchronous shell command from the machine path
     * @param  {Object} config [the machine definition]
     * @param  {String} command [the vagrant command to run]
     * @param  {Function} next [callback]
     */
    execTty: function (config, command, args, next) {
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

      // child.on('error', function(err) {
      //   logger.error(err);
      // });

      // child.on('close', function (code, signal) {
      //   if (code !== 0) {
      //     return next("Process exited with a non-zero status.");
      //   }

      //   return next();
      // });
    }

  });

  return self;
};

module.exports = Machine;
