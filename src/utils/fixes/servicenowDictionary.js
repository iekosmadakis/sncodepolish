/**
 * @fileoverview ServiceNow API Dictionary
 * @description Canonical list of valid ServiceNow API classes and methods.
 * Used for fuzzy matching to detect and correct typos.
 * Organized by class/context for context-aware corrections.
 */

// =============================================================================
// GLIDE RECORD METHODS
// =============================================================================
export const GLIDE_RECORD_METHODS = [
  // Query building
  'addQuery',
  'addEncodedQuery',
  'addActiveQuery',
  'addInactiveQuery',
  'addNullQuery',
  'addNotNullQuery',
  'addOrCondition',
  'addJoinQuery',
  'addDomainQuery',
  'addFunction',
  'setCategory',
  'setLimit',
  'setEncodedQuery',
  'orderBy',
  'orderByDesc',
  'chooseWindow',
  'setQueryReferences',
  
  // Query execution
  'query',
  'get',
  'next',
  'hasNext',
  'getRowCount',
  'getEncodedQuery',
  '_next',
  '_query',
  
  // Field access
  'getValue',
  'setValue',
  'getDisplayValue',
  'setDisplayValue',
  'getElement',
  'getUniqueValue',
  'getBooleanValue',
  'getLink',
  'getRecordClassName',
  'getClassDisplayValue',
  'getTableName',
  'getLabel',
  'getED',
  'getAttribute',
  'isValidField',
  'isValid',
  'isValidRecord',
  'isNewRecord',
  'nil',
  'getFields',
  'getElements',
  
  // Record operations
  'insert',
  'update',
  'deleteRecord',
  'deleteMultiple',
  'updateMultiple',
  'applyTemplate',
  'newRecord',
  'initialize',
  
  // Workflow/System
  'setWorkflow',
  'setAbortAction',
  'isActionAborted',
  'autoSysFields',
  'setForceUpdate',
  'setNewGuidValue',
  'operation',
  'setLocation',
  
  // Security
  'canRead',
  'canWrite',
  'canCreate',
  'canDelete',
  
  // Reference
  'getReference',
  'getReferenceTable',
  
  // Attachments
  'getAttachments',
];

// =============================================================================
// GLIDE AGGREGATE METHODS
// =============================================================================
export const GLIDE_AGGREGATE_METHODS = [
  // Inherited from GlideRecord
  ...GLIDE_RECORD_METHODS.filter(m => !['insert', 'update', 'deleteRecord', 'deleteMultiple', 
    'updateMultiple', 'setWorkflow', 'setAbortAction', 'setForceUpdate', 'canWrite', 
    'canCreate', 'canDelete', 'newRecord', 'applyTemplate'].includes(m)),
  
  // Aggregate-specific
  'addAggregate',
  'getAggregate',
  'groupBy',
  'addHaving',
  'addTrend',
  'getQuery',
];

// =============================================================================
// GLIDE ELEMENT METHODS
// =============================================================================
export const GLIDE_ELEMENT_METHODS = [
  'getValue',
  'setValue',
  'getDisplayValue',
  'setDisplayValue',
  'getED',
  'getReferenceTable',
  'getRefRecord',
  'getJournalEntry',
  'changes',
  'changesFrom',
  'changesTo',
  'nil',
  'toString',
  'dateNumericValue',
  'setDateNumericValue',
  'getChoices',
  'getAttribute',
  'getBooleanAttribute',
  'getHTMLValue',
  'getGlideObject',
  'setInitialValue',
  'getLabel',
  'getTableName',
  'getName',
  'getTextContent',
  'canRead',
  'canWrite',
  'hasRightsTo',
  'setError',
  'setPhoneNumber',
];

// =============================================================================
// GLIDE DATE TIME METHODS
// =============================================================================
export const GLIDE_DATE_TIME_METHODS = [
  // Add time
  'addSeconds',
  'addMinutes',
  'addDays',
  'addDaysLocalTime',
  'addDaysUTC',
  'addMonths',
  'addMonthsLocalTime',
  'addMonthsUTC',
  'addWeeks',
  'addWeeksLocalTime',
  'addWeeksUTC',
  'addYears',
  'addYearsLocalTime',
  'addYearsUTC',
  'add',
  
  // Get components
  'getDate',
  'getTime',
  'getLocalDate',
  'getLocalTime',
  'getDayOfMonth',
  'getDayOfMonthLocalTime',
  'getDayOfMonthUTC',
  'getDayOfWeek',
  'getDayOfWeekLocalTime',
  'getDayOfWeekUTC',
  'getMonth',
  'getMonthLocalTime',
  'getMonthUTC',
  'getYear',
  'getYearLocalTime',
  'getYearUTC',
  'getWeekOfYear',
  'getWeekOfYearLocalTime',
  'getWeekOfYearUTC',
  
  // Value methods
  'getValue',
  'setValue',
  'getDisplayValue',
  'setDisplayValue',
  'getDisplayValueInternal',
  'setDisplayValueInternal',
  'getNumericValue',
  'setNumericValue',
  'getInternalFormattedLocalTime',
  'setGlideDateTime',
  'setValueUTC',
  
  // Comparison
  'compareTo',
  'equals',
  'before',
  'after',
  'onOrBefore',
  'onOrAfter',
  
  // Other
  'subtract',
  'hasDate',
  'getErrorMsg',
  'getTZOffset',
  'toString',
];

// =============================================================================
// GLIDE DATE METHODS
// =============================================================================
export const GLIDE_DATE_METHODS = [
  'getValue',
  'setValue',
  'getDisplayValue',
  'setDisplayValue',
  'getByFormat',
  'getDayOfMonth',
  'getDayOfMonthNoTZ',
  'getDayOfWeek',
  'getDayOfWeekNoTZ',
  'getMonth',
  'getMonthNoTZ',
  'getYear',
  'getYearNoTZ',
  'subtract',
  'onOrAfter',
  'onOrBefore',
];

// =============================================================================
// GLIDE TIME METHODS
// =============================================================================
export const GLIDE_TIME_METHODS = [
  'getValue',
  'setValue',
  'getDisplayValue',
  'setDisplayValue',
  'getByFormat',
  'getHourLocalTime',
  'getHourOfDayLocalTime',
  'getHourOfDayUTC',
  'getHourUTC',
  'getMinutesLocalTime',
  'getMinutesUTC',
  'getSeconds',
  'subtract',
];

// =============================================================================
// GLIDE DURATION METHODS
// =============================================================================
export const GLIDE_DURATION_METHODS = [
  'add',
  'getByFormat',
  'getDayPart',
  'getDurationValue',
  'getNumericValue',
  'getRoundedDayPart',
  'getValue',
  'setDisplayValue',
  'setValue',
  'subtract',
];

// =============================================================================
// GLIDE SCHEDULE METHODS
// =============================================================================
export const GLIDE_SCHEDULE_METHODS = [
  'add',
  'duration',
  'getName',
  'isInSchedule',
  'isValid',
  'load',
  'setTimeZone',
  'whenNext',
];

// =============================================================================
// GLIDE SYSTEM (gs) METHODS
// =============================================================================
export const GLIDE_SYSTEM_METHODS = [
  // Logging
  'log',
  'info',
  'debug',
  'warn',
  'error',
  'print',
  'logError',
  'logWarning',
  
  // Messages
  'addInfoMessage',
  'addErrorMessage',
  'getMessage',
  'flushMessages',
  'getErrorMessages',
  'getInfoMessages',
  
  // Properties
  'getProperty',
  'setProperty',
  'getPreference',
  'setPreference',
  'cacheFlush',
  
  // User
  'getUser',
  'getUserID',
  'getUserName',
  'getUserDisplayName',
  'getImpersonatingUserName',
  'hasRole',
  'hasRoleInGroup',
  'hasRoleExactly',
  
  // Session
  'getSession',
  'getSessionID',
  'getSessionToken',
  'isInteractive',
  'isLoggedIn',
  'isMobile',
  
  // Date/Time utilities
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
  'dateDiff',
  'dateGenerate',
  
  // Utilities
  'nil',
  'tableExists',
  'generateGUID',
  'eventQueue',
  'eventQueueScheduled',
  'workflowFlush',
  'include',
  'sleep',
  'urlEncode',
  'urlDecode',
  'xmlToJSON',
  'base64Encode',
  'base64Decode',
  'getDisplayColumn',
  'getDisplayName',
  'getEscapedProperty',
  'getMaxSchemaNameLength',
  'getNewAppScopeCompanyPrefix',
  'getNodeName',
  'getNodeValue',
  'getSysTimeZone',
  'setRedirect',
  'setReturn',
  'getXMLText',
  'getXMLNodeList',
  
  // Scope
  'getCurrentScopeName',
  'getCallerScopeName',
  
  // Other
  'isDebugging',
  'getTimeZoneName',
  'getUrlOnStack',
  'action',
  'getStyle',
  'loadGlobalScripts',
  'setCurrentApplicationId',
];

// =============================================================================
// GLIDE USER METHODS (gs.getUser() or GlideUser)
// =============================================================================
export const GLIDE_USER_METHODS = [
  'getID',
  'getUserID',
  'getName',
  'getUserName',
  'getDisplayName',
  'getEmail',
  'getFirstName',
  'getLastName',
  'getFullName',
  'getCompanyID',
  'getDepartmentID',
  'getDomainID',
  'getLocation',
  'getManagerID',
  'getPreference',
  'getRecord',
  'getRoles',
  'hasRole',
  'hasRoleExactly',
  'hasRoleInGroup',
  'hasRoleFromList',
  'isMemberOf',
  'savePreference',
];

// =============================================================================
// GLIDE SESSION METHODS
// =============================================================================
export const GLIDE_SESSION_METHODS = [
  'getClientIP',
  'getClientData',
  'getCurrentApplicationId',
  'getCurrentApplicationScope',
  'getCurrentDomainID',
  'getLanguage',
  'getSessionToken',
  'getSessionID',
  'getTimeZoneName',
  'getUrlOnStack',
  'isInteractive',
  'isLoggedIn',
  'isMobile',
  'putClientData',
  'setClientData',
  'getUser',
  'getRoles',
  'isImpersonating',
  'clearClientData',
];

// =============================================================================
// GLIDE AJAX METHODS
// =============================================================================
export const GLIDE_AJAX_METHODS = [
  'addParam',
  'getParam',
  'getXML',
  'getXMLAnswer',
  'getXMLWait',
  'getAnswer',
  'setScope',
  'setProcessor',
  'setErrorCallback',
  'getParameter',  // For Script Include processors
  'getResponseValue',
  'newItem',
];

// =============================================================================
// G_FORM METHODS (Client-side)
// =============================================================================
export const G_FORM_METHODS = [
  // Field values
  'getValue',
  'setValue',
  'getDisplayValue',
  'clearValue',
  'getIntValue',
  'getBooleanValue',
  'getDecimalValue',
  'getActionName',
  
  // Field visibility/state
  'setVisible',
  'isVisible',
  'setMandatory',
  'isMandatory',
  'setReadOnly',
  'isReadOnly',
  'setDisabled',
  'isDisabled',
  'setDisplay',
  
  // Reference fields
  'getReference',
  
  // Choice fields
  'addOption',
  'removeOption',
  'clearOptions',
  'getOption',
  'getOptionControl',
  
  // Messages
  'showFieldMsg',
  'hideFieldMsg',
  'showErrorBox',
  'hideErrorBox',
  'addInfoMessage',
  'addErrorMessage',
  'clearMessages',
  'hideAllFieldMsgs',
  
  // Labels
  'getLabelOf',
  'setLabelOf',
  
  // Decorations
  'addDecoration',
  'removeDecoration',
  
  // Related lists
  'hideRelatedList',
  'hideRelatedLists',
  'showRelatedList',
  'showRelatedLists',
  
  // Sections
  'setSectionDisplay',
  'isSectionVisible',
  'activateTab',
  'getTabNameForField',
  
  // Other
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
  'showRelatedLists',
  'isLiveUpdating',
  'registerHandler',
  'removeCurrentPrefix',
];

// =============================================================================
// G_USER METHODS (Client-side)
// =============================================================================
export const G_USER_METHODS = [
  'getClientData',
  'getFullName',
  'getName',
  'getUserID',
  'getUserName',
  'hasRole',
  'hasRoleExactly',
  'hasRoleFromList',
];

// =============================================================================
// REST/SOAP MESSAGE V2 METHODS
// =============================================================================
export const REST_MESSAGE_V2_METHODS = [
  'execute',
  'executeAsync',
  'getEndpoint',
  'getRequestBody',
  'getRequestHeader',
  'getRequestHeaders',
  'setBasicAuth',
  'setEndpoint',
  'setHttpMethod',
  'setHttpTimeout',
  'setLogLevel',
  'setMIDServer',
  'setMutualAuth',
  'setQueryParameter',
  'setRequestBody',
  'setRequestHeader',
  'setStringParameter',
  'setStringParameterNoEscape',
  'setEccCorrelator',
  'setEccParameter',
  'setAuthenticationProfile',
  'setRequestBodyFromAttachment',
  'setRequestBodyFromStream',
  'saveResponseBodyAsAttachment',
  'saveResponseBodyAsStream',
];

export const REST_RESPONSE_V2_METHODS = [
  'getBody',
  'getErrorCode',
  'getErrorMessage',
  'getHeader',
  'getHeaders',
  'getQueryString',
  'getResponseAttachmentSysid',
  'getStatusCode',
  'haveError',
  'waitForResponse',
  'getAllHeaders',
];

export const SOAP_MESSAGE_V2_METHODS = [
  ...REST_MESSAGE_V2_METHODS,
  'setWSSecurity',
  'setSOAPAction',
];

// =============================================================================
// GLIDE SYS ATTACHMENT METHODS
// =============================================================================
export const GLIDE_SYS_ATTACHMENT_METHODS = [
  'copy',
  'deleteAttachment',
  'getContent',
  'getContentBase64',
  'getContentStream',
  'getContentType',
  'getName',
  'getTableName',
  'getTableSysID',
  'write',
  'writeBase64',
  'writeContentStream',
  'getAttachments',
  'getSize',
];

// =============================================================================
// ARRAY UTIL METHODS
// =============================================================================
export const ARRAY_UTIL_METHODS = [
  'concat',
  'contains',
  'convertArray',
  'diff',
  'ensure',
  'indexOf',
  'intersect',
  'union',
  'unique',
];

// =============================================================================
// XML DOCUMENT 2 METHODS
// =============================================================================
export const XML_DOCUMENT_2_METHODS = [
  'createElement',
  'createElementWithTextValue',
  'getDocument',
  'getDocumentElement',
  'getFirstNode',
  'getNextNode',
  'getNode',
  'getNodeText',
  'parseXML',
  'selectNodes',
  'selectSingleNode',
  'setCurrentElement',
  'toString',
  'getText',
  'getNodes',
  'getElements',
  'getNodeAttribute',
  'isValid',
];

// =============================================================================
// XML NODE METHODS
// =============================================================================
export const XML_NODE_METHODS = [
  'getAttribute',
  'getAttributes',
  'getChildNodeIterator',
  'getFirstChild',
  'getLastChild',
  'getNodeName',
  'getNodeValue',
  'getTextContent',
  'hasAttribute',
  'setAttribute',
  'toString',
  'appendChild',
  'getOwnerDocument',
];

// =============================================================================
// GLIDE EMAIL OUTBOUND METHODS
// =============================================================================
export const GLIDE_EMAIL_OUTBOUND_METHODS = [
  'addAddress',
  'addRecipient',
  'getBody',
  'getSubject',
  'getWatermark',
  'save',
  'setBody',
  'setFrom',
  'setReplyTo',
  'setSubject',
  'send',
  'addAttachment',
];

// =============================================================================
// WORKFLOW (wf_workflow) METHODS
// =============================================================================
export const WORKFLOW_METHODS = [
  'broadcastEvent',
  'cancel',
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
  'startFlowRetroactive',
];

// =============================================================================
// GLIDE SCOPED EVALUATOR METHODS
// =============================================================================
export const GLIDE_SCOPED_EVALUATOR_METHODS = [
  'evaluateScript',
  'getVariable',
  'putVariable',
];

// =============================================================================
// GLIDE FILTER METHODS
// =============================================================================
export const GLIDE_FILTER_METHODS = [
  'checkRecord',
  'get',
];

// =============================================================================
// GLIDE TABLE HIERARCHY METHODS
// =============================================================================
export const GLIDE_TABLE_HIERARCHY_METHODS = [
  'getAllExtensions',
  'getBase',
  'getHierarchy',
  'getName',
  'getRoot',
  'getTableExtensions',
  'getTables',
  'hasExtensions',
  'isBaseClass',
  'isSoloClass',
];

// =============================================================================
// GLIDE PLUGIN MANAGER METHODS
// =============================================================================
export const GLIDE_PLUGIN_MANAGER_METHODS = [
  'isActive',
  'isInstalled',
  'isUpgradeSystemBusy',
];

// =============================================================================
// GLIDE SECURE RANDOM METHODS
// =============================================================================
export const GLIDE_SECURE_RANDOM_METHODS = [
  'getSecureRandomInt',
  'getSecureRandomIntBound',
  'getSecureRandomLong',
  'getSecureRandomString',
];

// =============================================================================
// GLIDE DIGEST METHODS
// =============================================================================
export const GLIDE_DIGEST_METHODS = [
  'getMD5Base64',
  'getMD5Hex',
  'getMD5HexFromBase64',
  'getSHA1Base64',
  'getSHA1Hex',
  'getSHA256Base64',
  'getSHA256Hex',
];

// =============================================================================
// GLIDE ENCRYPTER METHODS
// =============================================================================
export const GLIDE_ENCRYPTER_METHODS = [
  'decrypt',
  'encrypt',
];

// =============================================================================
// TEMPLATE PRINTER METHODS
// =============================================================================
export const TEMPLATE_PRINTER_METHODS = [
  'print',
  'space',
];

// =============================================================================
// SCRIPTED PROCESSOR (g_processor) METHODS
// =============================================================================
export const SCRIPTED_PROCESSOR_METHODS = [
  'redirect',
  'writeOutput',
];

// =============================================================================
// GLIDE DB FUNCTION BUILDER METHODS
// =============================================================================
export const GLIDE_DB_FUNCTION_BUILDER_METHODS = [
  'add',
  'build',
  'concat',
  'constant',
  'coalesce',
  'dayofweek',
  'divide',
  'field',
  'length',
  'lowercase',
  'multiply',
  'position',
  'subtract',
  'substring',
  'uppercase',
];

// =============================================================================
// SERVICE PORTAL ($sp) METHODS
// =============================================================================
export const SP_METHODS = [
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
  'translateTemplate',
];

// =============================================================================
// FLOW DESIGNER (sn_fd.FlowAPI) METHODS
// =============================================================================
export const FLOW_API_METHODS = [
  'cancel',
  'executeAction',
  'executeFlow',
  'executeSubflow',
  'getRunner',
  'hasAction',
  'hasFlow',
  'hasSubflow',
  'startAsync',
];

// =============================================================================
// CLASS NAMES
// =============================================================================
export const CLASS_NAMES = [
  // Core
  'GlideRecord',
  'GlideRecordSecure',
  'GlideAggregate',
  'GlideElement',
  'GlideQueryCondition',
  'GlideElementDescriptor',
  
  // Date/Time
  'GlideDateTime',
  'GlideDate',
  'GlideTime',
  'GlideDuration',
  'GlideSchedule',
  'GlideCalendarDateTime',
  
  // User/Session
  'GlideUser',
  'GlideSession',
  
  // Ajax/HTTP
  'GlideAjax',
  'GlideHTTPRequest',
  'RESTMessageV2',
  'RESTResponseV2',
  'SOAPMessageV2',
  'SOAPResponseV2',
  
  // Attachments
  'GlideSysAttachment',
  
  // XML
  'XMLDocument2',
  'XMLDocument',
  'XMLNode',
  'XMLNodeIterator',
  
  // Email
  'GlideEmailOutbound',
  
  // Utilities
  'ArrayUtil',
  'GlideStringUtil',
  'GlideXMLUtil',
  'GlideFilter',
  'GlideTableHierarchy',
  'GlideScopedEvaluator',
  'JSUtil',
  'TableUtils',
  'J2js',
  
  // Security
  'GlideSecureRandom',
  'GlideDigest',
  'GlideEncrypter',
  'GlideCertificateEncryption',
  
  // Plugin
  'GlidePluginManager',
  
  // DB Functions
  'GlideDBFunctionBuilder',
  
  // Workflow
  'Workflow',
  
  // Flow Designer
  'FlowAPI',
  'sn_fd',
  
  // Other
  'TemplatePrinter',
  'GlideLocale',
  'JSON',
  'AbstractAjaxProcessor',
  'GlideEvaluator',
  'GlideUpdateManager',
  'GlideUpdateSet',
  'GlideImpersonate',
  'GlideAppLoader',
  'GlideChoice',
  'GlideOAuthClient',
  'GlideOAuthClientRequest',
  'GlideOAuthClientResponse',
  'GlideScriptedProcessor',
  'GlideServletRequest',
  'GlideServletResponse',
  'GlideSPScriptable',
  'SNC',
];

// =============================================================================
// GLOBAL OBJECTS
// =============================================================================
export const GLOBAL_OBJECTS = [
  'gs',
  'g_form',
  'g_user',
  'g_list',
  'g_menu',
  'g_scratchpad',
  'g_service_catalog',
  'current',
  'previous',
  'producer',
  'answer',
  'action',
  'newValue',
  'oldValue',
  'isLoading',
  'isTemplate',
  'request',
  'response',
  'g_processor',
  'workflow',
  'activity',
  'context',
  'g_navigation',
  'g_ui_scripts',
  'g_dialog',
  'g_modal',
  'email',
  'event',
  'source',
  'target',
  'sn_ws',
  'sn_fd',
  'sn_auth',
  'sn_cc',
  'sn_cmdb',
  'sn_connect',
  'sn_cs',
  'sn_discovery',
  'sn_impex',
  'sn_interaction',
  'sn_km',
  'sn_ml',
  'sn_nlp',
  'sn_notification',
  'sn_ppm',
  'sn_sc',
  'sn_sm',
  'sn_uc',
  'RP',
  'jelly',
  '$sp',
  'data',
  'input',
  'options',
  'portal',
  'page',
  'instance',
];

// =============================================================================
// CONTEXT TO METHODS MAPPING
// =============================================================================
export const CONTEXT_METHOD_MAP = {
  // Classes
  'GlideRecord': GLIDE_RECORD_METHODS,
  'GlideRecordSecure': GLIDE_RECORD_METHODS,
  'GlideAggregate': GLIDE_AGGREGATE_METHODS,
  'GlideElement': GLIDE_ELEMENT_METHODS,
  'GlideDateTime': GLIDE_DATE_TIME_METHODS,
  'GlideDate': GLIDE_DATE_METHODS,
  'GlideTime': GLIDE_TIME_METHODS,
  'GlideDuration': GLIDE_DURATION_METHODS,
  'GlideSchedule': GLIDE_SCHEDULE_METHODS,
  'GlideUser': GLIDE_USER_METHODS,
  'GlideSession': GLIDE_SESSION_METHODS,
  'GlideAjax': GLIDE_AJAX_METHODS,
  'GlideSysAttachment': GLIDE_SYS_ATTACHMENT_METHODS,
  'ArrayUtil': ARRAY_UTIL_METHODS,
  'XMLDocument2': XML_DOCUMENT_2_METHODS,
  'XMLDocument': XML_DOCUMENT_2_METHODS,
  'XMLNode': XML_NODE_METHODS,
  'GlideEmailOutbound': GLIDE_EMAIL_OUTBOUND_METHODS,
  'RESTMessageV2': REST_MESSAGE_V2_METHODS,
  'RESTResponseV2': REST_RESPONSE_V2_METHODS,
  'SOAPMessageV2': SOAP_MESSAGE_V2_METHODS,
  'Workflow': WORKFLOW_METHODS,
  'GlideScopedEvaluator': GLIDE_SCOPED_EVALUATOR_METHODS,
  'GlideFilter': GLIDE_FILTER_METHODS,
  'GlideTableHierarchy': GLIDE_TABLE_HIERARCHY_METHODS,
  'GlidePluginManager': GLIDE_PLUGIN_MANAGER_METHODS,
  'GlideSecureRandom': GLIDE_SECURE_RANDOM_METHODS,
  'GlideDigest': GLIDE_DIGEST_METHODS,
  'GlideEncrypter': GLIDE_ENCRYPTER_METHODS,
  'TemplatePrinter': TEMPLATE_PRINTER_METHODS,
  'AbstractAjaxProcessor': GLIDE_AJAX_METHODS,
  'GlideDBFunctionBuilder': GLIDE_DB_FUNCTION_BUILDER_METHODS,
  '$sp': SP_METHODS,
  'FlowAPI': FLOW_API_METHODS,
  
  // Global objects
  'gs': GLIDE_SYSTEM_METHODS,
  'g_form': G_FORM_METHODS,
  'g_user': G_USER_METHODS,
  'g_processor': SCRIPTED_PROCESSOR_METHODS,
  'current': GLIDE_RECORD_METHODS,
  'previous': GLIDE_RECORD_METHODS,
  'email': GLIDE_EMAIL_OUTBOUND_METHODS,
};

// =============================================================================
// ALL METHODS (flattened for fallback fuzzy matching)
// =============================================================================
export const ALL_METHODS = [...new Set([
  ...GLIDE_RECORD_METHODS,
  ...GLIDE_AGGREGATE_METHODS,
  ...GLIDE_ELEMENT_METHODS,
  ...GLIDE_DATE_TIME_METHODS,
  ...GLIDE_DATE_METHODS,
  ...GLIDE_TIME_METHODS,
  ...GLIDE_DURATION_METHODS,
  ...GLIDE_SCHEDULE_METHODS,
  ...GLIDE_SYSTEM_METHODS,
  ...GLIDE_USER_METHODS,
  ...GLIDE_SESSION_METHODS,
  ...GLIDE_AJAX_METHODS,
  ...G_FORM_METHODS,
  ...G_USER_METHODS,
  ...REST_MESSAGE_V2_METHODS,
  ...REST_RESPONSE_V2_METHODS,
  ...GLIDE_SYS_ATTACHMENT_METHODS,
  ...ARRAY_UTIL_METHODS,
  ...XML_DOCUMENT_2_METHODS,
  ...XML_NODE_METHODS,
  ...GLIDE_EMAIL_OUTBOUND_METHODS,
  ...WORKFLOW_METHODS,
  ...GLIDE_SCOPED_EVALUATOR_METHODS,
  ...GLIDE_FILTER_METHODS,
  ...GLIDE_TABLE_HIERARCHY_METHODS,
  ...GLIDE_PLUGIN_MANAGER_METHODS,
  ...GLIDE_SECURE_RANDOM_METHODS,
  ...GLIDE_DIGEST_METHODS,
  ...GLIDE_ENCRYPTER_METHODS,
  ...TEMPLATE_PRINTER_METHODS,
  ...SCRIPTED_PROCESSOR_METHODS,
  ...GLIDE_DB_FUNCTION_BUILDER_METHODS,
  ...SP_METHODS,
  ...FLOW_API_METHODS,
])];

export default {
  CLASS_NAMES,
  GLOBAL_OBJECTS,
  CONTEXT_METHOD_MAP,
  ALL_METHODS,
};
