module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json'
        }
    },
    testMatch: [
        '**/tests/*.spec.+(ts|tsx|js)',
        '**/tests/**/*.spec.+(ts|tsx|js)'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/src/test/'
    ],
    collectCoverage: true,
    collectCoverageFrom: [
        '**/src/**/*.ts',
        '!**/src/common/**/*.ts',
        '!**/src/resources/config/*',
        '!**/src/resources/handler/*',
        '!**/src/resources/validator/GlobalValidate.ts',
        '!**/src/resources/backpressure/*',
        '!**/src/**/*.d.ts',
        '!**/src/tests/**/*.ts',
        '!**/src/services/OperatorService.ts',
        '!**/src/domains/OperatorDomain.ts'
    ],
    coverageDirectory: './coverage-unit',
    reporters: [
        'default',
        ['./node_modules/jest-html-reporter', {
            pageTitle: 'UnitTest Report',
            outputPath: './coverage-unit/report.html',
            sort: 'titleAsc'
        }]
    ],
    setupFilesAfterEnv: ['./jest.setup.js']
};
