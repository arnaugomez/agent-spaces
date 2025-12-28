import type { Event, ShellEvent, CreateFileEvent } from '@agent-spaces/protocol';

/**
 * Check if any shell event contains the expected output.
 */
export function hasShellOutput(events: Event[], pattern: string | RegExp): boolean {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

  return events.some((event) => {
    if (event.type !== 'shell') return false;
    const shellEvent = event as ShellEvent;
    return (
      regex.test(shellEvent.stdout || '') ||
      regex.test(shellEvent.stderr || '')
    );
  });
}

/**
 * Check if all shell events succeeded.
 */
export function allShellEventsSucceeded(events: Event[]): boolean {
  const shellEvents = events.filter((e) => e.type === 'shell') as ShellEvent[];
  return shellEvents.length > 0 && shellEvents.every((e) => e.success);
}

/**
 * Check if a file was created.
 */
export function fileWasCreated(events: Event[], pathPattern: string | RegExp): boolean {
  const regex = typeof pathPattern === 'string' ? new RegExp(pathPattern) : pathPattern;

  return events.some((event) => {
    if (event.type !== 'createFile') return false;
    const createEvent = event as CreateFileEvent;
    return createEvent.success && regex.test(createEvent.path);
  });
}

/**
 * Check if all file operations succeeded.
 */
export function allFileOpsSucceeded(events: Event[]): boolean {
  const fileEvents = events.filter((e) =>
    ['createFile', 'readFile', 'editFile', 'deleteFile'].includes(e.type)
  );

  return fileEvents.length > 0 && fileEvents.every((e) => (e as { success: boolean }).success);
}

/**
 * Count events of a specific type.
 */
export function countEvents(events: Event[], type: string): number {
  return events.filter((e) => e.type === type).length;
}

/**
 * Get all shell outputs concatenated.
 */
export function getShellOutputs(events: Event[]): string {
  return events
    .filter((e) => e.type === 'shell')
    .map((e) => (e as ShellEvent).stdout || '')
    .join('\n');
}

