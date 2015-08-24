var henceAscii = require('hence-util').ascii;

var logo = function (size, message) {
  size = size || 'full';
  switch (size) {
    case 'small':
      henceAscii.smallLogo(message);
      break;

    case 'full':
      henceAscii.logo();
      break;
  }
};

module.exports = logo;
