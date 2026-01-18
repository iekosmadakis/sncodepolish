/**
 * @fileoverview GlideAware Studio - Main Code Formatter
 * @description Orchestrates code formatting using Prettier and custom fixes.
 * Supports JavaScript (ServiceNow) and JSON modes.
 * All processing happens client-side (offline capable).
 */

import * as prettier from 'prettier/standalone';
import * as babelPlugin from 'prettier/plugins/babel';
import * as estreePlugin from 'prettier/plugins/estree';

import { applyGenericFixes } from './fixes/genericFixes';
import { applyServiceNowFixes } from './fixes/servicenowFixes';
import { applyJsonFixes } from './fixes/jsonFixes';
import { analyzeGenericWarnings } from './warnings/genericWarnings';
import { analyzeServiceNowWarnings } from './warnings/servicenowWarnings';
import { analyzeJsonWarnings } from './warnings/jsonWarnings';

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Prettier configuration for JavaScript (ServiceNow) */
const JS_PRETTIER_CONFIG = {
  parser: 'babel',
  plugins: [babelPlugin, estreePlugin],
  printWidth: 100,
  tabWidth: 4,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  proseWrap: 'preserve',
  endOfLine: 'lf'
};

/** Prettier configuration for JSON */
const JSON_PRETTIER_CONFIG = {
  parser: 'json',
  plugins: [babelPlugin, estreePlugin],
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf'
};

// ============================================================================
// JAVASCRIPT FORMATTING
// ============================================================================

/**
 * Main formatting function for JavaScript (ServiceNow) code.
 * Applies generic fixes, ServiceNow fixes, and Prettier formatting.
 *
 * @param {string} code - The code to format
 * @returns {Promise<Object>} Result object with output, fixes, warnings, errors, and metrics
 */
export async function polishCode(code) {
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'No code provided',
      output: '',
      fixes: [],
      warnings: [],
      errors: []
    };
  }

  try {
    // Step 1: Apply generic JavaScript fixes
    const { processed: genericProcessed, fixes: genericFixes } = applyGenericFixes(code);

    // Step 2: Apply ServiceNow-specific fixes (includes fuzzy matching)
    const snResult = applyServiceNowFixes(genericProcessed);
    const snProcessed = snResult.processed;
    const snFixes = snResult.fixes;
    const snSuggestions = snResult.suggestions || []; // Low-confidence fuzzy matches

    // Combine all fixes
    const allFixes = [...genericFixes, ...snFixes];

    // Step 3: Format with Prettier
    const formatted = await prettier.format(snProcessed, JS_PRETTIER_CONFIG);

    // Step 4: Analyze for warnings and errors
    const genericWarnings = analyzeGenericWarnings(formatted);
    const snWarningsResult = analyzeServiceNowWarnings(formatted);

    // Handle both array format and { warnings, errors } format
    let snWarnings = [];
    let snErrors = [];
    if (Array.isArray(snWarningsResult)) {
      snWarnings = snWarningsResult;
    } else {
      snWarnings = snWarningsResult.warnings || [];
      snErrors = snWarningsResult.errors || [];
    }

    // Include fuzzy match suggestions as warnings (low confidence)
    const allWarnings = [...genericWarnings, ...snWarnings, ...snSuggestions];
    const allErrors = [...snErrors];

    // Calculate metrics
    const metrics = {
      originalLines: code.split('\n').length,
      formattedLines: formatted.split('\n').length,
      originalChars: code.length,
      formattedChars: formatted.length,
      fixCount: allFixes.length || 1
    };

    return {
      success: true,
      output: formatted,
      fixes: allFixes.length > 0 ? allFixes : ['Code formatted'],
      warnings: allWarnings,
      errors: allErrors,
      metrics
    };
  } catch (prettierError) {
    // Extract error location from Prettier error message
    const errorMatch = prettierError.message.match(/\((\d+):(\d+)\)/);
    let errorInfo = prettierError.message;

    if (errorMatch) {
      const line = parseInt(errorMatch[1]);
      const col = parseInt(errorMatch[2]);
      const lines = code.split('\n');
      const problemLine = lines[line - 1] || '';
      errorInfo = `Syntax error at line ${line}, column ${col}:\n"${problemLine.trim()}"\n\n${prettierError.message}`;
    }

    return {
      success: false,
      error: `Code has syntax errors:\n${errorInfo}`,
      output: code,
      fixes: [],
      warnings: [],
      errors: []
    };
  }
}

// ============================================================================
// LIGHT FORMATTING (Visualize Mode)
// ============================================================================

/**
 * Light formatting for Visualize mode - only structural cleanup.
 * Uses Prettier for consistent formatting without any code replacements or fixes.
 * This ensures AST positions align correctly with displayed code.
 *
 * @param {string} code - The code to format
 * @returns {Promise<Object>} Result object with formatted output or error
 */
export async function formatCodeStructure(code) {
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'No code provided',
      output: ''
    };
  }

  try {
    // Only apply Prettier formatting - no custom fixes
    const formatted = await prettier.format(code, JS_PRETTIER_CONFIG);

    return {
      success: true,
      output: formatted
    };
  } catch (prettierError) {
    // Extract error location from Prettier error message
    const errorMatch = prettierError.message.match(/\((\d+):(\d+)\)/);
    let errorInfo = prettierError.message;

    if (errorMatch) {
      const line = parseInt(errorMatch[1]);
      const col = parseInt(errorMatch[2]);
      const lines = code.split('\n');
      const problemLine = lines[line - 1] || '';
      errorInfo = `Syntax error at line ${line}, column ${col}:\n"${problemLine.trim()}"`;
    }

    return {
      success: false,
      error: errorInfo,
      output: code // Return original code on error
    };
  }
}

// ============================================================================
// JSON FORMATTING
// ============================================================================

/**
 * Main formatting function for JSON content.
 * Applies JSON fixes, validation, and Prettier formatting.
 *
 * @param {string} code - The JSON content to format
 * @returns {Promise<Object>} Result object with output, fixes, warnings, errors, and metrics
 */
export async function polishJson(code) {
  if (!code || code.trim() === '') {
    return {
      success: false,
      error: 'No JSON provided',
      output: '',
      fixes: [],
      warnings: [],
      errors: []
    };
  }

  try {
    // Step 1: Apply JSON-specific fixes (comments, trailing commas, quotes)
    const { processed, fixes } = applyJsonFixes(code);

    // Step 2: Pre-validate before Prettier (catch detailed errors)
    const jsonWarningsResult = analyzeJsonWarnings(processed);

    // If there are syntax errors, try Prettier anyway (may fix some issues)
    if (jsonWarningsResult.errors.length > 0) {
      try {
        const formatted = await prettier.format(processed, JSON_PRETTIER_CONFIG);

        // Re-analyze the formatted output
        const finalWarnings = analyzeJsonWarnings(formatted);

        const metrics = {
          originalLines: code.split('\n').length,
          formattedLines: formatted.split('\n').length,
          originalChars: code.length,
          formattedChars: formatted.length,
          fixCount: fixes.length || 1
        };

        return {
          success: true,
          output: formatted,
          fixes: fixes.length > 0 ? fixes : ['JSON formatted'],
          warnings: finalWarnings.warnings,
          errors: finalWarnings.errors,
          metrics
        };
      } catch {
        // Prettier also failed, return original errors
        return {
          success: false,
          error: jsonWarningsResult.errors.join('\n'),
          output: processed,
          fixes,
          warnings: jsonWarningsResult.warnings,
          errors: jsonWarningsResult.errors
        };
      }
    }

    // Step 3: Format with Prettier
    const formatted = await prettier.format(processed, JSON_PRETTIER_CONFIG);

    // Step 4: Analyze formatted output
    const finalWarnings = analyzeJsonWarnings(formatted);

    // Calculate metrics
    const metrics = {
      originalLines: code.split('\n').length,
      formattedLines: formatted.split('\n').length,
      originalChars: code.length,
      formattedChars: formatted.length,
      fixCount: fixes.length || 1
    };

    return {
      success: true,
      output: formatted,
      fixes: fixes.length > 0 ? fixes : ['JSON formatted'],
      warnings: finalWarnings.warnings,
      errors: finalWarnings.errors,
      metrics
    };
  } catch (prettierError) {
    // Extract error location from Prettier error message
    const errorMatch = prettierError.message.match(/\((\d+):(\d+)\)/);
    let errorInfo = prettierError.message;

    if (errorMatch) {
      const line = parseInt(errorMatch[1]);
      const col = parseInt(errorMatch[2]);
      const lines = code.split('\n');
      const problemLine = lines[line - 1] || '';
      errorInfo = `JSON error at line ${line}, column ${col}:\n"${problemLine.trim()}"\n\n${prettierError.message}`;
    }

    return {
      success: false,
      error: `Invalid JSON:\n${errorInfo}`,
      output: code,
      fixes: [],
      warnings: [],
      errors: []
    };
  }
}

export default polishCode;
