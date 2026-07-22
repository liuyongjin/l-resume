/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          isolatedModules: true,
          paths: { '@/*': ['./src/*'] },
          baseUrl: '.',
        },
      },
    ],
  },
  // Avoid pulling babel.config.js / react-native presets into unit tests
  transformIgnorePatterns: ['/node_modules/'],
}
