import { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test|e2e-spec).[jt]s?(x)'],
  preset: 'ts-jest',
  roots: ['./test'],
  collectCoverageFrom: ['<rootDir>/src/**'],
  testTimeout: 30000,
};

export default config;
