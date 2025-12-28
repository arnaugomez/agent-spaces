import type { ToolDef, FunctionDef } from './types';

/**
 * Define a tool with type-safe functions.
 */
export function defineTool<
  TFunctions extends Record<string, FunctionDef>
>(definition: ToolDef<TFunctions>): ToolDef<TFunctions> {
  return definition;
}

/**
 * Define a function within a tool.
 */
export function defineFunction<TParams, TReturn>(
  definition: FunctionDef<TParams, TReturn>
): FunctionDef<TParams, TReturn> {
  return definition;
}



