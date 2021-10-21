const R = require("ramda");
const junk = require("junk");
const path = require("path");
const fs = require("fs");
const Maybe = require("crocks/Maybe");
const Just = Maybe.Just;
const Nothing = Maybe.Nothing;
const Either = require("crocks/Either");
const Left = Either.Left;
const Right = Either.Right;

/**
 * @typedef {Array.<string>} Tags
 */

/**
 * @typedef {Object} FileStats
 * @property {fs.Stats} stat
 * @property {string} fileName
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} extName
 * @property {string} baseName
 * @property {string} dirName
 */

/**
 * @typedef {Object} FileInfoWithTags
 * @property {string} extName
 * @property {string} baseName
 * @property {string} dirName
 * @property {Tags} tags
 */

/**
 * @typedef {Object} EnhancedFileInfo
 * @property {string} extName
 * @property {string} baseName
 * @property {string} dirName
 * @property {Tags} tags
 * @property {string} normalizedBaseName
 */

/**
 * @typedef {Object} RenamedFileInfo
 * @property {string} extName
 * @property {string} baseName
 * @property {string} dirName
 * @property {Tags} tags
 * @property {string} normalizedBaseName
 * @property {string} newBaseName
 */

/**
 * Given a file name it returns an object which contains the base and extension name of the file
 * @param {string} fileName
 * @returns {FileInfo}
 */
const getExtAndBaseName = (fileName) => {
  const extName = path.extname(fileName);
  const baseName = path.basename(fileName, extName);
  const dirName = path.dirname(fileName);
  return {
    extName,
    baseName,
    dirName,
  };
};

/**
 * Given a list of string it returns a new list from which all empty strings have been removed
 * @type {Function}
 * @param {Array.<string>}
 * @return {Array.<string>}
 */
const removeEmptyTags = R.reject(R.isEmpty);

/**
 * @type {Function}
 * @param {Tags} tags
 * @param {FileInfo} fileInfo
 * @return {FileInfoWithTags}
 */
const assocTags = R.assoc("tags");

/**
 * Returns an object which contains file information as well as all the tags stored in the file
 * name
 * @nosideeffects
 * @param {FileInfo} fileInfo
 * @returns {FileInfoWithTags}
 */
const getTags = (fileInfo) => {
  const matches = fileInfo.baseName.match(/\.\[(.+)]$/);
  const tags = matches
    ? removeEmptyTags(matches[1].replace(".[", "").replace("].", "").split(" "))
    : [];
  return assocTags(tags, fileInfo);
};

/**
 * Given an array of tags it returns a string containing all tags separated by a whitespace
 * @param {Tags} tags
 * @nosideeffects
 * @returns string
 */
const getConcatenatedTags = (tags) => `.[${tags.join(" ")}]`;

/**
 * @type {Function}
 */
const assocNormalizedBaseName = R.assoc("normalizedBaseName");

/**
 * Returns an object which contains extension and base name, tags as well as the base name of the file without the tags
 * @nosideeffects
 * @param {FileInfoWithTags} fileInfo
 * @returns {EnhancedFileInfo}
 */
const normalizeBaseName = (fileInfo) => {
  const normalizedBaseName = fileInfo.baseName.replace(
    getConcatenatedTags(fileInfo.tags),
    ""
  );
  return assocNormalizedBaseName(normalizedBaseName, fileInfo);
};

/**
 * Returns either a Just containing the file info object (if it is a file) or a Nothing (if it actually is a directory)
 * @param {FileStats} fileInfo
 * @returns {Just.<FileStats>|Nothing}
 */
const filterOutDirectory = (fileInfo) =>
  fileInfo.stat.isFile() ? Just(fileInfo) : Nothing();

/**
 * Returns either a Just containing the file name (if it not considered a junk file) or a Nothing
 * @param {string} fileName
 * @returns {Just.<string>|Nothing}
 */
const filterOutJunkFile = (fileName) =>
  junk.not(path.basename(fileName)) ? Just(fileName) : Nothing();

/**
 * Returns either a Just contain the file info object (if the stat object could be determined) or a Nothing (if the
 * stat operation has failed)
 * @param {string} fileName
 * @returns {Just.<FileStats>|Nothing}
 */
const getFileStat = (fileName) => {
  let stat;
  try {
    stat = fs.statSync(fileName);
  } catch (e) {
    return Nothing();
  }
  return Just({
    stat,
    fileName,
  });
};

/**
 * Returns an object which describes the given file including the associated tags
 * @param  {string} fileName
 * @returns {FileInfoWithTags}
 */
const getFileDescription = R.compose(getTags, getExtAndBaseName);

/**
 * Merge two list of tags
 * @type {Function}
 * @param {Tags} existingTags
 * @param {Tags} newTags
 * @return {Tags}
 */
const mergeTags = R.compose(R.uniq, R.concat);

/**
 * @type {Function}
 * @nosideeffects
 * @param {EnhancedFileInfo} fileInfo
 * @return {EnhancedFileInfo}
 */
const setTags = R.set(R.lensProp("tags"));

/**
 * Takes a list of new tags and merges them with the tags which are already present on this file
 * @nosideeffects
 * @param {Tags} newTags
 * @param {EnhancedFileInfo} fileInfo
 * @returns {EnhancedFileInfo}
 */
const addNewTagsToOldOnes = (newTags, fileInfo) => {
  const tags = mergeTags(fileInfo.tags, newTags);
  return setTags(tags, fileInfo);
};

/**
 * Takes a list of tags which have to removed and returns a file info object which no longer contains these tags in
 * it's tags property
 * @nosideeffects
 * @param {Tags} tagsToBeRemoved
 * @param {EnhancedFileInfo} fileInfo
 * @returns {EnhancedFileInfo}
 */
const removeTagsFromOldOnes = (tagsToBeRemoved, fileInfo) => {
  const tags = R.without(tagsToBeRemoved, fileInfo.tags);
  return setTags(tags, fileInfo);
};

/**
 * @type {Function}
 * @nosideeffects
 * @param {EnhancedFileInfo} fileInfo
 * @return {RenamedFileInfo}
 */
const assocNewBaseName = R.assoc("newBaseName");

/**
 * Takes a file info object and returns an object which contains the new base name which includes all tags
 * @nosideeffects
 * @param {EnhancedFileInfo} fileInfo
 * @returns {RenamedFileInfo}
 */
const getNewFileName = (fileInfo) => {
  const tags = fileInfo.tags.length ? getConcatenatedTags(fileInfo.tags) : "";
  const newBaseName = `${fileInfo.normalizedBaseName}${tags}`;
  return assocNewBaseName(newBaseName, fileInfo);
};

/**
 * Takes a file info object and tries to perform a rename operation on the given file. Returns a Left containing the
 * error which has occurred or a Right which contains the new file name
 * @param {RenamedFileInfo} fileInfo
 * @returns {Left.<Error>|Right.<string>}
 */
const renameFileOnFilesystem = (fileInfo) => {
  try {
    fs.renameSync(
      `${fileInfo.dirName}${path.sep}${fileInfo.baseName}${fileInfo.extName}`,
      `${fileInfo.dirName}${path.sep}${fileInfo.newBaseName}${fileInfo.extName}`
    );
  } catch (e) {
    return Left(e);
  }
  return Right(fileInfo.newBaseName);
};

/**
 * @type {Function}
 * @nosideeffects
 * @param {FileStats} file
 * @return {string}
 */
const viewFileName = R.view(R.lensProp("fileName"));

/**
 * Returns a Just containing the file info object or Nothing if the file is not fit to be processed (it is a directory,
 * junk, ..)
 * @param {string} fileName
 * @returns {Just.<{FileInfoWithTags}>|Nothing}
 */
const getFileInfo = (fileName) =>
  filterOutJunkFile(fileName)
    .chain(getFileStat)
    .chain(filterOutDirectory)
    .map(viewFileName)
    .map(getFileDescription);

const tryFileRenaming = (fileName) => (value) =>
  renameFileOnFilesystem(value).either(
    (left) => `tagsToFileNames has failed: ${left} for ${fileName}`,
    R.identity
  );

/**
 * Takes a file name and a function which either adds or removes tags from the given file name and performs a
 * file rename operation on the given file
 * @param {Function} changeFunc
 * @param {string} fileName
 * @return {string} The resulting message
 */
const changeFileTags = (changeFunc, fileName) => {
  const fileInfo = getFileInfo(fileName)
    .map(normalizeBaseName)
    .map(changeFunc)
    .map(getNewFileName);
  return fileInfo.either(
    () => `${fileName} has not been renamed!`,
    tryFileRenaming(fileName)
  );
};

/**
 * Whether the given tag array of the file contains all tags from the filter array
 * @nosideeffects
 * @param {Tags} filterTags
 * @param {Tags} fileTags
 * @returns {boolean}
 */
const containsTags = (filterTags, fileTags) =>
  R.reduce((acc, tag) => acc && fileTags.indexOf(tag) !== -1, true, filterTags);

/**
 * @type {Function}
 * @nosideeffects
 * @param {FileInfoWithTags} fileInfo
 * @return {Tags}
 */
const viewTags = R.view(R.lensProp("tags"));

/**
 * Returns whether the given file contains the given tags or not
 * @param {Tags} filterTags An array of tags which have be contained in file
 * @param {string} fileName The name of the file which is tested
 */
const fileSatisfiesFilter = (filterTags, fileName) =>
  getFileInfo(fileName)
    .map(viewTags)
    .map(R.partial(containsTags, [filterTags]))
    .either(R.always(false), R.identity);

module.exports = {
  addNewTagsToOldOnes,
  removeTagsFromOldOnes,
  changeFileTags,
  fileSatisfiesFilter,
  getExtAndBaseName,
  getTags,
  getConcatenatedTags,
  normalizeBaseName,
  getNewFileName,
  containsTags,
  getFileStat,
  renameFileOnFilesystem,
  getFileInfo,
};
