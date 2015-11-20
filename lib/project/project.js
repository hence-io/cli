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

// Default json read/write options for fs-extra
var jsonReadOptions = {
  throws: false
};

var jsonWriteOptions = {
  spaces: 2
};

/**
 * @contructor
 */
var Project = function () {
  var self = {};

  _.extend(self, {

    mount: function init (opts, next) {
      return next();
    },

    /**
     * Return a newline-separated list of projects
     * @param  {Function} next [callback]
     * @return {string} [a newline-separated list of projects]
     */
    list: function list (opts, next) {
      fs.readJson(global.project.projectsFile, jsonReadOptions, function(err, projects) {
        if (err) return next(err);

        var current = self.getCurrent();

        var projectsList = [];
        var longestName = 0;
        _.forEach(projects, function (project, key) {
          var prefix = (current.name === key) ? '* ' : '  ';

          longestName = key.length > longestName ? key.length : longestName;

          projectsList.push(S('').padLeft(4).s + prefix + key);
        });

        // var statusCount = 0;
        // if (opts.status) {
        //   _.forEach(projects, function (project, key) {
        //     if (project.type === 'local') {
        //       var spacing = longestName - key.length;
        //       projectsList[statusCount] += S('').padLeft(spacing).s + '  (' + S(self.status(project, {async: false})).trim().s + ')';
        //     }

        //     statusCount++;
        //   });
        // }

        return next(null, projectsList.join('\n'));
      });
    },

    /**
     * Start a project wizard of a given type
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
     * Create a new project definition
     * @param  {Object} data [the project data]
     * @param  {Function} next [callback]
     * @return {Object} [the saved project data]
     */
    create: function create (data, next) {
      var config = self.prepareConfig(data);
      var projects = self.getProjects();

      if (projects[config.machine_name]) {
        // Already exists
        return next('A project with the name "' + config.machine_name + '" already exists. \nPlease try again with a unique project name.');
      }

      projects[config.machine_name] = config;

      // Name is unique, so lets set it in the projectsFile
      return self.setProjects(projects, function (err, projects) {
        if (err) return next(err);

        self.setCurrent(projects[config.machine_name], function (err, current) {
          return next(err, current);
        });
      });
    },

    /**
     * Prepare project config data object
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    prepareConfig: function prepareConfig (data) {
      var config = {
        name: data.name,
        machine_name: data.machine_name,
        path: data.path || data.dest,
      };

      return config;
    },

    /**
     * Get all project data
     * @param  {Function} next [callback]
     * @return {Object} [Project data keyed by name]
     */
    getProjects: function getProjects (next) {
      if (typeof(next) === 'function') {
        return fs.readJson(global.project.projectsFile, jsonReadOptions, function (err, projects) {
          return next(err, projects || {});
        });
      }
      return fs.readJsonSync(global.project.projectsFile, jsonReadOptions) || {};
    },

    /**
     * Set all project data
     * @param {Object} projects [Project data keyed by name]
     * @param {Function} next [callback]
     * @return {Object} [projects]
     */
    setProjects: function setProjects (projects, next) {
      if (_.isPlainObject(projects)) {
        sortedProjects = _.sortKeysBy(projects);

        return fs.outputJson(global.project.projectsFile, sortedProjects, jsonWriteOptions, function (err) {
          return next(err, sortedProjects);
        });
      }
      else {
        return next('You must supply a projects data object.');
      }
    },

    /**
     * Get the current project definition
     * @param  {Function} next [callback]
     * @return {[type]} [current project definition]
     */
    getCurrent: function getCurrent (next) {
      if (typeof(next) === 'function') {
        return fs.readJson(global.project.currentProjectFile, jsonReadOptions, function (err, current) {
          return next(err, current || {});
        });
      }
      return fs.readJsonSync(global.project.currentProjectFile, jsonReadOptions) || {};
    },

    /**
     * Set the current project to use
     * @param {String|Object} name [project name | project definition object]
     * @param {Function} next [callback]
     */
    setCurrent: function setCurrent (current, next) {
      var nameProvided = _.isString(current);
      var machine_name = nameProvided ? current : current.machine_name;
      var projects = self.getProjects();
      var project = projects[machine_name];
      var previousCurrent = self.getCurrent();

      var _setCurrent = function (project, next) {
        global.project.current = project.machine_name;

        return fs.outputJson(global.project.currentProjectFile, project, jsonWriteOptions, function (err) {
          if (err) return next(err);
          global.project.currentProject = project;

          // If current has changed, notify the user
          if (project.machine_name !== previousCurrent.machine_name) {
            logger.info('Current project set to `' + project.machine_name + '`');
          }

          return next(null, project);
        });
      };

      if (nameProvided) {
        if (!project) {
          // Doesn't exist
          return next('No project with the name "' + machine_name + '" exists.');
        }

        return _setCurrent(project, next);
      }
      else {
        return _setCurrent(current, next);
      }
    },

  });

  return self;
};

module.exports = Project;
