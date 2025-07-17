export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.spec.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../../packages/shared-utils/$1'
  }
}; 