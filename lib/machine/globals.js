var fs = require('fs-extra');
var path = require('path-extra');
var henceAscii = require('hence-util').ascii;

var jsonReadOptions = {
  throws: false
};

// Ensure that we have a ~/.hence directory for persistent vm data
var dataDir = path.homedir() + '/.hence';
fs.ensureDirSync(dataDir);

// Machine definition file
var machinesFile = [dataDir, 'machines.json'].join('/');
fs.ensureFileSync(machinesFile);

// Current Machine definition file
var currentMachineFile = [dataDir, 'machine.current.json'].join('/');
fs.ensureFileSync(currentMachineFile);

// Save a global ref to the current machine
var currentMachine = fs.readJsonSync(currentMachineFile, jsonReadOptions) || {};

module.exports = global.vm = {
  dataDir: dataDir,
  machinesFile: machinesFile,
  currentMachineFile: currentMachineFile,
  currentMachine: currentMachine
};
