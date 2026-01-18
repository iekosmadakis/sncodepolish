/**
 * @fileoverview AST Parser for ServiceNow JavaScript Code Visualization
 * @description Parses JavaScript code into an Abstract Syntax Tree (AST) and extracts
 * control flow structures for visualization. Uses Acorn for parsing.
 */

import * as acorn from 'acorn';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * ServiceNow-specific API classes that should be highlighted in visualizations
 * Validated against ServiceNow Zurich API Reference documentation
 * @see https://www.servicenow.com/docs/bundle/zurich-api-reference
 */
const SERVICENOW_CLASSES = [
  // ==========================================================================
  // CORE DATABASE CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideRecord',           // Global & Scoped - Primary database access
  'GlideRecordSecure',     // Global & Scoped - GlideRecord with ACL enforcement
  'GlideAggregate',        // Global & Scoped - Aggregate queries (COUNT, SUM, etc.)
  'GlideQuery',            // Global & Scoped - Fluent query builder
  'GlideQueryCondition',   // Global & Scoped - Query condition builder
  
  // ==========================================================================
  // DATE/TIME CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideDateTime',         // Global & Scoped - Date and time operations
  'GlideDate',             // Global & Scoped - Date operations
  'GlideTime',             // Scoped - Time operations
  'GlideDuration',         // Scoped - Duration calculations
  'GlideSchedule',         // Scoped - Schedule operations
  
  // ==========================================================================
  // SYSTEM CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideSystem',           // Global & Scoped - System utilities (gs object)
  'GlideSysAttachment',    // Global & Scoped - Attachment management
  'GlideLocale',           // Scoped - Locale/language utilities
  
  // ==========================================================================
  // USER/SESSION CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideUser',             // Global & Scoped - Current user information
  'GlideSession',          // Global & Scoped - Session information
  'GlideImpersonate',      // Global - User impersonation
  
  // ==========================================================================
  // ELEMENT CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideElement',          // Global & Scoped - Field/element operations
  'GlideElementDescriptor', // Scoped & Global - Element metadata
  
  // ==========================================================================
  // CLIENT-SIDE CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideAjax',             // Client - Async server calls
  'GlideForm',             // Client - Form manipulation (g_form)
  'GlideList2',            // Client - List manipulation
  'GlideModal',            // Client - Modal dialogs
  'GlideDialogWindow',     // Client - Dialog windows
  
  // ==========================================================================
  // SCRIPTING/EVALUATION CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideScopedEvaluator',  // Global & Scoped - Script evaluation
  'GlideFilter',           // Scoped & Global - Filter operations
  
  // ==========================================================================
  // PLUGIN CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlidePluginManager',    // Scoped - Plugin management
  
  // ==========================================================================
  // EMAIL CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideEmailOutbound',    // Scoped - Outbound email
  
  // ==========================================================================
  // HTTP/REST/SOAP CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideHTTPRequest',      // Global - HTTP requests
  'GlideHTTPResponse',     // Global - HTTP responses
  'RESTMessageV2',         // Scoped & Global (via sn_ws) - REST outbound
  'RESTResponseV2',        // Scoped & Global - REST response handling
  'SOAPMessageV2',         // Scoped & Global (via sn_ws) - SOAP outbound
  'SOAPResponseV2',        // Scoped & Global - SOAP response handling
  
  // ==========================================================================
  // SCOPED API NAMESPACES (Validated - Zurich API Reference)
  // ==========================================================================
  'sn_ws',                 // Web Services namespace
  'sn_fd',                 // Flow Designer namespace
  
  // ==========================================================================
  // FLOW DESIGNER (Validated - Zurich API Reference)
  // ==========================================================================
  'FlowAPI',               // Scoped & Global - Flow Designer API
  
  // ==========================================================================
  // XML CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideXMLUtil',          // Scoped & Global - XML utilities
  
  // ==========================================================================
  // UTILITY CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideRecordUtil',       // Global - GlideRecord utilities
  'TableUtils',            // Global - Table utilities
  'ArrayUtil',             // Global - Array utilities
  'GlideExcelParser',      // Scoped & Global - Excel parsing
  'GlideDigest',           // Scoped - Cryptographic digest
  
  // ==========================================================================
  // IMPORT/TRANSFORM CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideImportSetRun',     // Scoped & Global - Import set operations
  'GlideImportSetTransformer', // Scoped & Global - Transform operations
  
  // ==========================================================================
  // CMDB CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'CMDBUtil',              // Global - CMDB utilities
  
  // ==========================================================================
  // WORKFLOW CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'WorkflowScheduler',     // Global - Workflow scheduling
  
  // ==========================================================================
  // OAUTH CLASSES (Validated - Zurich API Reference)
  // ==========================================================================
  'GlideOAuthClient',      // Scoped & Global - OAuth client
  'GlideOAuthClientRequest', // Scoped & Global - OAuth request
  'GlideOAuthClientResponse', // Scoped & Global - OAuth response
  'GlideOAuthToken',       // Scoped & Global - OAuth token
  
  // ==========================================================================
  // CLIENT-SIDE OBJECTS (Validated - Common usage)
  // ==========================================================================
  'g_form',                // Client - Form object reference
  'g_list',                // Client - List object reference
  'g_user',                // Client - User object reference
  
  // ==========================================================================
  // BUSINESS RULE OBJECTS (Validated - Common usage)
  // ==========================================================================
  'current',               // Server - Current record in Business Rules
  'previous',              // Server - Previous record in Business Rules
  'action'                 // Global & Scoped - UI Action context
];

/**
 * ServiceNow GlideRecord and API methods categorized by operation type
 * Validated against ServiceNow Zurich API Reference
 * Categories: database, loop, filter, read, write, config
 * @see https://www.servicenow.com/docs/bundle/zurich-api-reference
 */
const GLIDE_RECORD_METHODS = {
  // ==========================================================================
  // DATABASE OPERATIONS (Validated)
  // ==========================================================================
  query: 'database',           // Execute query
  get: 'database',             // Get single record by sys_id or field
  insert: 'database',          // Insert new record
  update: 'database',          // Update current record
  updateMultiple: 'database',  // Update multiple records
  deleteRecord: 'database',    // Delete current record
  deleteMultiple: 'database',  // Delete multiple records
  initialize: 'database',      // Initialize for insert
  newRecord: 'database',       // Create new record object
  
  // ==========================================================================
  // ITERATION METHODS (Validated)
  // ==========================================================================
  next: 'loop',                // Move to next record
  hasNext: 'loop',             // Check if more records exist
  
  // ==========================================================================
  // QUERY BUILDING / FILTERS (Validated)
  // ==========================================================================
  addQuery: 'filter',          // Add query condition
  addEncodedQuery: 'filter',   // Add encoded query string
  addNullQuery: 'filter',      // Add null check condition
  addNotNullQuery: 'filter',   // Add not null condition
  addJoinQuery: 'filter',      // Add join query
  addActiveQuery: 'filter',    // Add active=true condition
  addOrCondition: 'filter',    // Add OR condition
  setLimit: 'filter',          // Limit result count
  orderBy: 'filter',           // Order by field ascending
  orderByDesc: 'filter',       // Order by field descending
  chooseWindow: 'filter',      // Set result window
  
  // ==========================================================================
  // READ OPERATIONS (Validated)
  // ==========================================================================
  getValue: 'read',            // Get field value
  getDisplayValue: 'read',     // Get display value
  getElement: 'read',          // Get GlideElement
  getRowCount: 'read',         // Get total row count
  getTableName: 'read',        // Get table name
  getRecordClassName: 'read',  // Get record class name
  getClassDisplayValue: 'read', // Get class display value
  getEncodedQuery: 'read',     // Get encoded query string
  getUniqueValue: 'read',      // Get sys_id
  getLink: 'read',             // Get record link
  getLabel: 'read',            // Get field label
  getAttribute: 'read',        // Get attribute value
  getED: 'read',               // Get element descriptor
  getLastErrorMessage: 'read', // Get last error
  
  // ==========================================================================
  // WRITE OPERATIONS (Validated)
  // ==========================================================================
  setValue: 'write',           // Set field value
  setDisplayValue: 'write',    // Set display value
  applyTemplate: 'write',      // Apply template to record
  autoSysFields: 'write',      // Enable/disable auto sys fields
  
  // ==========================================================================
  // CONFIGURATION METHODS (Validated)
  // ==========================================================================
  setWorkflow: 'config',       // Enable/disable workflows
  setAbortAction: 'config',    // Abort current action
  setForceUpdate: 'config',    // Force update even if no changes
  setQueryReferences: 'config', // Set reference field handling
  
  // ==========================================================================
  // VALIDATION METHODS (Validated)
  // ==========================================================================
  isValid: 'read',             // Check if record is valid
  isValidField: 'read',        // Check if field is valid
  isValidRecord: 'read',       // Check if record exists
  isNewRecord: 'read',         // Check if record is new
  isActionAborted: 'read',     // Check if action was aborted
  canRead: 'read',             // Check read permission
  canWrite: 'read',            // Check write permission
  canCreate: 'read',           // Check create permission
  canDelete: 'read',           // Check delete permission
  
  // ==========================================================================
  // CHANGE TRACKING METHODS (Validated)
  // ==========================================================================
  changes: 'read',             // Check if any field changed
  changesTo: 'read',           // Check if field changed to value
  changesFrom: 'read',         // Check if field changed from value
  nil: 'read',                 // Check if field is nil/empty
  
  // ==========================================================================
  // GLIDEAGGREGATE SPECIFIC (Validated)
  // ==========================================================================
  addAggregate: 'filter',      // Add aggregate function
  groupBy: 'filter',           // Group by field
  getAggregate: 'read',        // Get aggregate result
  addHaving: 'filter'          // Add having clause
};

/**
 * GlideSystem (gs) methods commonly used in ServiceNow scripts
 * Validated against ServiceNow Zurich API Reference and community documentation
 * @see https://www.servicenow.com/docs/bundle/zurich-api-reference
 */
const GLIDE_SYSTEM_METHODS = [
  // ==========================================================================
  // LOGGING METHODS (Validated)
  // ==========================================================================
  'log',                   // Log message
  'info',                  // Info level log
  'warn',                  // Warning level log
  'error',                 // Error level log
  'debug',                 // Debug level log
  
  // ==========================================================================
  // USER CONTEXT METHODS (Validated)
  // ==========================================================================
  'getUserID',             // Get current user sys_id
  'getUserName',           // Get current user name
  'getUser',               // Get GlideUser object
  'getSession',            // Get GlideSession object
  'hasRole',               // Check if user has role
  'hasRoleInGroup',        // Check role in group
  'isLoggedIn',            // Check if user is logged in
  'isInteractive',         // Check if interactive session
  
  // ==========================================================================
  // DATE/TIME METHODS (Validated)
  // ==========================================================================
  'now',                   // Current date/time
  'nowDateTime',           // Current date/time formatted
  'daysAgo',               // Date X days ago
  'daysAgoStart',          // Start of day X days ago
  'daysAgoEnd',            // End of day X days ago
  'hoursAgo',              // Date X hours ago
  'hoursAgoStart',         // Start of hour X hours ago
  'hoursAgoEnd',           // End of hour X hours ago
  'minutesAgo',            // Date X minutes ago
  'monthsAgo',             // Date X months ago
  'monthsAgoStart',        // Start of month X months ago
  'monthsAgoEnd',          // End of month X months ago
  'yearsAgo',              // Date X years ago
  'beginningOfLastMonth',  // Start of last month
  'endOfLastMonth',        // End of last month
  'beginningOfThisMonth',  // Start of this month
  'endOfThisMonth',        // End of this month
  'beginningOfThisQuarter', // Start of this quarter
  'endOfThisQuarter',      // End of this quarter
  'beginningOfThisYear',   // Start of this year
  'endOfThisYear',         // End of this year
  'beginningOfToday',      // Start of today
  'endOfToday',            // End of today
  'dateGenerate',          // Generate date from parts
  
  // ==========================================================================
  // PROPERTIES METHODS (Validated)
  // ==========================================================================
  'getProperty',           // Get system property
  
  // ==========================================================================
  // MESSAGE METHODS (Validated)
  // ==========================================================================
  'getMessage',            // Get translated message
  'addInfoMessage',        // Add info message to page
  'addErrorMessage',       // Add error message to page
  
  // ==========================================================================
  // SCRIPT INCLUDE METHODS (Validated)
  // ==========================================================================
  'include',               // Include script
  
  // ==========================================================================
  // UTILITY METHODS (Validated)
  // ==========================================================================
  'nil',                   // Check if value is nil/empty
  'tableExists',           // Check if table exists
  'generateGUID',          // Generate GUID
  
  // ==========================================================================
  // EVENT METHODS (Validated)
  // ==========================================================================
  'eventQueue',            // Queue an event
  'eventQueueScheduled',   // Queue scheduled event
  
  // ==========================================================================
  // MISCELLANEOUS (Validated)
  // ==========================================================================
  'print',                 // Print output
  'getCurrentScopeName',   // Get current application scope
  'getDisplayValueFor'     // Get display value for reference
];

// =============================================================================
// AST PARSING
// =============================================================================

/**
 * Parses JavaScript code into an AST using Acorn
 * @param {string} code - The JavaScript code to parse
 * @returns {Object} - { ast: Object|null, error: string|null }
 */
export function parseCode(code) {
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'script',
      locations: true,
      ranges: true,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true
    });
    return { ast, error: null };
  } catch (error) {
    return { ast: null, error: error.message };
  }
}

// =============================================================================
// CONTROL FLOW EXTRACTION
// =============================================================================

/**
 * Extracts control flow nodes from an AST
 * @param {Object} ast - The AST to analyze
 * @param {string} code - Original source code for extracting snippets
 * @returns {Array} - Array of flow nodes
 */
export function extractControlFlow(ast, code) {
  const nodes = [];
  let nodeId = 0;

  /**
   * Generates a unique node ID
   */
  const generateId = () => `node_${nodeId++}`;

  /**
   * Extracts a code snippet from the source
   */
  const getSnippet = (start, end, maxLength = 50) => {
    const snippet = code.substring(start, end).trim();
    if (snippet.length > maxLength) {
      return snippet.substring(0, maxLength) + '...';
    }
    return snippet;
  };

  /**
   * Determines if a call is a ServiceNow API call
   */
  const getServiceNowCallType = (node) => {
    if (node.type !== 'CallExpression') return null;

    const callee = node.callee;
    
    // Check for new GlideRecord() etc.
    if (node.type === 'NewExpression' && callee.type === 'Identifier') {
      if (SERVICENOW_CLASSES.includes(callee.name)) {
        return { class: callee.name, method: 'constructor' };
      }
    }

    // Check for gr.method() calls
    if (callee.type === 'MemberExpression' && callee.property) {
      const methodName = callee.property.name || callee.property.value;
      if (GLIDE_RECORD_METHODS[methodName]) {
        return { method: methodName, category: GLIDE_RECORD_METHODS[methodName] };
      }
    }

    return null;
  };

  /**
   * Recursively walks the AST and extracts nodes
   */
  const walk = (node, parentId = null, context = {}) => {
    if (!node) return null;

    switch (node.type) {
      // Function declarations and expressions
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        const name = node.id?.name || context.name || 'anonymous';
        const funcNode = {
          id: generateId(),
          type: 'function',
          label: `function ${name}()`,
          snippet: getSnippet(node.start, Math.min(node.start + 60, node.body?.start || node.end)),
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(funcNode);

        // Process function body
        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            node.body.body.forEach(child => walk(child, funcNode.id, {}));
          } else {
            walk(node.body, funcNode.id, {});
          }
        }
        return funcNode.id;
      }

      // Variable declarations
      case 'VariableDeclaration': {
        node.declarations.forEach(decl => {
          if (decl.init) {
            // Check for new ServiceNow class instantiation
            if (decl.init.type === 'NewExpression' && 
                decl.init.callee?.type === 'Identifier' &&
                SERVICENOW_CLASSES.includes(decl.init.callee.name)) {
              const varNode = {
                id: generateId(),
                type: 'servicenow',
                subtype: decl.init.callee.name,
                label: `new ${decl.init.callee.name}()`,
                varName: decl.id?.name,
                snippet: getSnippet(node.start, node.end),
                loc: node.loc,
                range: [node.start, node.end],
                parentId
              };
              nodes.push(varNode);
              return varNode.id;
            }

            // Check for function assignment
            if (decl.init.type === 'FunctionExpression' || 
                decl.init.type === 'ArrowFunctionExpression') {
              walk(decl.init, parentId, { name: decl.id?.name });
            }
          }
        });
        break;
      }

      // If statements
      case 'IfStatement': {
        const condSnippet = getSnippet(node.test.start, node.test.end, 40);
        const ifNode = {
          id: generateId(),
          type: 'condition',
          label: `if (${condSnippet})`,
          snippet: getSnippet(node.start, node.consequent?.start || node.end),
          loc: node.loc,
          range: [node.start, node.end],
          testRange: [node.test.start, node.test.end],
          parentId
        };
        nodes.push(ifNode);

        // True branch
        if (node.consequent) {
          const trueBranch = {
            id: generateId(),
            type: 'branch',
            label: 'true',
            branchType: 'true',
            parentId: ifNode.id,
            loc: node.consequent.loc,
            range: [node.consequent.start, node.consequent.end]
          };
          nodes.push(trueBranch);
          
          if (node.consequent.type === 'BlockStatement') {
            node.consequent.body.forEach(child => walk(child, trueBranch.id, {}));
          } else {
            walk(node.consequent, trueBranch.id, {});
          }
        }

        // False branch (else)
        if (node.alternate) {
          const falseBranch = {
            id: generateId(),
            type: 'branch',
            label: 'false',
            branchType: 'false',
            parentId: ifNode.id,
            loc: node.alternate.loc,
            range: [node.alternate.start, node.alternate.end]
          };
          nodes.push(falseBranch);

          if (node.alternate.type === 'BlockStatement') {
            node.alternate.body.forEach(child => walk(child, falseBranch.id, {}));
          } else {
            walk(node.alternate, falseBranch.id, {});
          }
        }
        return ifNode.id;
      }

      // Switch statements
      case 'SwitchStatement': {
        const switchSnippet = getSnippet(node.discriminant.start, node.discriminant.end, 30);
        const switchNode = {
          id: generateId(),
          type: 'switch',
          label: `switch (${switchSnippet})`,
          snippet: getSnippet(node.start, node.cases[0]?.start || node.end),
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(switchNode);

        node.cases.forEach(caseNode => {
          const caseLabel = caseNode.test 
            ? `case ${getSnippet(caseNode.test.start, caseNode.test.end, 20)}`
            : 'default';
          const caseFlowNode = {
            id: generateId(),
            type: 'case',
            label: caseLabel,
            parentId: switchNode.id,
            loc: caseNode.loc,
            range: [caseNode.start, caseNode.end]
          };
          nodes.push(caseFlowNode);

          caseNode.consequent.forEach(child => walk(child, caseFlowNode.id, {}));
        });
        return switchNode.id;
      }

      // Loops
      case 'WhileStatement':
      case 'DoWhileStatement': {
        const condSnippet = getSnippet(node.test.start, node.test.end, 40);
        const loopNode = {
          id: generateId(),
          type: 'loop',
          loopType: node.type === 'WhileStatement' ? 'while' : 'do-while',
          label: `while (${condSnippet})`,
          snippet: getSnippet(node.start, node.body?.start || node.end),
          loc: node.loc,
          range: [node.start, node.end],
          testRange: [node.test.start, node.test.end],
          parentId
        };
        nodes.push(loopNode);

        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            node.body.body.forEach(child => walk(child, loopNode.id, {}));
          } else {
            walk(node.body, loopNode.id, {});
          }
        }
        return loopNode.id;
      }

      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement': {
        let label = 'for (...)';
        if (node.type === 'ForInStatement') {
          label = `for (... in ${getSnippet(node.right.start, node.right.end, 20)})`;
        } else if (node.type === 'ForOfStatement') {
          label = `for (... of ${getSnippet(node.right.start, node.right.end, 20)})`;
        }

        const forNode = {
          id: generateId(),
          type: 'loop',
          loopType: 'for',
          label,
          snippet: getSnippet(node.start, node.body?.start || node.end),
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(forNode);

        if (node.body) {
          if (node.body.type === 'BlockStatement') {
            node.body.body.forEach(child => walk(child, forNode.id, {}));
          } else {
            walk(node.body, forNode.id, {});
          }
        }
        return forNode.id;
      }

      // Try-catch blocks
      case 'TryStatement': {
        const tryNode = {
          id: generateId(),
          type: 'try',
          label: 'try',
          snippet: 'try { ... }',
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(tryNode);

        // Try block
        if (node.block?.body) {
          node.block.body.forEach(child => walk(child, tryNode.id, {}));
        }

        // Catch block - use body range for accurate highlighting
        if (node.handler) {
          const handler = node.handler;
          const catchNode = {
            id: generateId(),
            type: 'catch',
            label: `catch (${handler.param?.name || 'e'})`,
            snippet: getSnippet(handler.start, handler.body?.start || handler.end),
            parentId: tryNode.id,
            loc: handler.loc,
            // Use the catch clause start (at 'catch' keyword) to end of body
            range: [handler.start, handler.end]
          };
          nodes.push(catchNode);

          if (node.handler.body?.body) {
            node.handler.body.body.forEach(child => walk(child, catchNode.id, {}));
          }
        }

        // Finally block
        if (node.finalizer) {
          const finallyNode = {
            id: generateId(),
            type: 'finally',
            label: 'finally',
            parentId: tryNode.id,
            loc: node.finalizer.loc,
            range: [node.finalizer.start, node.finalizer.end]
          };
          nodes.push(finallyNode);

          if (node.finalizer.body) {
            node.finalizer.body.forEach(child => walk(child, finallyNode.id, {}));
          }
        }
        return tryNode.id;
      }

      // Return statements
      case 'ReturnStatement': {
        const returnNode = {
          id: generateId(),
          type: 'return',
          label: node.argument 
            ? `return ${getSnippet(node.argument.start, node.argument.end, 30)}`
            : 'return',
          snippet: getSnippet(node.start, node.end),
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(returnNode);
        return returnNode.id;
      }

      // Throw statements
      case 'ThrowStatement': {
        const throwNode = {
          id: generateId(),
          type: 'throw',
          label: `throw ${getSnippet(node.argument.start, node.argument.end, 30)}`,
          snippet: getSnippet(node.start, node.end),
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(throwNode);
        return throwNode.id;
      }

      // Break and Continue
      case 'BreakStatement': {
        const breakNode = {
          id: generateId(),
          type: 'break',
          label: node.label ? `break ${node.label.name}` : 'break',
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(breakNode);
        return breakNode.id;
      }

      case 'ContinueStatement': {
        const continueNode = {
          id: generateId(),
          type: 'continue',
          label: node.label ? `continue ${node.label.name}` : 'continue',
          loc: node.loc,
          range: [node.start, node.end],
          parentId
        };
        nodes.push(continueNode);
        return continueNode.id;
      }

      // Expression statements (function calls, assignments, etc.)
      case 'ExpressionStatement': {
        const expr = node.expression;
        
        // Check for IIFE (Immediately Invoked Function Expression)
        // Pattern: (function() { ... })() or (function name() { ... })(args)
        if (expr.type === 'CallExpression') {
          const callee = expr.callee;
          
          // Handle IIFE - the callee is a FunctionExpression
          if (callee.type === 'FunctionExpression') {
            const name = callee.id?.name || 'executeRule';
            const iifeNode = {
              id: generateId(),
              type: 'function',
              label: `function ${name}()`,
              snippet: getSnippet(node.start, Math.min(node.start + 60, callee.body?.start || node.end)),
              loc: callee.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(iifeNode);
            
            // Process function body
            if (callee.body && callee.body.type === 'BlockStatement') {
              callee.body.body.forEach(child => walk(child, iifeNode.id, {}));
            }
            return iifeNode.id;
          }
          
          // Check for ServiceNow API calls
          const snCall = getServiceNowCallType(expr);
          if (snCall || isSignificantCall(expr)) {
            const callLabel = getCallLabel(expr);
            const callNode = {
              id: generateId(),
              type: snCall ? 'servicenow-call' : 'call',
              subtype: snCall?.category,
              label: callLabel,
              snippet: getSnippet(node.start, node.end),
              loc: node.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(callNode);
            return callNode.id;
          }
        }

        // Check for assignments with ServiceNow calls
        if (expr.type === 'AssignmentExpression') {
          const right = expr.right;
          if (right.type === 'CallExpression' && isSignificantCall(right)) {
            const callLabel = getCallLabel(right);
            const assignNode = {
              id: generateId(),
              type: 'assignment',
              label: `${getSnippet(expr.left.start, expr.left.end, 15)} = ${callLabel}`,
              snippet: getSnippet(node.start, node.end),
              loc: node.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(assignNode);
            return assignNode.id;
          }
        }
        break;
      }

      // Block statements (process children)
      case 'BlockStatement': {
        node.body.forEach(child => walk(child, parentId, {}));
        break;
      }

      // Program (root)
      case 'Program': {
        node.body.forEach(child => walk(child, null, {}));
        break;
      }

      default:
        break;
    }

    return null;
  };

  /**
   * Determines if a call expression is significant enough to show
   */
  const isSignificantCall = (expr) => {
    if (expr.callee?.type === 'MemberExpression') {
      const obj = expr.callee.object;
      const prop = expr.callee.property;
      const propName = prop?.name || prop?.value;
      
      // Check for gs.* calls (GlideSystem)
      if (obj.type === 'Identifier' && obj.name === 'gs') {
        return true;
      }
      
      // Check for GlideRecord methods
      if (propName && GLIDE_RECORD_METHODS[propName]) {
        return true;
      }
      
      // Check for GlideSystem methods on gs object
      if (propName && GLIDE_SYSTEM_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for g_form, g_list, etc. (client-side)
      if (obj.type === 'Identifier' && ['g_form', 'g_list', 'g_service_catalog'].includes(obj.name)) {
        return true;
      }
      
      // Check for Workflow object calls
      if (obj.type === 'Identifier' && obj.name === 'workflow') {
        return true;
      }
      
      // Check for current/previous object access (Business Rules)
      if (obj.type === 'Identifier' && ['current', 'previous'].includes(obj.name)) {
        return true;
      }
    }
    
    // Check for direct ServiceNow class instantiation
    if (expr.type === 'NewExpression' && expr.callee?.type === 'Identifier') {
      if (SERVICENOW_CLASSES.includes(expr.callee.name)) {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Gets a readable label for a call expression
   */
  const getCallLabel = (expr) => {
    if (expr.callee?.type === 'MemberExpression') {
      const obj = expr.callee.object;
      const prop = expr.callee.property;
      const objName = obj.name || (obj.type === 'CallExpression' ? '...' : '?');
      const propName = prop.name || prop.value || '?';
      return `${objName}.${propName}()`;
    }
    if (expr.callee?.type === 'Identifier') {
      return `${expr.callee.name}()`;
    }
    return 'call()';
  };

  // Start walking the AST
  walk(ast);

  return nodes;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  parseCode,
  extractControlFlow
};
