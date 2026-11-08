/**
 * Jest Configuration for OUTPOST APP Security Test Suite
 * CommonJS config — works with Node.js experimental VM modules
 */
export default {
  // Only run tests in server/tests — never crawl node_modules
  testMatch: ['<rootDir>/server/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/server/node_modules/'],

  // Transform nothing — server tests are CommonJS, no transpilation needed
  transform: {},

  // Set test environment variables
  testEnvironment: 'node',

  // Timeout: 30s per test (Render cold start can be slow)
  testTimeout: 30000,

  // Force exit after all tests done (prevents open handle hangs)
  forceExit: true,
  detectOpenHandles: true,

  // Verbose output for CI
  verbose: true,

  // Coverage (optional — doesn't block CI)
  collectCoverageFrom: ['server/**/*.js', '!server/node_modules/**'],
};
