import { describe, test, expect } from 'bun:test';
import {
  validateOperation,
  validateOperationsMessage,
  parseOperation,
  OperationValidationError,
} from '../src';
import { PROTOCOL_VERSION } from '../src/version';

describe('operations validation', () => {
  describe('message operation', () => {
    test('validates valid message operation', () => {
      const result = validateOperation({
        type: 'message',
        content: 'Hello, world!',
      });
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('message');
    });

    test('validates message with optional id', () => {
      const result = validateOperation({
        type: 'message',
        id: 'msg-1',
        content: 'Hello!',
      });
      expect(result.success).toBe(true);
    });

    test('rejects message without content', () => {
      const result = validateOperation({
        type: 'message',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createFile operation', () => {
    test('validates valid createFile operation', () => {
      const result = validateOperation({
        type: 'createFile',
        path: 'test.ts',
        content: 'console.log("hello");',
      });
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('createFile');
    });

    test('rejects absolute path', () => {
      const result = validateOperation({
        type: 'createFile',
        path: '/etc/passwd',
        content: 'test',
      });
      expect(result.success).toBe(false);
    });

    test('rejects path with directory traversal', () => {
      const result = validateOperation({
        type: 'createFile',
        path: '../outside/file.txt',
        content: 'test',
      });
      expect(result.success).toBe(false);
    });

    test('accepts nested path', () => {
      const result = validateOperation({
        type: 'createFile',
        path: 'src/utils/helpers.ts',
        content: 'export const x = 1;',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('readFile operation', () => {
    test('validates valid readFile operation', () => {
      const result = validateOperation({
        type: 'readFile',
        path: 'config.json',
      });
      expect(result.success).toBe(true);
    });

    test('accepts encoding option', () => {
      const result = validateOperation({
        type: 'readFile',
        path: 'image.png',
        encoding: 'base64',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('editFile operation', () => {
    test('validates valid editFile operation', () => {
      const result = validateOperation({
        type: 'editFile',
        path: 'file.ts',
        edits: [{ oldContent: 'foo', newContent: 'bar' }],
      });
      expect(result.success).toBe(true);
    });

    test('rejects empty edits array', () => {
      const result = validateOperation({
        type: 'editFile',
        path: 'file.ts',
        edits: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('deleteFile operation', () => {
    test('validates valid deleteFile operation', () => {
      const result = validateOperation({
        type: 'deleteFile',
        path: 'temp.txt',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('shell operation', () => {
    test('validates valid shell operation', () => {
      const result = validateOperation({
        type: 'shell',
        command: 'bun run test.ts',
      });
      expect(result.success).toBe(true);
    });

    test('accepts optional timeout', () => {
      const result = validateOperation({
        type: 'shell',
        command: 'npm test',
        timeout: 60000,
      });
      expect(result.success).toBe(true);
    });

    test('rejects timeout below minimum', () => {
      const result = validateOperation({
        type: 'shell',
        command: 'npm test',
        timeout: 100,
      });
      expect(result.success).toBe(false);
    });

    test('accepts env variables', () => {
      const result = validateOperation({
        type: 'shell',
        command: 'npm test',
        env: { NODE_ENV: 'test' },
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('operations message validation', () => {
  test('validates valid operations message', () => {
    const result = validateOperationsMessage({
      protocolVersion: PROTOCOL_VERSION,
      operations: [
        { type: 'message', content: 'Starting...' },
        { type: 'createFile', path: 'test.ts', content: 'code' },
        { type: 'shell', command: 'bun run test.ts' },
      ],
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid protocol version', () => {
    const result = validateOperationsMessage({
      protocolVersion: '2.0',
      operations: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('parseOperation', () => {
  test('returns parsed operation', () => {
    const op = parseOperation({
      type: 'shell',
      command: 'echo hello',
    });
    expect(op.type).toBe('shell');
  });

  test('throws OperationValidationError for invalid input', () => {
    expect(() => parseOperation({ type: 'invalid' })).toThrow(
      OperationValidationError
    );
  });
});



