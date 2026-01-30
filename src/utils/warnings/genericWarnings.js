/**
 * @fileoverview Generic JavaScript Warnings
 * @description Analyzes code for common JavaScript anti-patterns and issues,
 * not specific to ServiceNow. These are language-level best practices.
 */

/**
 * Analyzes code for generic JavaScript warnings.
 *
 * @param {string} code - The code to analyze
 * @returns {string[]} Array of warning messages
 */
export function analyzeGenericWarnings(code) {
  const warnings = [];
  const lines = code.split('\n');

  // Check for TODO/FIXME comments that indicate incomplete work
  const todoMatches = code.match(/\/\/\s*(TODO|FIXME|XXX|HACK|BUG)[\s:]/gi) || [];
  const todoInBlockComments = code.match(/\/\*[\s\S]*?(TODO|FIXME|XXX|HACK|BUG)[\s\S]*?\*\//gi) || [];
  const totalTodos = todoMatches.length + todoInBlockComments.length;
  if (totalTodos > 0) {
    warnings.push(`Found ${totalTodos} TODO/FIXME comment${totalTodos > 1 ? 's' : ''}`);
  }

  // Check for very long lines that hurt readability
  const longLines = lines.filter((line) => line.length > 150);
  if (longLines.length > 0) {
    warnings.push(`${longLines.length} line${longLines.length > 1 ? 's' : ''} exceed 150 characters`);
  }

  // Check for empty catch blocks that swallow errors silently
  const emptyCatchBlocks = (code.match(/catch\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  if (emptyCatchBlocks > 0) {
    warnings.push(`${emptyCatchBlocks} empty catch block${emptyCatchBlocks > 1 ? 's' : ''} (errors silently ignored)`);
  }

  // Check for empty control flow blocks (may indicate incomplete code)
  const emptyIfBlocks = (code.match(/if\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  const emptyForBlocks = (code.match(/for\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  const emptyWhileBlocks = (code.match(/while\s*\([^)]*\)\s*\{\s*\}/g) || []).length;
  const totalEmptyBlocks = emptyIfBlocks + emptyForBlocks + emptyWhileBlocks;
  if (totalEmptyBlocks > 0) {
    warnings.push(`${totalEmptyBlocks} empty code block${totalEmptyBlocks > 1 ? 's' : ''} (if/for/while with no body)`);
  }

  // Check for deeply nested code (indicates need for refactoring)
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of code) {
    if (char === '{') {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else if (char === '}') {
      currentDepth--;
    }
  }
  if (maxDepth >= 6) {
    warnings.push(`Code is deeply nested (${maxDepth} levels) - consider refactoring`);
  }

  // Check for potential unreachable code after return statements
  const unreachablePattern = /return\s+[^;]*;\s*\n\s*[a-zA-Z]/g;
  const unreachableMatches = (code.match(unreachablePattern) || []).length;
  if (unreachableMatches > 0) {
    warnings.push(`Potential unreachable code after return statement`);
  }

  // Check for long functions that should be split
  const functionMatches = code.match(/function\s*\w*\s*\([^)]*\)\s*\{/g) || [];
  const arrowFunctionMatches = code.match(/\([^)]*\)\s*=>\s*\{/g) || [];
  const totalFunctions = functionMatches.length + arrowFunctionMatches.length;
  if (totalFunctions > 0 && lines.length > 50) {
    const avgLinesPerFunction = lines.length / totalFunctions;
    if (avgLinesPerFunction > 50) {
      warnings.push(`Functions may be too long (average ${Math.round(avgLinesPerFunction)} lines) - consider splitting`);
    }
  }

  // Check for functions with too many parameters (code smell)
  const manyParamsPattern = /function\s*\w*\s*\(\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,\s*\w+\s*,\s*\w+/g;
  const manyParamsMatches = (code.match(manyParamsPattern) || []).length;
  if (manyParamsMatches > 0) {
    warnings.push(`${manyParamsMatches} function${manyParamsMatches > 1 ? 's' : ''} with 5+ parameters - consider using an object`);
  }

  // Check for assignment in conditional (common mistake: = instead of ==)
  const assignmentInCondition = code.match(/if\s*\(\s*\w+\s*=[^=]/g) || [];
  if (assignmentInCondition.length > 0) {
    warnings.push(`Possible assignment in condition (= instead of ==) - verify intentional`);
  }

  // Check for nested ternary operators (hurts readability)
  const nestedTernary = code.match(/\?[^:]+\?/g) || [];
  if (nestedTernary.length > 0) {
    warnings.push(`${nestedTernary.length} nested ternary operator${nestedTernary.length > 1 ? 's' : ''} - consider using if/else`);
  }

  // Check for hardcoded credentials (security risk)
  const credentialPatterns = [
    /password\s*[=:]\s*['"][^'"]+['"]/gi,
    /apikey\s*[=:]\s*['"][^'"]+['"]/gi,
    /api_key\s*[=:]\s*['"][^'"]+['"]/gi,
    /secret\s*[=:]\s*['"][^'"]+['"]/gi,
    /token\s*[=:]\s*['"][^'"]+['"]/gi,
  ];
  let credentialCount = 0;
  credentialPatterns.forEach(pattern => {
    const matches = code.match(pattern) || [];
    credentialCount += matches.length;
  });
  if (credentialCount > 0) {
    warnings.push(`${credentialCount} potential hardcoded credential${credentialCount > 1 ? 's' : ''} detected - security risk!`);
  }

  return warnings;
}
