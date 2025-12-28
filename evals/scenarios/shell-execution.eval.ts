import { defineEval } from '../lib/runner';
import { allShellEventsSucceeded, hasShellOutput } from '../lib/assertions';

export default defineEval({
  name: 'shell-execution',
  description: 'Test shell command execution',
  prompt: 'Run a shell command to print the current date and time.',

  expectedBehavior: [
    { type: 'shell' },
  ],

  successCriteria: (events) => {
    // Check that shell commands succeeded
    if (!allShellEventsSucceeded(events)) {
      return false;
    }

    // Check that output contains date-like content
    const hasDate = hasShellOutput(events, /\d{4}/) || // Year
                    hasShellOutput(events, /\d{1,2}:\d{2}/); // Time

    return hasDate;
  },
});



