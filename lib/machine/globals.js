var fs = require('fs-extra');
var path = require('path-extra');
var henceAscii = require('hence-util').ascii;

// Ensure that we have a ~/.hence directory for persistent vm data
var dataDir = path.homedir() + '/.hence';
fs.ensureDirSync(dataDir);

// Machine definition file
var machinesFile = [dataDir, 'machines.json'].join('/');
fs.ensureFileSync(machinesFile);

// Current Machine definition file
var currentMachineFile = [dataDir, 'current.json'].join('/');
fs.ensureFileSync(currentMachineFile);

module.exports = global.vm = {
    dataDir: dataDir,
    machinesFile: machinesFile,
    currentMachineFile: currentMachineFile
};
