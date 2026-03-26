const path = require('path');

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: path.join(__dirname, '.babelrc') }]
  },
  transformIgnorePatterns: ['/node_modules/']
};
