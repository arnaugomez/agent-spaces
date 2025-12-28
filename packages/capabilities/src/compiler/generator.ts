import type { ToolDef, CompiledTool } from '../types';
import { parseToolFunctions, generateParameterInterface } from './parser';

/**
 * Generate TypeScript type definitions for a tool.
 */
export function generateTypeDefinitions(tool: ToolDef): string {
  const lines: string[] = [
    `// Generated type definitions for ${tool.name}`,
    `// Version: ${tool.version || '1.0.0'}`,
    '',
  ];

  // Generate parameter interfaces
  for (const [name, fn] of Object.entries(tool.functions)) {
    lines.push(generateParameterInterface(name, fn.parameters));
    lines.push('');
  }

  // Generate main interface
  const functionSigs: string[] = [];
  for (const [name, fn] of Object.entries(tool.functions)) {
    const paramType = `${capitalize(name)}Params`;
    const hasRequiredParams = Object.values(fn.parameters).some(
      (p) => p.required
    );
    const paramSig = hasRequiredParams
      ? `params: ${paramType}`
      : `params?: ${paramType}`;
    functionSigs.push(`  /** ${fn.description} */\n  ${name}(${paramSig}): Promise<unknown>;`);
  }

  lines.push(`export interface ${capitalize(tool.name)}Tool {`);
  lines.push(functionSigs.join('\n\n'));
  lines.push('}');
  lines.push('');
  lines.push(`export const ${tool.name}: ${capitalize(tool.name)}Tool;`);

  return lines.join('\n');
}

/**
 * Generate runtime code for a tool.
 */
export function generateRuntimeCode(tool: ToolDef): string {
  const lines: string[] = [
    `// Generated runtime code for ${tool.name}`,
    `import { createCapabilityProxy } from '@agent-spaces/capabilities/runtime';`,
    '',
    `export const ${tool.name} = createCapabilityProxy('${tool.name}', {`,
  ];

  for (const [name, fn] of Object.entries(tool.functions)) {
    lines.push(`  ${name}: {`);
    lines.push(`    name: '${name}',`);
    lines.push(`    description: '${fn.description.replace(/'/g, "\\'")}',`);
    lines.push(`    requiresApproval: ${fn.requiresApproval || false},`);
    lines.push(`  },`);
  }

  lines.push('});');

  return lines.join('\n');
}

/**
 * Compile a tool definition to a compiled tool.
 */
export function compileTool(tool: ToolDef): CompiledTool {
  const functions = parseToolFunctions(tool);
  const typeDefinitions = generateTypeDefinitions(tool);
  const runtimeCode = generateRuntimeCode(tool);

  return {
    name: tool.name,
    version: tool.version || '1.0.0',
    functions,
    typeDefinitions,
    runtimeCode,
  };
}

/**
 * Capitalize first letter.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

