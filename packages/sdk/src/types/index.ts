/**
 * Re-export types from protocol package.
 */
export type {
  Operation,
  MessageOperation,
  CreateFileOperation,
  ReadFileOperation,
  EditFileOperation,
  DeleteFileOperation,
  ShellOperation,
  Event,
  UserMessageEvent,
  MessageEvent,
  CreateFileEvent,
  ReadFileEvent,
  EditFileEvent,
  DeleteFileEvent,
  ShellEvent,
  ApprovalRequiredEvent,
  PolicyDeniedEvent,
} from '@agent-spaces/protocol';

export { PROTOCOL_VERSION } from '@agent-spaces/protocol';

