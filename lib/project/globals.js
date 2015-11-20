var fs = require('fs-extra');
var path = require('path-extra');

var jsonReadOptions = {
  throws: false
};

// Ensure that we have a ~/.hence directory for persistent vm data
var dataDir = path.homedir() + '/.hence';
fs.ensureDirSync(dataDir);

// Project definition file
var projectsFile = [dataDir, 'projects.json'].join('/');
fs.ensureFileSync(projectsFile);

// Current Project definition file
var currentProjectFile = [dataDir, 'project.current.json'].join('/');
fs.ensureFileSync(currentProjectFile);

// Save a global ref to the current project
var currentProject = fs.readJsonSync(currentProjectFile, jsonReadOptions) || {};

module.exports = global.project = {
  dataDir: dataDir,
  projectsFile: projectsFile,
  currentProjectFile: currentProjectFile,
  currentProject: currentProject
};
