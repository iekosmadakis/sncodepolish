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
 * ServiceNow-specific API classes for visualization highlighting
 * @see https://www.servicenow.com/docs/r/api-reference/api-reference.html
 */
const SERVICENOW_CLASSES = [
  // Core database classes
  'GlideRecord',
  'GlideRecordSecure',
  'GlideAggregate',
  'GlideQuery',
  'GlideQueryCondition',
  
  // Date/time classes
  'GlideDateTime',
  'GlideDate',
  'GlideTime',
  'GlideDuration',
  'GlideSchedule',
  'GlideCalendarDateTime',
  
  // System classes
  'GlideSystem',
  'GlideSysAttachment',
  'GlideSysAttachmentInputStream',
  'GlideLocale',
  'GlideApplicationProperty',
  
  // User/session classes
  'GlideUser',
  'GlideSession',
  'GlideImpersonate',
  
  // Element classes
  'GlideElement',
  'GlideElementDescriptor',
  
  // Client-side classes
  'GlideAjax',
  'GlideForm',
  'GlideList2',
  'GlideModal',
  'GlideDialogWindow',
  'GlideDialogForm',
  
  // Scripting/evaluation classes
  'GlideScopedEvaluator',
  'GlideFilter',
  'GlideScriptedExtensionPoint',
  
  // Plugin/email classes
  'GlidePluginManager',
  'GlideEmailOutbound',
  
  // HTTP/REST/SOAP classes
  'GlideHTTPRequest',
  'GlideHTTPResponse',
  'RESTMessageV2',
  'RESTResponseV2',
  'SOAPMessageV2',
  'SOAPResponseV2',
  
  // Scoped API namespaces
  'sn_ws',
  'sn_fd',
  'sn_cc',
  'sn_sc',
  'sn_hr',
  'sn_cmdb',
  'sn_connect',
  'sn_discovery',
  'sn_impex',
  'sn_km',
  'sn_notification',
  
  // Flow Designer
  'FlowAPI',
  'FlowScriptAPI',
  
  // XML classes
  'XMLDocument2',
  'XMLNode',
  'XMLNodeIterator',
  'GlideXMLUtil',
  
  // Utility classes
  'GlideRecordUtil',
  'GlideStringUtil',
  'TableUtils',
  'ArrayUtil',
  'JSUtil',
  'GlideExcelParser',
  'GlideDigest',
  'GlideEncrypter',
  'GlideSecureRandom',
  'GlideSecureRandomUtil',
  'GlideCertificateEncryption',
  'GlideTableHierarchy',
  'GlideDBFunctionBuilder',
  'GlideJsonPath',
  'GlideScriptableInputStream',
  'GlideMultiRecurrence',
  
  // Import/transform classes
  'GlideImportLog',
  'GlideImportSetRun',
  'GlideImportSetTransformer',
  
  // CMDB/workflow classes
  'CMDBUtil',
  'Workflow',
  'WorkflowScheduler',
  
  // OAuth classes
  'GlideOAuthClient',
  'GlideOAuthClientRequest',
  'GlideOAuthClientResponse',
  'GlideOAuthToken',
  
  // Service Portal/script include classes
  'GlideSPScriptable',
  'AbstractAjaxProcessor',
  
  // Update/deployment classes
  'GlideUpdateManager',
  'GlideUpdateSet',
  'GlideAppLoader',
  
  // Servlet/currency/event classes
  'GlideScriptedProcessor',
  'GlideServletRequest',
  'GlideServletResponse',
  'GlideCurrencyConfig',
  'GlideEventManager',
  
  // Client-side global objects
  'g_form',
  'g_list',
  'g_user',
  'g_scratchpad',
  'g_navigation',
  'g_modal',
  'spUtil',
  'spModal',
  
  // Server-side global objects
  'gs',
  'current',
  'previous',
  'action',
  'email',
  'event',
  'producer',
  'request',
  'response',
  'workflow',
  'activity',
  'context',
  'RP',
  '$sp',
  'data',
  'input',
  'options',
  'g_processor'
];

/**
 * GlideRecord and API methods categorized by operation type
 * Categories: database, loop, filter, read, write, config
 * @see https://www.servicenow.com/docs/r/api-reference/api-reference.html
 */
const GLIDE_RECORD_METHODS = {
  // Database operations
  query: 'database',
  get: 'database',
  insert: 'database',
  update: 'database',
  updateMultiple: 'database',
  deleteRecord: 'database',
  deleteMultiple: 'database',
  initialize: 'database',
  newRecord: 'database',
  
  // Iteration methods
  next: 'loop',
  hasNext: 'loop',
  _next: 'loop',
  _query: 'loop',
  
  // Query building / filters
  addQuery: 'filter',
  addEncodedQuery: 'filter',
  addNullQuery: 'filter',
  addNotNullQuery: 'filter',
  addJoinQuery: 'filter',
  addActiveQuery: 'filter',
  addInactiveQuery: 'filter',
  addOrCondition: 'filter',
  addDomainQuery: 'filter',
  addFunction: 'filter',
  setCategory: 'filter',
  setLimit: 'filter',
  setEncodedQuery: 'filter',
  orderBy: 'filter',
  orderByDesc: 'filter',
  addOrderBy: 'filter',
  chooseWindow: 'filter',
  
  // Read operations
  getValue: 'read',
  getDisplayValue: 'read',
  getElement: 'read',
  getRowCount: 'read',
  getTableName: 'read',
  getRecordClassName: 'read',
  getClassDisplayValue: 'read',
  getEncodedQuery: 'read',
  getUniqueValue: 'read',
  getLink: 'read',
  getLabel: 'read',
  getAttribute: 'read',
  getED: 'read',
  getLastErrorMessage: 'read',
  getBooleanValue: 'read',
  getFields: 'read',
  getElements: 'read',
  getReference: 'read',
  getReferenceTable: 'read',
  getAttachments: 'read',
  
  // Write operations
  setValue: 'write',
  setDisplayValue: 'write',
  applyTemplate: 'write',
  autoSysFields: 'write',
  setNewGuidValue: 'write',
  setLocation: 'write',
  
  // Configuration methods
  setWorkflow: 'config',
  setAbortAction: 'config',
  setForceUpdate: 'config',
  setQueryReferences: 'config',
  operation: 'config',
  
  // Validation/change tracking methods
  isValid: 'read',
  isValidField: 'read',
  isValidRecord: 'read',
  isNewRecord: 'read',
  isActionAborted: 'read',
  canRead: 'read',
  canWrite: 'read',
  canCreate: 'read',
  canDelete: 'read',
  changes: 'read',
  changesTo: 'read',
  changesFrom: 'read',
  nil: 'read',
  
  // GlideAggregate specific
  addAggregate: 'filter',
  groupBy: 'filter',
  getAggregate: 'read',
  addHaving: 'filter',
  addTrend: 'filter',
  getQuery: 'read',
  
  // GlideQuery methods
  select: 'database',
  selectOne: 'database',
  where: 'filter',
  whereNull: 'filter',
  whereNotNull: 'filter',
  orWhere: 'filter',
  limit: 'filter',
  disableWorkflow: 'config',
  forceUpdate: 'config',
  toGlideRecord: 'database',
  aggregate: 'filter',
  avg: 'read',
  count: 'read',
  max: 'read',
  min: 'read',
  sum: 'read',
  having: 'filter',
  parse: 'filter',
  withAcls: 'config',
  getBy: 'database'
};

/**
 * GlideSystem (gs) methods commonly used in ServiceNow scripts
 * @see https://www.servicenow.com/docs/r/api-reference/api-reference.html
 */
const GLIDE_SYSTEM_METHODS = [
  // Logging methods
  'log',
  'info',
  'warn',
  'error',
  'debug',
  'print',
  'logError',
  'logWarning',
  
  // User context methods
  'getUserID',
  'getUserName',
  'getUserDisplayName',
  'getUser',
  'getSession',
  'getSessionID',
  'getSessionToken',
  'hasRole',
  'hasRoleInGroup',
  'hasRoleExactly',
  'isLoggedIn',
  'isInteractive',
  'isMobile',
  'getImpersonatingUserName',
  
  // Date/time methods
  'now',
  'nowDateTime',
  'nowNoTZ',
  'daysAgo',
  'daysAgoStart',
  'daysAgoEnd',
  'hoursAgo',
  'hoursAgoStart',
  'hoursAgoEnd',
  'minutesAgo',
  'minutesAgoStart',
  'minutesAgoEnd',
  'monthsAgo',
  'monthsAgoStart',
  'monthsAgoEnd',
  'quartersAgo',
  'quartersAgoStart',
  'quartersAgoEnd',
  'yearsAgo',
  'yearsAgoStart',
  'yearsAgoEnd',
  'beginningOfLastMonth',
  'beginningOfLastWeek',
  'beginningOfLastYear',
  'beginningOfNextMonth',
  'beginningOfNextWeek',
  'beginningOfNextYear',
  'beginningOfThisMonth',
  'beginningOfThisQuarter',
  'beginningOfThisWeek',
  'beginningOfThisYear',
  'beginningOfToday',
  'endOfLastMonth',
  'endOfLastWeek',
  'endOfLastYear',
  'endOfNextMonth',
  'endOfNextWeek',
  'endOfNextYear',
  'endOfThisMonth',
  'endOfThisQuarter',
  'endOfThisWeek',
  'endOfThisYear',
  'endOfToday',
  'dateGenerate',
  'dateDiff',
  
  // Properties/messages methods
  'getProperty',
  'setProperty',
  'getPreference',
  'setPreference',
  'getEscapedProperty',
  'cacheFlush',
  'getMessage',
  'addInfoMessage',
  'addErrorMessage',
  'flushMessages',
  'getErrorMessages',
  'getInfoMessages',
  
  // Script/utility methods
  'include',
  'loadGlobalScripts',
  'nil',
  'tableExists',
  'generateGUID',
  'urlEncode',
  'urlDecode',
  'xmlToJSON',
  'base64Encode',
  'base64Decode',
  'getDisplayColumn',
  'getDisplayName',
  'getMaxSchemaNameLength',
  'getNewAppScopeCompanyPrefix',
  'getNodeName',
  'getNodeValue',
  'getSysTimeZone',
  'getXMLText',
  'getXMLNodeList',
  'sleep',
  
  // Redirect/scope/event methods
  'setRedirect',
  'setReturn',
  'getCurrentScopeName',
  'getCallerScopeName',
  'setCurrentApplicationId',
  'eventQueue',
  'eventQueueScheduled',
  'workflowFlush',
  
  // Debug/style methods
  'isDebugging',
  'getTimeZoneName',
  'getUrlOnStack',
  'action',
  'getStyle',
  'getDisplayValueFor'
];

/** Client-side g_form methods */
const G_FORM_METHODS = [
  'getValue',
  'setValue',
  'getDisplayValue',
  'clearValue',
  'getIntValue',
  'getBooleanValue',
  'getDecimalValue',
  'getActionName',
  'setVisible',
  'isVisible',
  'setMandatory',
  'isMandatory',
  'setReadOnly',
  'isReadOnly',
  'setDisabled',
  'isDisabled',
  'setDisplay',
  'getReference',
  'addOption',
  'removeOption',
  'clearOptions',
  'getOption',
  'getOptionControl',
  'showFieldMsg',
  'hideFieldMsg',
  'showErrorBox',
  'hideErrorBox',
  'addInfoMessage',
  'addErrorMessage',
  'clearMessages',
  'hideAllFieldMsgs',
  'getLabelOf',
  'setLabelOf',
  'addDecoration',
  'removeDecoration',
  'hideRelatedList',
  'hideRelatedLists',
  'showRelatedList',
  'showRelatedLists',
  'setSectionDisplay',
  'isSectionVisible',
  'activateTab',
  'getTabNameForField',
  'flash',
  'getControl',
  'getElement',
  'getFormElement',
  'getSectionNames',
  'getSections',
  'getTableName',
  'getUniqueValue',
  'hasField',
  'isNewRecord',
  'save',
  'submit',
  'enableAttachments',
  'disableAttachments',
  'hasAttribute',
  'removeAttribute',
  'addAttribute',
  'setScope',
  'refreshSlushbucket',
  'isLiveUpdating',
  'registerHandler',
  'removeCurrentPrefix'
];

/** Client-side g_list methods */
const G_LIST_METHODS = [
  'addFilter',
  'get',
  'getByName',
  'getChecked',
  'getFilter',
  'getFixedQuery',
  'getGroupBy',
  'getListName',
  'getOrderBy',
  'getParentTable',
  'getQuery',
  'getRelated',
  'getRelationshipID',
  'getTableName',
  'getTitle',
  'getView',
  'isUserList',
  'refresh',
  'refreshWithOrderBy',
  'setFilter',
  'setFilterAndRefresh',
  'setFirstRow',
  'setGroupBy',
  'setOrderBy',
  'setRelated',
  'setRows',
  'setRowsPerPage',
  'showHideGroups',
  'showHideList',
  'sort',
  'sortDescending',
  'toggleList',
  'toggleListNoPref'
];

/** Client-side g_user methods */
const G_USER_METHODS = [
  'getClientData',
  'getFullName',
  'getName',
  'getUserID',
  'getUserName',
  'hasRole',
  'hasRoleExactly',
  'hasRoleFromList'
];

/** Service Portal spUtil methods (client-side) */
const SP_UTIL_METHODS = [
  'addErrorMessage',
  'addInfoMessage',
  'addTrivialMessage',
  'createUid',
  'format',
  'get',
  'getPreference',
  'parseAttributes',
  'recordWatch',
  'refresh',
  'scrollTo',
  'setBreadCrumb',
  'setPreference',
  'setSearchPage',
  'update'
];

/** Service Portal $sp server-side methods */
const SP_METHODS = [
  'canReadRecord',
  'canSeePage',
  'getCatalogItem',
  'getDisplayValue',
  'getField',
  'getFields',
  'getFieldsObject',
  'getForm',
  'getKBCategoryArticles',
  'getKBCount',
  'getKBRecord',
  'getKBSiblingCategories',
  'getKBTopCategoryID',
  'getListColumns',
  'getMenuHREF',
  'getMenuItems',
  'getParameter',
  'getPortalRecord',
  'getRecord',
  'getRecordDisplayValues',
  'getRecordElements',
  'getRecordValues',
  'getRelatedList',
  'getSCRecord',
  'getStream',
  'getValues',
  'getWidget',
  'getWidgetFromInstance',
  'getWidgetParameters',
  'getWidgetScope',
  'logStat',
  'mapRecordToUIAction',
  'showCatalogPrices',
  'translateTemplate'
];

/** Workflow API methods */
const WORKFLOW_METHODS = [
  'broadcastEvent',
  'cancel',
  'cancelContext',
  'deleteWorkflow',
  'fireEvent',
  'fireEventById',
  'getContexts',
  'getEstimatedDeliveryTime',
  'getEstimatedDeliveryTimeFromWFVersion',
  'getReturnValue',
  'getRunningFlows',
  'getVersion',
  'getVersionFromName',
  'getWorkflowFromName',
  'hasWorkflow',
  'restartWorkflow',
  'runFlows',
  'startFlow',
  'startFlowFromContextInsert',
  'startFlowRetroactive'
];

/** GlideAjax methods (client-side) */
const GLIDE_AJAX_METHODS = [
  'addParam',
  'getParam',
  'getXML',
  'getXMLAnswer',
  'getXMLWait',
  'getAnswer',
  'setScope',
  'setProcessor',
  'setErrorCallback',
  'getParameter',
  'getResponseValue',
  'newItem'
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
            } else {
              // Generic variable initialization (for Full Ops view)
              const varName = decl.id?.name || '?';
              const fullSnippet = getSnippet(node.start, node.end, 50);
              const varNode = {
                id: generateId(),
                type: 'variable',
                label: `${node.kind} ${varName}`,
                detailedLabel: fullSnippet,
                snippet: fullSnippet,
                loc: node.loc,
                range: [node.start, node.end],
                parentId
              };
              nodes.push(varNode);
            }
          }
        });
        break;
      }

      // If statements
      case 'IfStatement': {
        const condSnippet = getSnippet(node.test.start, node.test.end, 30);
        const ifNode = {
          id: generateId(),
          type: 'condition',
          label: 'if()',
          detailedLabel: `if (${condSnippet})`,
          snippet: `if (${condSnippet})`,
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
        const switchSnippet = getSnippet(node.discriminant.start, node.discriminant.end, 25);
        const switchNode = {
          id: generateId(),
          type: 'switch',
          label: 'switch()',
          detailedLabel: `switch (${switchSnippet})`,
          snippet: `switch (${switchSnippet})`,
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
        const condSnippet = getSnippet(node.test.start, node.test.end, 30);
        const loopType = node.type === 'WhileStatement' ? 'while' : 'do-while';
        const loopNode = {
          id: generateId(),
          type: 'loop',
          loopType,
          label: `${loopType}()`,
          detailedLabel: `while (${condSnippet})`,
          snippet: `while (${condSnippet})`,
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
        let label = 'for()';
        let detailedLabel = getSnippet(node.start, node.body?.start || node.end, 40);
        
        if (node.type === 'ForInStatement') {
          label = 'for-in()';
          detailedLabel = `for (... in ${getSnippet(node.right.start, node.right.end, 25)})`;
        } else if (node.type === 'ForOfStatement') {
          label = 'for-of()';
          detailedLabel = `for (... of ${getSnippet(node.right.start, node.right.end, 25)})`;
        }

        const forNode = {
          id: generateId(),
          type: 'loop',
          loopType: 'for',
          label,
          detailedLabel,
          snippet: detailedLabel,
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
          
          // Check for ServiceNow API calls (high priority)
          const snCall = getServiceNowCallType(expr);
          if (snCall) {
            const callLabel = getCallLabel(expr);
            const fullSnippet = getSnippet(node.start, node.end, 50);
            const callNode = {
              id: generateId(),
              type: 'servicenow-call',
              subtype: snCall?.category,
              label: callLabel,
              detailedLabel: fullSnippet,
              snippet: fullSnippet,
              loc: node.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(callNode);
            return callNode.id;
          }
          
          // Check for other significant calls (gs.*, g_form.*, etc.)
          if (isSignificantCall(expr)) {
            const callLabel = getCallLabel(expr);
            const fullSnippet = getSnippet(node.start, node.end, 50);
            const callNode = {
              id: generateId(),
              type: 'call',
              label: callLabel,
              detailedLabel: fullSnippet,
              snippet: fullSnippet,
              loc: node.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(callNode);
            return callNode.id;
          }
          
          // Generic function call (for Full Ops view)
          const callLabel = getCallLabel(expr);
          const fullSnippet = getSnippet(node.start, node.end, 50);
          const callNode = {
            id: generateId(),
            type: 'call-generic',
            label: callLabel,
            detailedLabel: fullSnippet,
            snippet: fullSnippet,
            loc: node.loc,
            range: [node.start, node.end],
            parentId
          };
          nodes.push(callNode);
          return callNode.id;
        }

        // Check for assignments
        if (expr.type === 'AssignmentExpression') {
          const right = expr.right;
          const leftSnippet = getSnippet(expr.left.start, expr.left.end, 15);
          const fullSnippet = getSnippet(node.start, node.end, 50);
          
          // Assignment with significant call
          if (right.type === 'CallExpression' && isSignificantCall(right)) {
            const callLabel = getCallLabel(right);
            const assignNode = {
              id: generateId(),
              type: 'assignment',
              label: `${leftSnippet} = ${callLabel}`,
              detailedLabel: fullSnippet,
              snippet: fullSnippet,
              loc: node.loc,
              range: [node.start, node.end],
              parentId
            };
            nodes.push(assignNode);
            return assignNode.id;
          }
          
          // Generic assignment (for Full Ops view)
          const assignNode = {
            id: generateId(),
            type: 'assignment-generic',
            label: `${leftSnippet} = ...`,
            detailedLabel: fullSnippet,
            snippet: fullSnippet,
            loc: node.loc,
            range: [node.start, node.end],
            parentId
          };
          nodes.push(assignNode);
          return assignNode.id;
        }

        // Check for update expressions
        if (expr.type === 'UpdateExpression') {
          const varName = expr.argument?.name || getSnippet(expr.argument.start, expr.argument.end, 15);
          const operator = expr.operator; // '++' or '--'
          const label = expr.prefix ? `${operator}${varName}` : `${varName}${operator}`;
          const updateNode = {
            id: generateId(),
            type: 'assignment-generic',
            label: label,
            snippet: getSnippet(node.start, node.end),
            loc: node.loc,
            range: [node.start, node.end],
            parentId
          };
          nodes.push(updateNode);
          return updateNode.id;
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
      const objName = obj.name;
      
      // Check for gs.* calls (GlideSystem)
      if (obj.type === 'Identifier' && objName === 'gs') {
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
      
      // Check for g_form methods (client-side form)
      if (obj.type === 'Identifier' && objName === 'g_form') {
        return true;
      }
      if (propName && G_FORM_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for g_list methods (client-side list)
      if (obj.type === 'Identifier' && objName === 'g_list') {
        return true;
      }
      if (propName && G_LIST_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for g_user methods (client-side user)
      if (obj.type === 'Identifier' && objName === 'g_user') {
        return true;
      }
      if (propName && G_USER_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for spUtil methods (Service Portal client)
      if (obj.type === 'Identifier' && objName === 'spUtil') {
        return true;
      }
      if (propName && SP_UTIL_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for $sp methods (Service Portal server)
      if (obj.type === 'Identifier' && objName === '$sp') {
        return true;
      }
      if (propName && SP_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for GlideAjax methods
      if (propName && GLIDE_AJAX_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for g_service_catalog (catalog client scripts)
      if (obj.type === 'Identifier' && objName === 'g_service_catalog') {
        return true;
      }
      
      // Check for Workflow object calls
      if (obj.type === 'Identifier' && objName === 'workflow') {
        return true;
      }
      if (propName && WORKFLOW_METHODS.includes(propName)) {
        return true;
      }
      
      // Check for current/previous object access (Business Rules)
      if (obj.type === 'Identifier' && ['current', 'previous'].includes(objName)) {
        return true;
      }
      
      // Check for email object (notification scripts)
      if (obj.type === 'Identifier' && objName === 'email') {
        return true;
      }
      
      // Check for event object (event scripts)
      if (obj.type === 'Identifier' && objName === 'event') {
        return true;
      }
      
      // Check for g_scratchpad (client scripts)
      if (obj.type === 'Identifier' && objName === 'g_scratchpad') {
        return true;
      }
      
      // Check for request/response objects (scripted REST/processors)
      if (obj.type === 'Identifier' && ['request', 'response'].includes(objName)) {
        return true;
      }
      
      // Check for sn_ws namespace (RESTMessageV2, SOAPMessageV2)
      if (obj.type === 'Identifier' && objName === 'sn_ws') {
        return true;
      }
      
      // Check for sn_fd namespace (FlowAPI)
      if (obj.type === 'Identifier' && objName === 'sn_fd') {
        return true;
      }
    }
    
    // Check for direct ServiceNow class instantiation
    if (expr.type === 'NewExpression' && expr.callee?.type === 'Identifier') {
      if (SERVICENOW_CLASSES.includes(expr.callee.name)) {
        return true;
      }
    }
    
    // Check for namespaced class instantiation (e.g., new sn_ws.RESTMessageV2())
    if (expr.type === 'NewExpression' && expr.callee?.type === 'MemberExpression') {
      const ns = expr.callee.object?.name;
      const cls = expr.callee.property?.name;
      if (ns && ['sn_ws', 'sn_fd', 'sn_cc', 'sn_sc', 'sn_cmdb', 'sn_hr'].includes(ns)) {
        return true;
      }
      if (cls && SERVICENOW_CLASSES.includes(cls)) {
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
