import { defineEval } from '../lib/runner';
import { hasShellOutput, fileWasCreated } from '../lib/assertions';

export default defineEval({
  name: 'file-operations',
  description: 'Test basic file create and shell execution',
  prompt: 'Create a TypeScript file that prints "Hello World" and run it using Bun.',

  expectedBehavior: [
    { type: 'createFile', pathPattern: /\.ts$/ },
    { type: 'shell', commandPattern: /bun run/ },
  ],

  successCriteria: (events) => {
    // Check that a TS file was created
    if (!fileWasCreated(events, /\.ts$/)) {
      return false;
    }

    // Check that the output contains "Hello World"
    return hasShellOutput(events, /Hello World/i);
  },
});



