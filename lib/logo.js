var henceAscii = require('hence-util').ascii;

var logo = function (size) {
  size = size || 'full';
  switch (size) {
    case 'small':
      henceAscii.smallLogo('Machine');
      break;

    case 'full':
      henceAscii.logo('Machine');
      break;
  }
};

module.exports = logo;
