import type { Operation, Event } from '@agent-spaces/protocol';
import { PROTOCOL_VERSION } from '@agent-spaces/protocol';

/**
 * LLM configuration.
 */
export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  apiKey: string;
  maxTokens?: number;
}

/**
 * Get LLM configuration from environment.
 */
export function getLLMConfig(): LLMConfig {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      model: process.env.EVAL_MODEL || 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4096,
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'anthropic',
      model: process.env.EVAL_MODEL || 'claude-3-haiku-20240307',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 4096,
    };
  }

  throw new Error('No LLM API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.');
}

/**
 * System prompt for Agent Spaces protocol.
 */
const SYSTEM_PROMPT = `You are an AI agent that can execute tasks by generating operations.

You communicate using a JSON protocol. Your response must be a valid JSON object with this structure:
{
  "protocolVersion": "1.0",
  "operations": [
    { "type": "message", "content": "..." },
    { "type": "createFile", "path": "...", "content": "..." },
    { "type": "shell", "command": "..." }
  ]
}

Available operations:
- message: Send a message to the user
- createFile: Create a file (path, content, overwrite?)
- readFile: Read a file (path)
- editFile: Edit a file (path, edits: [{oldContent, newContent}])
- deleteFile: Delete a file (path)
- shell: Run a shell command (command, timeout?)

You are running in a Bun environment. Use TypeScript for scripts.
Always respond with valid JSON only, no markdown or explanations.`;

/**
 * Generate operations from an LLM.
 */
export async function generateOperations(
  config: LLMConfig,
  prompt: string,
  events: Event[]
): Promise<Operation[]> {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];

  if (events.length > 0) {
    messages.push({
      role: 'assistant',
      content: 'Previous events: ' + JSON.stringify(events),
    });
  }

  if (config.provider === 'openai') {
    return generateOpenAI(config, messages);
  } else {
    return generateAnthropic(config, messages);
  }
}

/**
 * Generate operations using OpenAI.
 */
async function generateOpenAI(
  config: LLMConfig,
  messages: Array<{ role: string; content: string }>
): Promise<Operation[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content) as { operations?: Operation[] };
  return parsed.operations || [];
}

/**
 * Generate operations using Anthropic.
 */
async function generateAnthropic(
  config: LLMConfig,
  messages: Array<{ role: string; content: string }>
): Promise<Operation[]> {
  const systemMessage = messages.find((m) => m.role === 'system');
  const userMessages = messages.filter((m) => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemMessage?.content,
      messages: userMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  });

  const data = await response.json() as {
    content: Array<{ text: string }>;
  };

  const content = data.content[0]?.text;
  if (!content) {
    throw new Error('No response from Anthropic');
  }

  // Extract JSON from response (Claude might wrap it)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as { operations?: Operation[] };
  return parsed.operations || [];
}

