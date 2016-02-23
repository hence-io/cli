var _ = require('lodash');
var inquisitor = require('hence-inquisitor');
var path = require('path-extra');
var Machine = require('../../machine')();

var vagrantDefaults = {
  name: 'hence',
  ip: '172.19.8.100',
  port: 8080,
  cpus: 2,
  memory: 2048,
  nodes: 1
};

var defaults = global.vm.currentMachine;

var step = inquisitor.ScaffoldStep({
  defaults: defaults,
  content: {
    header: {
      title: "VM Configuration Details",
      details: "Please make any desired changes to your vm configuration.\n Hit 'enter' to keep the defaults for any given option"
    }
  },
  prompts: [
    {
      name: 'name',
      message: 'What is your VM name?',
      "default": defaults.name,
      validate: inquisitor.inquirer.validatePrompt('isNull', 'You must provide a response', true)
    },
    {
      name: 'ip',
      message: 'What IP address would you like to use for the VM?',
      "default": defaults.ip,
      validate: inquisitor.inquirer.validatePrompt('isIP', 'You must provide a valid ip address')
    },
    {
      name: 'port',
      message: 'What port would you like to run the rancher dashboard on?',
      "default": defaults.port,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer')
    },
    {
      name: 'cpus',
      message: 'How many cpus will you allocate to this VM?',
      "default": defaults.cpus,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer')
    },
    {
      name: 'memory',
      message: 'How much memory (in MB) will you allocate to this VM?',
      "default": defaults.memory,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer')
    },
    {
      name: 'nodes',
      message: 'How many nodes (clustered VM\'s) will you run? 1 is typical for local development.',
      "default": defaults.nodes,
      validate: inquisitor.inquirer.validatePrompt('isInt', 'You must specify an integer')
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

    // Check for overridden defaults
    _.forEach(vagrantDefaults, function (val, key) {
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
