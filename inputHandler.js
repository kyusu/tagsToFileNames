const program = require('commander');
const ll = require('lazylines');
const R = require('ramda');
const {changeFileTags, fileSatisfiesFilter} = require('./helpers.js');

const changeTagsOnInput = changeFileFunc => (process, tags, fileName) => {
    const message = changeFileTags(R.partial(changeFileFunc, [tags]), fileName);
    console.log(message);
};

const filterOnInput = (process, tags, fileName) => {
    if (fileSatisfiesFilter(tags, fileName)) {
        process.stdout.write(`${fileName}\n`);
    }
};

const onLine = (process, givenTags, onInputFunc) => line => {
    const fileName = ll.chomp(line);
    onInputFunc(process, givenTags, fileName);
};

const handleInput = onInputFunc => {
    program.parse(process.argv);
    const givenTags = program.args[0].split(',').map(tag => tag.trim());
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    const inp = new ll.LineReadStream(process.stdin);
    inp.on('line', onLine(process, givenTags, onInputFunc));
};

const changeTags = changeFileFunc => handleInput(changeTagsOnInput(changeFileFunc));

const filterTags = () => handleInput(filterOnInput);


module.exports = {changeTags, filterTags};
