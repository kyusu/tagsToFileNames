const path = require('path');
const R = require('ramda');
const {
    getExtAndBaseName,
    getTags,
    getConcatenatedTags,
    normalizeBaseName,
    addNewTagsToOldOnes,
    removeTagsFromOldOnes,
    getNewFileName,
    containsTags,
    getFileStat,
    renameFileOnFilesystem,
    fileSatisfiesFilter,
    changeFileTags,
    getFileInfo
} = require('../helpers');

jest.mock('fs');

/**
 * @param {Maybe} m
 * @return {boolean}
 */
const isJust = m => m.either(() => false, () => true);

const isRight = isJust;

const fileInfoToFileName = fileInfo => `${fileInfo.dirName}${path.sep}${fileInfo.baseName}${fileInfo.extName}`;

const toFileNames = R.map(fileInfoToFileName);

const setupFsRenameSyncMocks = (successFileInfos, failureFileInfos) => () => {
    require('fs').__setRenameSyncMocks(toFileNames(successFileInfos), toFileNames(failureFileInfos));
};

/**
 * @param {FileInfo} expectedResult
 * @param {FileInfo} actualResult
 */
const checkFileInfoResult = (expectedResult, actualResult) => {
    expect(actualResult).toBeDefined();
    expect(actualResult.extName).toEqual(expectedResult.extName);
    expect(actualResult.baseName).toEqual(expectedResult.baseName);
    expect(actualResult.dirName).toEqual(expectedResult.dirName);
};

describe('getExtAndBaseName', () => {
    it('should return a record given a directory path', () => {
        const result = getExtAndBaseName('/Users/kyusu/GitHub/tagsToFileNames');
        const expectedResult = {
            extName: '',
            baseName: 'tagsToFileNames',
            dirName: '/Users/kyusu/GitHub'
        };
        checkFileInfoResult(expectedResult, result);
    });

    it('should return a record given just a file name', () => {
        const result = getExtAndBaseName('helper.test.js');
        const expectedResult = {
            extName: '.js',
            baseName: 'helper.test',
            dirName: '.'
        };
        checkFileInfoResult(expectedResult, result);
    });

    it('should not crash given an empty string', () => {
        const result = getExtAndBaseName('');
        const expectedResult = {
            extName: '',
            baseName: '',
            dirName: '.'
        };
        checkFileInfoResult(expectedResult, result);
    });

    it('should return a record given a file name with tags', () => {
        const result = getExtAndBaseName('helper.test.[test unit-test jest].js');
        const expectedResult = {
            extName: '.js',
            baseName: 'helper.test.[test unit-test jest]',
            dirName: '.'
        };
        checkFileInfoResult(expectedResult, result);
    });
});

describe('getTags', () => {
    const checkResult = (expectedFileInfo, expectedTags, actualResult) => {
        checkFileInfoResult(expectedFileInfo, actualResult);
        expect(actualResult.tags).toEqual(expectedTags);
    };
    it('should return a file info record when given a file without tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, [], result);
    });

    it('should return a file info record when given a file with correctly formatted tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[test unit-test jest]',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, ['test', 'unit-test', 'jest'], result);
    });

    it('should return a file info when given a file with too much spaces in the tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[   test         unit-test jest]',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, ['test', 'unit-test', 'jest'], result);
    });

    it('should be able to handle [ or ] inside tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[[test] [unit-test] [[jest]',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, ['[test]', '[unit-test]', '[[jest'], result);
    });

    it('should be able to handle empty tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[]',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, [], result);
    });

    it('should not crash when given a file with broken tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[test unit-test jest',
            dirName: '.'
        };
        const result = getTags(fileInfo);
        checkResult(fileInfo, [], result);
    });
});

describe('getConcatenatedTags', () => {
    it('should concatenated an array of tags', () => {
        const result = getConcatenatedTags(['test', 'unit-test', 'jest']);
        expect(result).toEqual('.[test unit-test jest]');
    });

    it('should handle an empty array of tags', () => {
        const result = getConcatenatedTags([]);
        expect(result).toEqual('.[]');
    });
});

describe('normalizedBaseName', () => {
    const checkNormalizedFileInfoResult = (expectedResult, actualResult) => {
        expect(R.keys(actualResult).sort()).toEqual(['baseName', 'dirName', 'extName', 'normalizedBaseName', 'tags']);
        expect(actualResult).toBeDefined();
        expect(actualResult.extName).toEqual(expectedResult.extName);
        expect(actualResult.baseName).toEqual(expectedResult.baseName);
        expect(actualResult.dirName).toEqual(expectedResult.dirName);
        expect(actualResult.tags).toEqual(expectedResult.tags);
    };
    it('should strips away the tags given a file with tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[test unit-test jest]',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest']
        };
        const result = normalizeBaseName(fileInfo);
        checkNormalizedFileInfoResult(fileInfo, result);
        expect(result.normalizedBaseName).toEqual('helper.test');
    });

    it('should handle files without tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test',
            dirName: '.',
            tags: []
        };
        const result = normalizeBaseName(fileInfo);
        checkNormalizedFileInfoResult(fileInfo, result);
        expect(result.normalizedBaseName).toEqual(fileInfo.baseName);
    });

    it('should handle empty baseName properties', () => {
        const fileInfo = {
            extName: '',
            baseName: '',
            dirName: '.',
            tags: []
        };
        const result = normalizeBaseName(fileInfo);
        checkNormalizedFileInfoResult(fileInfo, result);
        expect(result.normalizedBaseName).toEqual(fileInfo.baseName);
    });
});

describe('addNewTagsToOldOne', () => {
    it('should merge new and old tags', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const newTags = ['test', 'unit-testing', 'mocking'];
        const result = addNewTagsToOldOnes(newTags, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(['test', 'unit-test', 'jest', 'unit-testing', 'mocking']);
    });

    it('should new tags to a file which has none', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: [],
            normalizedBaseName: 'helper.test'
        };
        const newTags = ['test', 'unit-test', 'jest'];
        const result = addNewTagsToOldOnes(newTags, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(newTags);
    });

    it('should handle empty new tags', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const newTags = [];
        const result = addNewTagsToOldOnes(newTags, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(fileInfo.tags);
    });
});

describe('removeTagsFromOldOnes', () => {
    it('should remove the given tags', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const tagsToBeRemoved = ['test', 'jest'];
        const result = removeTagsFromOldOnes(tagsToBeRemoved, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(['unit-test']);
    });

    it('should handle removing non-existing tags', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const tagsToBeRemoved = ['tape', 'mocha'];
        const result = removeTagsFromOldOnes(tagsToBeRemoved, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(fileInfo.tags);
    });

    it('should handle empty tags', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const tagsToBeRemoved = [];
        const result = removeTagsFromOldOnes(tagsToBeRemoved, fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.tags).toEqual(fileInfo.tags);
    });
});

describe('getNewFileName', () => {
    it('should should add all tags to the file name', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest'],
            normalizedBaseName: 'helper.test'
        };
        const result = getNewFileName(fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.newBaseName).toEqual('helper.test.[test unit-test jest]');
    });

    it('should leave the file name untouched when no tags exist', () => {
        const fileInfo = {
            extName: '.js',
            dirName: '.',
            tags: [],
            normalizedBaseName: 'helper.test'
        };
        const result = getNewFileName(fileInfo);
        checkFileInfoResult(fileInfo, result);
        expect(result.newBaseName).toEqual(fileInfo.normalizedBaseName);
    });
});

describe('containsTags', () => {
    it('should return false given to different list of tags', () => {
        const filterTags = ['test', 'unit-test', 'mocks'];
        const fileTags = ['jest', 'tape', 'mocha'];
        expect(containsTags(filterTags, fileTags)).toEqual(false);
    });

    it('should return true given a list which contains tags from the other list', () => {
        const filterTags = ['mocks', 'jest'];
        const fileTags = ['unit-test', 'test', 'jest', 'mocks'];
        expect(containsTags(filterTags, fileTags)).toEqual(true);
    });

    it('should return true given two empty list of tags', () => {
        expect(containsTags([], [])).toEqual(true);
    });
});

describe('getFileStat', () => {
    const dir = 'myDirectory';
    const existingFile = 'myFile.js';
    const nonExistingFile = 'non-existing-file.js';

    beforeAll(() => require('fs').__setStatSyncMocks([dir], [existingFile], [nonExistingFile]));

    it('should return a Just for an existing file', () => {
        const result = getFileStat(existingFile);
        expect(isJust(result)).toEqual(true);
        const unwrappedResult = result.option(1);
        expect(unwrappedResult.fileName).toEqual(existingFile);
        expect(unwrappedResult.stat).toBeDefined();
    });

    it('should return a Just for an existing directory', () => {
        const result = getFileStat(dir);
        expect(isJust(result)).toEqual(true);
        const unwrappedResult = result.option(1);
        expect(unwrappedResult.fileName).toEqual(dir);
        expect(unwrappedResult.stat).toBeDefined();
    });

    it('should return a Nothing for an non-existing file', () => {
        const result = getFileStat(nonExistingFile);
        expect(isJust(result)).toEqual(false);
    });
});

describe('renameFileOnFileSystem', () => {
    const successFileInfo = {
        extName: '.js',
        baseName: 'helper.[test jest]',
        dirName: '.',
        tags: ['test', 'jest', 'unit-test'],
        normalizeBaseName: 'helper',
        newBaseName: 'helper.[test jest unit-test]'
    };
    const failureFileInfo = {
        extName: '.js',
        baseName: 'helper.test.[test jest]',
        dirName: '.',
        tags: ['test', 'jest', 'unit-test'],
        normalizeBaseName: 'helper.test',
        newBaseName: 'helper.test.[test jest]'
    };

    beforeAll(setupFsRenameSyncMocks([successFileInfo], [failureFileInfo]));

    it('should return a Right upon successfully renaming a file', () => {
        const result = renameFileOnFilesystem(successFileInfo);
        expect(isRight(result)).toEqual(true);
    });

    it('should return a Left upon failing to rename a file ', () => {
        const result = renameFileOnFilesystem(failureFileInfo);
        expect(isRight(result)).toEqual(false);
    });
});

describe('fileSatisfiesFilter', () => {
    const dirName = 'myDirectory';
    const existingFile = 'myFile.[test jest unit-test].js';
    const nonexistingFile = 'non-existing-file.[undefined null].js';

    beforeAll(() => require('fs').__setStatSyncMocks([dirName], [existingFile], [nonexistingFile]));

    it('should return true for an existing file with the matching tags', () => {
        const result = fileSatisfiesFilter(['test', 'jest'], existingFile);
        expect(result).toEqual(true);
    });

    it('should return false for an existing file with no matching tags', () => {
        const result = fileSatisfiesFilter(['foo', 'bar'], existingFile);
        expect(result).toEqual(false);
    });

    it('should return false for a non-existing file', () => {
        const result = fileSatisfiesFilter(['undefined', 'null'], nonexistingFile);
        expect(result).toEqual(false);
    });

    it('should return false for a directory', () => {
        const result = fileSatisfiesFilter(['test', 'jest'], dirName);
        expect(result).toEqual(false);
    });
});

describe('changeFileTags - add', () => {
    const dirName = 'myDirectory';

    const addTag = fileName => changeFileTags(R.partial(addNewTagsToOldOnes, [['unit-testing']]), fileName);

    const successFileInfo = {
        extName: '.js',
        baseName: 'myFile.[test jest unit-test]',
        dirName: '.',
        tags: ['test', 'jest', 'unit-test'],
        normalizeBaseName: 'myFile'
    };
    const failureFileInfo1 = {
        extName: '.js',
        baseName: 'non-existing-file.[undefined null]',
        dirName: '.',
        tags: ['undefined', 'null'],
        normalizeBaseName: 'non-existing-file'
    };
    const failureFileInfo2 = {
        extName: '.js',
        baseName: 'myExistingFile.[undefined null]',
        dirName: '.',
        tags: ['undefined', 'null'],
        normalizeBaseName: 'myExistingFile'
    };
    const existingFile1 = fileInfoToFileName(successFileInfo);
    const existingFile2 = fileInfoToFileName(failureFileInfo2);
    const nonexistingFile = fileInfoToFileName(failureFileInfo1);

    beforeAll(() => {
        require('fs').__setStatSyncMocks([dirName], [existingFile1, existingFile2], [nonexistingFile]);
        setupFsRenameSyncMocks([successFileInfo], [failureFileInfo1, failureFileInfo2])();
    });

    it('should return a success message for an existing file', () => {
        const message = addTag(existingFile1);
        expect(message).toEqual('myFile.[test jest unit-test unit-testing]');
    });

    it('should return a failure message for a non-existing file', () => {
        const message = addTag(nonexistingFile);
        expect(message).toEqual('./non-existing-file.[undefined null].js has not been renamed!');
    });

    it('should returan a failure message when renaming an existing files fails', () => {
        const message = addTag(existingFile2);
        expect(message).toEqual('tagsToFileNames has failed: Error: 💥 for ./myExistingFile.[undefined null].js');
    });
});

describe('getFileInfo', () => {
    const dir = 'myDirectory';
    const existingFile = 'myFile.js';
    const junkFile = '.DS_Store';
    const nonExistingFile = 'non-existing-file.js';

    beforeAll(() => require('fs').__setStatSyncMocks([dir], [existingFile, junkFile], [nonExistingFile]));

    it('should return a Just for an existing file', () => {
        const result = getFileInfo(existingFile);
        expect(isJust(result)).toBe(true);
    });

    it('should return a Nothing for a directory', () => {
       const result = getFileInfo(dir);
       expect(isJust(result)).toEqual(false);
    });

    it('should return a Nothing for a non-existing file', () => {
        const result = getFileInfo(nonExistingFile);
        expect(isJust(result)).toEqual(false);
    });

    it('should return a Nothing for a junk file', () => {
        const result = getFileInfo(junkFile);
        expect(isJust(result)).toEqual(false);
    });
});
