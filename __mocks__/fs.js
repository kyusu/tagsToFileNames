const daggy = require('daggy');
const R = require('ramda');

const fs = jest.genMockFromModule('fs');

const StatSyncReturnType = daggy.taggedSum('StatSyncReturnType', {
    File: [],
    Directory: [],
    Exception: []
});

let statSyncMocks;

const isFileFunc = () => ({isFile: R.always(true)});
const isDirectory = () => ({isFile: R.always(false)});
const isException = () => {
    throw new Error('💥');
};

const statSyncCataCfg = {
    File: () => isFileFunc,
    Directory: () => isDirectory,
    Exception: () => isException
};

const statSyncBehaviourReducer = (acc, [fileName, statSyncReturnType]) => {
    acc[fileName] = statSyncReturnType.cata(statSyncCataCfg);
    return acc;
};

const __setStatSyncMocks = behaviours => {
    statSyncMocks = R.reduce(statSyncBehaviourReducer, Object.create(null), R.toPairs(behaviours));
};

let renameSyncMocks;

const RenameSyncResultType = daggy.taggedSum('RenameSyncResultType', {
    Success: [],
    Failure: []
});

const renameSyncCataCfg = {
    Success: () => () => undefined,
    Failure: () => isException
};

const renameSyncBehaviourReducer = (acc, [fileName, renameSyncResult]) => {
    acc[fileName] = renameSyncResult.cata(renameSyncCataCfg);
    return acc;
};

const __setRenameSyncMocks = behaviours => {
    renameSyncMocks = R.reduce(renameSyncBehaviourReducer, Object.create(null), R.toPairs(behaviours));
};

fs.StatSyncReturnType = StatSyncReturnType;
fs.__setStatSyncMocks = __setStatSyncMocks;
fs.RenameSyncResultType = RenameSyncResultType;
fs.__setRenameSyncMocks = __setRenameSyncMocks;
fs.statSync = fileName => statSyncMocks[fileName]();
fs.renameSync = oldPath => renameSyncMocks[oldPath]();

module.exports = fs;
