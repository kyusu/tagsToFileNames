#!/usr/bin/env node
const program = require('commander');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const R = require('ramda');
const junk = require('junk');

const getFileInfo = file => {
    const extName = path.extname(file);
    const fileName = path.basename(file, extName);
    return {
        extName: extName,
        fileName: fileName
    };
};
const getTags = fileInfo => {
    let tags = [];
    const matches = fileInfo.fileName.match(/\.\[(.+)]$/);
    if (matches) {
        tags = matches[1].replace('.[', '').replace('].', '').split(' ');
    }
    return Object.assign({tags: tags}, fileInfo);
};

const getConcatenatedTags = tags => `.[${tags.join(' ')}]`;

const normalizeFileName = fileInfo => {
    const normalizedFileName = fileInfo.fileName.replace(getConcatenatedTags(fileInfo.tags), '');
    return Object.assign({normalizedFileName: normalizedFileName}, fileInfo);
};

const normalizeFileNames = files => files.map(normalizeFileName);

const getFileAndStat = (stat, file) => {
    return {stat: stat, file: file};
};

const filterOutDirectories = files => files.filter(file => file.stat.isFile());

const filterOutJunkFiles = files => files.filter(junk.not);

const getFileStats = files => {
    return Promise.map(files, file => fs.statAsync(file)).then(stats => {
        return R.zipWith(getFileAndStat, stats, files);
    });
};

const removeStats = files => files.map(file => file.file);

const getFilesWithTags = files => files.map(getFileInfo).map(getTags);

const addNewTagsToOldOnes = (newTags, files) => {
    return files.map(file => {
        const tags = R.uniq(R.concat(file.tags, newTags));
        return Object.assign({}, file, {tags: tags});
    });
};

const getNewFileName = fileInfos => {
    return fileInfos.map(fileInfo => {
        const newFileName = `${fileInfo.normalizedFileName}${getConcatenatedTags(fileInfo.tags)}`;
        return Object.assign({newFileName}, fileInfo);
    });
};

const renameFilesOnFilesystem = files => {
    Promise.each(files, file => fs.renameAsync(`${file.fileName}${file.extName}`, `${file.newFileName}${file.extName}`));
};

const handleAddAction = (tags, dir) => {
    const tagsToBeAdded = tags.split(',').map(tag => tag.trim());
    fs.readdirAsync(dir)
        .then(filterOutJunkFiles)
        .then(getFileStats)
        .then(filterOutDirectories)
        .then(removeStats)
        .then(getFilesWithTags)
        .then(normalizeFileNames)
        .then(addNewTagsToOldOnes.bind(null, tagsToBeAdded))
        .then(getNewFileName)
        .then(renameFilesOnFilesystem)
        .then(() => console.log('Done!'))
        .catch(err => console.log(`tagsToFileNames has failed: ${err}`));
};

const handleRemoveAction = (tags, dir) => {
    console.log(tags, dir);
};

program.command('add <tags> <dir>').description('adds the given tags to all files in the directory').action(handleAddAction);
program.command('remove <tags> <dir>').description('removes the given tags to all files in the directory').action(handleRemoveAction);

program.parse(process.argv);
