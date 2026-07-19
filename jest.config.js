module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  projects: [
    {
      preset: 'ts-jest',
      displayName: 'node',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testMatch: ['<rootDir>/tests/**/!(*.component).test.ts']
    },
    {
      preset: 'ts-jest',
      displayName: 'dom',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      testMatch: ['<rootDir>/tests/**/*.component.test.tsx']
    }
  ]
};
