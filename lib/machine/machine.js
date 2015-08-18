var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path-extra');
var logger = require('hence-util').logger;

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

        var machinesList = [];
        _.forEach(machines, function (val, key) {
          machinesList.push(key);
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

      var _setCurrent = function (machine, next) {
        return fs.outputJson(global.vm.currentMachineFile, machine, function (err) {
          return next(err, machine);
        });
      };

      if (nameProvided) {
        self.get(name, function (err, machine) {
          if (err) return next(err);

          if (!machine) {
            return next('No machine with the name "' + name + '" exists.');
          }

          // Machine definition found.  Update the current machine json definition
          return _setCurrent(machine, next);
        });
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
      var machines = self.getMachines();
      var err = null;

      return next(err, machines[name]);
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

      // Destroy the vagrant vm
      return require('./vagrant/destroy')(machine, function (err) {
        if (err) logger.error(err);

        return self.setMachines(machines, function (err, machines) {
          return next(err, {deleted: name});
        });
      });
    },

    /**
     * Provision the vagrant vm
     * @param  {Object} config [machine definition]
     * @param  {Function} next [callback]
     */
    up: function (config, next) {
      return require('./vagrant/up')(config, next);
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
     * Start the setup wizard
     * @param  {String} type [init|destroy]
     * @param  {Function} next [callback]
     */
    startWizard: function (type, next) {
      return require('./' + type + '/prompts')(next);
    }
  });

  return self;
};

module.exports = Machine;
