var program = require('commander');
var henceAscii = require('hence-util').ascii;
var glushAscii = require('glush-util').ascii;

require('./autocomplete');

glushAscii.spacer(true);
henceAscii.hence('', true);
glushAscii.spacer(true);

program
    .version('0.0.1')
    .command('machine [command]', 'Manage a hence.io Machine')
    .command('vm [command]', 'Alias of `machine`')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
