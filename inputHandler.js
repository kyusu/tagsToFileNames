const program = require('commander');
const ll = require('lazylines');
const R = require('ramda');
const helpers = require('./helpers.js');

const handleInput = changeFileFunc => {
    program.parse(process.argv);
    const tagsToBeAdded = program.args[0].split(',').map(tag => tag.trim());

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const inp = new ll.LineReadStream(process.stdin);
    inp.on('line', line => {
        const fileName = ll.chomp(line);
        helpers.changeFileTags(R.partial(changeFileFunc, [tagsToBeAdded]), fileName);
    });
};

module.exports = handleInput;
