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
var Project = function () {
  var self = {};

  _.extend(self, {

    init: function init (opts, next) {
      return next();
    }

  });

  return self;
};

module.exports = Project;
