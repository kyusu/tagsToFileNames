const R = require('ramda');

const fs = jest.genMockFromModule('fs');

let statSyncMocks;

const isFileFunc = () => ({isFile: R.always(true)});
const isDirectory = () => ({isFile: R.always(false)});
const isException = () => {
    throw new Error('💥');
};

/**
 * @param {function} mockFn
 * @param {Object.<string, function>} mock
 * @param {string} name
 * @return {Object.<string, function>}
 */
const mockReducer = (mockFn, mock, name) => {
    mock[name] = mockFn;
    return mock;
};

/**
 * @param {Array.<string>} dirs
 * @param {Array.<string>} existingFiles
 * @param {Array.<string>} nonExistingFiles
 * @private
 */
const __setStatSyncMocks = (dirs, existingFiles, nonExistingFiles) => {
    const dirMock = R.reduce(R.partial(mockReducer, [isDirectory]), Object.create(null), dirs);
    const fileMock = R.reduce(R.partial(mockReducer, [isFileFunc]), Object.create(null), existingFiles);
    const nonExistingMock = R.reduce(R.partial(mockReducer, [isException]), Object.create(null), nonExistingFiles);
    statSyncMocks = R.mergeAll([dirMock, fileMock, nonExistingMock]);
};

let renameSyncMocks;

/**
 * @param {Array.<string>} successFileNames
 * @param {Array.<string>} failureFileNames
 * @private
 */
const __setRenameSyncMocks = (successFileNames, failureFileNames) => {
    const successMocks = R.reduce(R.partial(mockReducer, [R.identity]), Object.create(null), successFileNames);
    const failureMocks = R.reduce(R.partial(mockReducer, [isException]), Object.create(null), failureFileNames);
    renameSyncMocks = R.mergeAll([successMocks, failureMocks]);
};

fs.__setStatSyncMocks = __setStatSyncMocks;
fs.__setRenameSyncMocks = __setRenameSyncMocks;
fs.statSync = fileName => statSyncMocks[fileName]();
fs.renameSync = oldPath => renameSyncMocks[oldPath]();

module.exports = fs;
