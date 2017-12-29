const {
    getExtAndBaseName,
    getTags,
    getConcatenatedTags,
    normalizeBaseName
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

    it('should not crash given a null', () => {
        getExtAndBaseName(null);
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
    it('should not crash when given a null', () => {
        const result = getConcatenatedTags(null);
        expect(result).toEqual('.[]');
    });
});

describe('normalizedBaseName', () => {
    it('should strips away the tags given a file with tags', () => {
        const fileInfo = {
            extName: '.js',
            baseName: 'helper.test.[test unit-test jest]',
            dirName: '.',
            tags: ['test', 'unit-test', 'jest']
        };
        const result = normalizeBaseName(fileInfo);
        checkFileInfoResult(fileInfo, result);
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
        checkFileInfoResult(fileInfo, result);
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
        checkFileInfoResult(fileInfo, result);
        expect(result.normalizedBaseName).toEqual(fileInfo.baseName);
    });
});
