import type { Config } from 'jest';

const config: Config = {
  displayName: 'SteadyLetters iOS — Live Integration Tests',
  testMatch: ['<rootDir>/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '../../tsconfig.json' }],
  },
  testTimeout: 60000,
  verbose: true,
  bail: true,
};

export default config;
