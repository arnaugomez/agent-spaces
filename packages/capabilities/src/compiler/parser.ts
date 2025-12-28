import type { ToolDef, ParameterDef, CompiledFunction } from '../types';

/**
 * Parse a tool definition and extract function metadata.
 */
export function parseToolFunctions(
  tool: ToolDef
): Record<string, CompiledFunction> {
  const functions: Record<string, CompiledFunction> = {};

  for (const [name, fn] of Object.entries(tool.functions)) {
    functions[name] = {
      name,
      description: fn.description,
      parameters: fn.parameters,
      requiresApproval: fn.requiresApproval || tool.config?.requiresApproval || false,
    };
  }

  return functions;
}

/**
 * Convert parameter definitions to TypeScript type.
 */
export function parameterToTypeScript(param: ParameterDef): string {
  switch (param.type) {
    case 'string':
      if (param.enum) {
        return param.enum.map((v) => `'${v}'`).join(' | ');
      }
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'unknown[]';
    case 'object':
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Generate TypeScript parameter interface.
 */
export function generateParameterInterface(
  functionName: string,
  parameters: Record<string, ParameterDef>
): string {
  const interfaceName = `${capitalize(functionName)}Params`;
  const props: string[] = [];

  for (const [name, param] of Object.entries(parameters)) {
    const optional = param.required ? '' : '?';
    const type = parameterToTypeScript(param);
    const description = param.description ? `  /** ${param.description} */\n` : '';
    props.push(`${description}  ${name}${optional}: ${type};`);
  }

  return `export interface ${interfaceName} {\n${props.join('\n')}\n}`;
}

/**
 * Capitalize first letter.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



