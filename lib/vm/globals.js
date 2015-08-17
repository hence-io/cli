var fs = require('fs-extra');
var path = require('path-extra');

// Ensure that we have a ~/.hence directory for persistent vm data
var dataDir = path.homedir() + '/.hence';
fs.ensureDirSync(dataDir);

var machinesFile = [dataDir, 'machines.json'].join('/');
fs.ensureFileSync(machinesFile);

module.exports = global.vm = {
    dataDir: dataDir,
    machinesFile: machinesFile
};
