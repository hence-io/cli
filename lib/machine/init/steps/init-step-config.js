var _ = require('lodash');
var inquisitor = require('hence-inquisitor');
var path = require('path-extra');
var Machine = require('../../machine')();

var defaults = {
  name: 'hence',
  ip: '172.19.8.100',
  port: 8080,
  cpus: 2,
  memory: 2048,
  nodes: 1
};

var step = inquisitor.ScaffoldStep({
  defaults: defaults,
  content: {
    header: {
      title: "VM Configuration Details",
      details: "Please choose your initial VM specs. These can be changed at a later point."
    }
  },
  prompts: [
    {
      name: 'name',
      message: 'What is your VM name?',
      "default": defaults.name,
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a response', true),
      when: function () { return this.inquirer.customInstallOnly(); }
    },
    {
      name: 'ip',
      message: 'What base IP address would you like to use for the VM?',
      "default": defaults.ip,
      validate: inquisitor.inquirer.validatePrompt('isIP', 'You must provide a valid ip address'),
      when: function () { return this.inquirer.customInstallOnly(); }
    },
    {
      name: 'port',
      message: 'What port would you like to run the rancher dashboard on?',
      "default": defaults.port,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return this.inquirer.customInstallOnly(); }
    },
    {
      name: 'cpus',
      message: 'How many cpus will you allocate to this VM?',
      "default": defaults.cpus,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return this.inquirer.customInstallOnly(); }
    },
    {
      name: 'memory',
      message: 'How much memory (in MB) will you allocate to this VM?',
      "default": defaults.memory,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return this.inquirer.customInstallOnly(); }
    },
    {
      name: 'nodes',
      message: 'How many nodes (clustered VM\'s) will you run? 1 is typical for local development.',
      "default": defaults.nodes,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return this.inquirer.customInstallOnly(); }
    }
  ],
  process: function (answers, next) {
    var configMap = {
      name: '$vm_name',
      ipPrefix: '$private_ip_prefix',
      ipEnd: '$private_ip_end',
      port: '$rancher_ui_port',
      cpus: '$vm_cpus',
      memory: '$vm_memory',
      nodes: '$number_of_nodes'
    };

    var configArr = [];

    // Check if vm name is already taken
    var machines = Machine.getMachines();

    if (machines[answers.name]) {
      // Already exists
      return next('A machine with the name "' + answers.name + '" already exists. \nPlease try again with a unique machine name, or delete the existing machine definition with:\n`hence vm destroy ' + answers.name + '`');
    }

    // Check for overridden defaults
    _.forEach(defaults, function (val, key) {
      if (answers[key] !== val) {
        var customVal = answers[key];

        switch (key) {
          case 'ip':
            var parts = customVal.split('.');
            var end = parseInt(_.pullAt(parts, 3), 10);
            var prefix = parts.join('.');

            configArr.push([configMap.ipPrefix, '=', '"' + prefix + '"'].join(' '));
            configArr.push([configMap.ipEnd, '=', end].join(' '));
            break;

          case 'port':
          case 'cpus':
          case 'memory':
          case 'nodes':
            configArr.push([configMap[key], '=', parseInt(customVal, 10)].join(' '));
            break;

          default:
          configArr.push([configMap[key], '=', (_.isString(customVal) ? '"' + customVal + '"' : customVal)].join(' '));
        }
      }
    });

    var configString = configArr.join('\n');

    if (!_.isEmpty(configString)) {
      answers.files.push(answers.dirs.template.customConfig);
      answers.customConfig = configString;
    }

    return next();
  }
});

module.exports = step;
