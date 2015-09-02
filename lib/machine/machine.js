var _ = require('lodash');
var S = require('string');
var fs = require('fs-extra');
var logger = require('hence-util').logger;
var shell = require('hence-util').globalShell;
var git = require('gulp-git');
var needle = require('needle');

// Lodash mixin to allow sorting object keys alphanumerically
// see https://gist.github.com/colingourlay/82506396503c05e2bb94
_.mixin({
  'sortKeysBy': function (obj, comparator) {
    var keys = _.sortBy(_.keys(obj), function (key) {
      return comparator ? comparator(obj[key], key) : key;
    });

    return _.object(keys, _.map(keys, function (key) {
      return obj[key];
    }));
  }
});

// Default json read options for fs-extra
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
        sortedMachines = _.sortKeysBy(machines);

        return fs.outputJson(global.vm.machinesFile, sortedMachines, function (err) {
          return next(err, sortedMachines);
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
      var previousCurrent = self.getCurrent();

      var _setCurrent = function (machine, next) {
        global.vm.current = machine.name;

        return fs.outputJson(global.vm.currentMachineFile, machine, function (err) {
          if (err) return next(err);
          global.vm.currentMachine = machine;

          // If current has changed, notify the user
          if (machine.name !== previousCurrent.name) {
            logger.info('Current machine set to `' + machine.name + '`');
          }

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
        path: data.path || data.dest,
        ip: data.ip,
        port: parseInt(data.port, 10)
      };

      if (config.type === 'local') {
        _.extend(config, {
          cpus: parseInt(data.cpus, 10),
          memory: parseInt(data.memory, 10)
        });
      }

      return config;
    },

    /**
     * Update machine config data object
     * @param  {Object}   config [machine data]
     * @param  {Function} next   [callback]
     * @return {[type]}          [the saved machine data]
     */
    updateConfig: function prepareConfig (config, machine, next) {
      var machines = self.getMachines();

      if (_.isFunction(machine)) {
        next = machine;
        machine = config;
      }

      if (!config.name) {
        return next('Your machine configuration could not be updated with the provided values.');
      }

      // Delete the old vm record
      delete machines[machine.name];

      // Add the new config
      machines[config.name] = config;

      // Save it in the machinesFile
      self.setMachines(machines, function (err, machines) {
        if (err) return next(err);

        self.setCurrent(machines[config.name], function (err, current) {
          return next(err, current);
        });
      });
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
        if (err) return next(err);

        self.setCurrent(machines[config.name], function (err, current) {
          return next(err, current);
        });
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
     * @param  {Object} machine [existing machine data]
     * @param  {Object} data [new machine data]
     * @param  {Function} next [callback]
     * @return {Object} [machine definition]
     */
    update: function update (machine, data, next) {
      var config = self.prepareConfig(data);
      return self.updateConfig(config, machine, next);
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
     * Install recommedended vagrant plugins
     * @param  {Function} next [callback]
     */
    installLocalPackages: function installLocalPackages (next) {
      return require('./connect/install-local-packages')(next);
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

      return require('./' + type + '/prompts').start(opts, next);
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
    },

    connect: function connect (config, next) {
      var _connectInstructions = function _connectInstructions (config, next) {
        var connectVars = {
          DOCKER_HOST: 'tcp://' + config.ip + ':2375',
          RANCHER_URL: 'http://' + config.ip + ':' + config.port + '/',
          RANCHER_ACCESS_KEY: config.apiKey.publicValue,
          RANCHER_SECRET_KEY: config.apiKey.secretValue
        };

        var exportStrings = [];
        _.forEach(connectVars, function (val, name) {
          this.push('export ' + name + '=' + val);
        }, exportStrings);

        var instructions = exportStrings.join('\n');

        return next(null, instructions, config);
      };

      if (config.apiKey) {
        return _connectInstructions(config, next);
      }

      else {
        self.generateApiKey(config, function (err, config) {
          if (err) return next(err);
          return _connectInstructions(config, next);
        });
      }
    },

    getDashboardPath: function getDashboardPath (config) {
      return ['http://', config.ip, ':', config.port, '/'].join('');
    },

    generateApiKey: function generateApiKey (config, data, next) {
      var url = self.getDashboardPath(config) + 'v1/projects/1a5/apikeys';

      var options = {
        json: true
      };

      if (_.isFunction(data)) {
        next = data;
        data = {
          description: 'Local Development Key',
          name: 'localdev'
        };
      }

      // Get a new api key
      needle.post(url, data, options, function (err, response, body) {
        if (err) return next(err);
        if (response.statusCode == 200) return next('Request returned with a status code of ' + response.statusCode);

        // Save the key to the machine data
        config.apiKey = body;
        self.updateConfig(config, function (err, machine) {
          return next(err, machine);
        });
      });

    }

  });

  return self;
};

module.exports = Machine;
