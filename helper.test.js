const R = require('ramda');
const {
    getExtAndBaseName,
    getTags,
    getConcatenatedTags,
    normalizeBaseName,
    addNewTagsToOldOnes,
    removeTagsFromOldOnes,
    getNewFileName,
    containsTags
} = require('./helpers');

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
        expect(R.keys(actualResult).sort()).toEqual(['dirName', 'extName', 'normalizedBaseName', 'tags']);
        expect(actualResult).toBeDefined();
        expect(actualResult.extName).toEqual(expectedResult.extName);
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
        const  fileInfo = {
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
