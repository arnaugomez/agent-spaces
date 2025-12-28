import { describe, test, expect } from 'bun:test';
import { validateEvent, validateEventsMessage } from '../src';
import { PROTOCOL_VERSION } from '../src/version';

describe('events validation', () => {
  const timestamp = new Date().toISOString();

  describe('userMessage event', () => {
    test('validates valid userMessage event', () => {
      const result = validateEvent({
        type: 'userMessage',
        timestamp,
        content: 'Hello!',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('message event', () => {
    test('validates valid message event', () => {
      const result = validateEvent({
        type: 'message',
        timestamp,
        success: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('createFile event', () => {
    test('validates successful createFile event', () => {
      const result = validateEvent({
        type: 'createFile',
        timestamp,
        path: 'test.ts',
        success: true,
        bytesWritten: 42,
      });
      expect(result.success).toBe(true);
    });

    test('validates failed createFile event', () => {
      const result = validateEvent({
        type: 'createFile',
        timestamp,
        path: 'test.ts',
        success: false,
        error: 'File already exists',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('readFile event', () => {
    test('validates successful readFile event', () => {
      const result = validateEvent({
        type: 'readFile',
        timestamp,
        path: 'config.json',
        success: true,
        content: '{"key": "value"}',
        encoding: 'utf-8',
        size: 16,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('shell event', () => {
    test('validates successful shell event', () => {
      const result = validateEvent({
        type: 'shell',
        timestamp,
        command: 'echo hello',
        success: true,
        exitCode: 0,
        stdout: 'hello\n',
        stderr: '',
        durationMs: 50,
      });
      expect(result.success).toBe(true);
    });

    test('validates timed out shell event', () => {
      const result = validateEvent({
        type: 'shell',
        timestamp,
        command: 'sleep 1000',
        success: false,
        timedOut: true,
        error: 'Command timed out',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('approvalRequired event', () => {
    test('validates approvalRequired event', () => {
      const result = validateEvent({
        type: 'approvalRequired',
        timestamp,
        operationId: 'shell-1',
        operationType: 'shell',
        reason: 'Destructive command',
        details: {
          command: 'rm -rf temp/',
          policy: 'destructive_commands',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('policyDenied event', () => {
    test('validates policyDenied event', () => {
      const result = validateEvent({
        type: 'policyDenied',
        timestamp,
        operationType: 'shell',
        reason: 'Network access not allowed',
        suggestion: 'Enable network in policy',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('events message validation', () => {
  const timestamp = new Date().toISOString();

  test('validates valid events message', () => {
    const result = validateEventsMessage({
      protocolVersion: PROTOCOL_VERSION,
      runId: 'run_123',
      status: 'completed',
      events: [
        { type: 'createFile', timestamp, path: 'test.ts', success: true },
        {
          type: 'shell',
          timestamp,
          command: 'bun run test.ts',
          success: true,
          exitCode: 0,
          stdout: 'ok',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('validates awaiting_approval status', () => {
    const result = validateEventsMessage({
      protocolVersion: PROTOCOL_VERSION,
      runId: 'run_456',
      status: 'awaiting_approval',
      events: [
        {
          type: 'approvalRequired',
          timestamp,
          operationId: 'op-1',
          operationType: 'shell',
          reason: 'Needs approval',
          details: {},
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});



