export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['**/*.js'],
  testMatch: ['**/?(*.)+(test).js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
