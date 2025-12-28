import { defineEval } from '../lib/runner';
import { fileWasCreated, hasShellOutput } from '../lib/assertions';

export default defineEval({
  name: 'capabilities',
  description: 'Test that the agent can use code to process data',
  prompt: `Create a TypeScript script that:
1. Creates an array of numbers [1, 2, 3, 4, 5]
2. Filters to only even numbers
3. Prints the result

Then run the script.`,

  expectedBehavior: [
    { type: 'createFile', pathPattern: /\.ts$/ },
    { type: 'shell', commandPattern: /bun run/ },
  ],

  successCriteria: (events) => {
    // Check that a file was created
    if (!fileWasCreated(events, /\.ts$/)) {
      return false;
    }

    // Check that output contains [2, 4] or similar
    return hasShellOutput(events, /2.*4/) || hasShellOutput(events, /\[ 2, 4 \]/);
  },
});



