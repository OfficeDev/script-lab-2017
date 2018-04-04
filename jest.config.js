module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleFileExtensions: [
        'ts',
        'js',
    ],
    testRegex: './src/__tests__/.*\\.test\\.ts$',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
    ],
};
