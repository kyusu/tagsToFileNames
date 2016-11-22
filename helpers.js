'use strict';
const R = require('ramda');
const junk = require('junk');
const path = require('path');
const fs = require('fs');
const M = require('ramda-fantasy').Maybe;
const Just = M.Just;
const Nothing = M.Nothing;
const Either = require('ramda-fantasy').Either;
const Left = Either.Left;
const Right = Either.Right;

/**
 * Given a file name it returns an object which contains the base and extension name of the file
 * @param {string} fileName
 * @returns {{extName: string, baseName: string}}
 */
const getExtAndBaseName = fileName => {
    const extName = path.extname(fileName);
    const baseName = path.basename(fileName, extName);
    return {
        extName: extName,
        baseName: baseName
    };
};

/**
 * Returns an object which contains the base and extension name of the file as well as all the tags stored in the file
 * name
 * @param {{extName: string, baseName: string}} fileInfo
 * @returns {{extName: string, baseName: string, tags: Array.<string>}}
 */
const getTags = fileInfo => {
    let tags = [];
    const matches = fileInfo.baseName.match(/\.\[(.+)]$/);
    if (matches) {
        tags = matches[1].replace('.[', '').replace('].', '').split(' ');
    }
    return Object.assign({tags: tags}, fileInfo);
};

/**
 * Given an array of tags it returns a string containing all tags separated by a whitespace
 * @param {Array.<string>} tags
 * @returns string
 */
const getConcatenatedTags = tags => `.[${tags.join(' ')}]`;

/**
 * Returns an object which contains extension and base name, tags as well as the base name of the file without the tags
 * @param {{extName: string, baseName: string, tags: Array.<string>}} fileInfo
 * @returns {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}}
 */
const normalizeBaseName = fileInfo => {
    const normalizedBaseName = fileInfo.baseName.replace(getConcatenatedTags(fileInfo.tags), '');
    return Object.assign({normalizedBaseName: normalizedBaseName}, fileInfo);
};

/**
 * Returns an object which contains both the stat object of the file in question as well as the file name
 * @param {Object} stat
 * @param {string} fileName
 * @returns {{stat: Object, fileName: string}}
 */
const getFileAndStat = (stat, fileName) => {
    return {stat: stat, fileName: fileName};
};

/**
 * Returns either a Just containing the file info object (if it is a file) or a Nothing (if it actually is a directory)
 * @param {{stat: Object, fileName: string}} fileInfo
 * @returns {Just.<{stat: Object, fileName: string}>|Nothing}
 */
const filterOutDirectory = fileInfo => fileInfo.stat.isFile() ? Just(fileInfo) : Nothing();

/**
 * Returns either a Just containing the file name (if it not considered a junk file) or a Nothing
 * @param {string} fileName
 * @returns {Just.<string>|Nothing}
 */
const filterOutJunkFile = fileName => junk.not(path.basename(fileName)) ? Just(fileName) : Nothing();

/**
 * Returns either a Just contain the file info object (if the stat object could be determined) or a Nothing (if the
 * stat operation has failed)
 * @param {string} fileName
 * @returns {Just.<{fileName: string, stat: object}>|Nothing}
 */
const getFileStat = fileName => {
    let stat;
    try {
        stat = fs.statSync(fileName);
    } catch (e) {
        return Nothing();
    }
    return Just(getFileAndStat(stat, fileName));
};

/**
 * Returns just the file name
 * @param {{fileName: string, stat: object}} fileInfo
 * @returns {string}
 */
const removeStat = fileInfo => fileInfo.fileName;

/**
 * Returns an object which describes the given file including the associated tags
 * @param  {string} fileName
 * @returns {{extName: string, baseName: string, tags: Array.<string>}}
 */
const getFileDescription = R.compose(getTags, getExtAndBaseName);

/**
 * Takes a list of new tags and merges them with the tags which are already present on this file
 * @param {Array.<string>} newTags
 * @param {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}} fileInfo
 * @returns {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}}
 */
const addNewTagsToOldOnes = (newTags, fileInfo) => {
    const tags = R.uniq(R.concat(fileInfo.tags, newTags));
    return Object.assign({}, fileInfo, {tags: tags});
};

/**
 * Takes a list of tags which have to removed and returns a file info object which no longer contains these tags in
 * it's tags property
 * @param {Array.<string>} tagsToBeRemoved
 * @param {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}} fileInfo
 * @returns {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}}
 */
const removeTagsFromOldOnes = (tagsToBeRemoved, fileInfo) => {
    const tags = R.without(tagsToBeRemoved, fileInfo.tags);
    return Object.assign({}, fileInfo, {tags: tags});
};

/**
 * Takes a file info object and returns an object which contains the new base name which includes all tags
 * @param {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string}} fileInfo
 * @returns {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string, newBaseName: string}}
 */
const getNewFileName = fileInfo => {
    const newBaseName = `${fileInfo.normalizedBaseName}${getConcatenatedTags(fileInfo.tags)}`;
    return Object.assign({newBaseName}, fileInfo);
};

/**
 * Takes a file info object and tries to perform a rename operation on the given file. Returns a Left containing the
 * error which has occurred or a Right which contains the new file name
 * @param {{extName: string, baseName: string, tags: Array.<string>, normalizedBaseName: string, newBaseName: string}} fileInfo
 * @returns {Left.<Error>|Right.<string>}
 */
const renameFileOnFilesystem = fileInfo => {
    try {
        fs.renameSync(`${fileInfo.baseName}${fileInfo.extName}`, `${fileInfo.newBaseName}${fileInfo.extName}`);
    } catch (e) {
        return Left(e);
    }
    return Right(fileInfo.newBaseName);
};

/**
 * Returns a Just containing the file info object or Nothing if the file is not fit to be processed (it is a directory,
 * junk, ..)
 * @param {string} fileName
 * @returns {Just.<{extName: string, baseName: string, tags: Array.<string>}>|Nothing}
 */
const getFileInfo = fileName => {
    return filterOutJunkFile(fileName)
        .chain(getFileStat)
        .chain(filterOutDirectory)
        .map(removeStat)
        .map(getFileDescription);
};

/**
 * Takes a file name and a function which either adds or removes tags from the given file name and performs a
 * file rename operation on the given file
 * @param {Function} changeFunc
 * @param {string} fileName
 */
const changeFileTags = (changeFunc, fileName) => {
    const fileInfo = getFileInfo(fileName)
        .map(normalizeBaseName)
        .map(changeFunc)
        .map(getNewFileName);
    if (M.isJust(fileInfo)) {
        Either.either(
            left => console.log(`tagsToFileNames has failed: ${left} for ${fileName}`),
            right => console.log(right),
            renameFileOnFilesystem(fileInfo.getOrElse({}))
        );
    } else {
        console.log(`${fileName} has not been renamed!`);
    }
};

/**
 * Whether the given tag array of the file contains all tags from the filter array
 * @param {Array.<string>} filterTags
 * @param {Array.<string>} fileTags
 * @returns {boolean}
 */
const containsTags = (filterTags, fileTags) => {
    return R.reduce((acc, tag) => {
        return acc && fileTags.indexOf(tag) !== -1;
    }, true, filterTags);
};

/**
 * Returns whether the given file contains the given tags or not
 * @param {Array.<string>} filterTags An array of tags which have be contained in file
 * @param {string} fileName The name of the file which is tested
 */
const fileSatisfiesFilter = (filterTags, fileName) => {
    const result = getFileInfo(fileName)
        .map(R.view(R.lensProp('tags')))
        .map(containsTags.bind(null, filterTags));
    return result.getOrElse(false);
};

module.exports = {
    addNewTagsToOldOnes: addNewTagsToOldOnes,
    removeTagsFromOldOnes: removeTagsFromOldOnes,
    changeFileTags: changeFileTags,
    fileSatisfiesFilter: fileSatisfiesFilter
};
