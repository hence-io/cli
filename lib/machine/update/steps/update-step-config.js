var _ = require('lodash');
var glush = require('glush-util');
var path = require('path-extra');
var Machine = require('../../machine')();

var currentMachine = global.vm.currentMachine;

var step = glush.ScaffoldStep({
  defaults: currentMachine,
  content: {
    header: {
      title: "VM Configuration Details",
      details: "Please make any desired changes to your vm configuration.\nHit 'enter' to keep the defaults for any given option"
    }
  },
  prompts: [
    {
      name: 'name',
      message: 'What is your VM name?',
      "default": defaults.name,
      validate: glush.inquirer.validatePrompt('isNull', 'You must provide a response', true),
      when: function () { return step.scaffold.inquirer.detailedInstallOnly(); }
    },
    {
      name: 'ip',
      message: 'What IP address would you like to use for the VM?',
      "default": defaults.ip,
      validate: glush.inquirer.validatePrompt('isIP', 'You must provide a valid ip address'),
      when: function () { return step.scaffold.inquirer.detailedInstallOnly(); }
    },
    {
      name: 'port',
      message: 'What port would you like to run the rancher dashboard on?',
      "default": defaults.port,
      validate: glush.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return step.scaffold.inquirer.detailedInstallOnly(); }
    },
    {
      name: 'cpus',
      message: 'How many cpus will you allocate to this VM?',
      "default": defaults.cpus,
      validate: glush.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return step.scaffold.inquirer.detailedInstallOnly(); }
    },
    {
      name: 'memory',
      message: 'How many memory (in MB) will you allocate to this VM?',
      "default": defaults.memory,
      validate: glush.inquirer.validatePrompt('isInt', 'You must specify an integer'),
      when: function () { return step.scaffold.inquirer.detailedInstallOnly(); }
    }
  ],
  process: function (answers, next) {
    var configMap = {
      name: '$vm_name',
      ipPrefix: '$private_ip_prefix',
      ipEnd: '$private_ip_end',
      port: '$rancher_ui_port',
      cpus: '$vm_cpus',
      memory: '$vm_memory'
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
