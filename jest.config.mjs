export default {
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/tests/**/*.test.mjs'],
    testTimeout: 30000,
};
