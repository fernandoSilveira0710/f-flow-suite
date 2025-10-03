// Jest setup file for integration tests
import { loadEnvConfig } from '../src/common/env';

// Load environment configuration for tests
loadEnvConfig();

// Set test timeout
jest.setTimeout(30000);