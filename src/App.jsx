/**
 * @fileoverview GlideAware Studio - Main Application Component
 * @description React-based code formatter and analyzer for ServiceNow JavaScript and JSON.
 * Features dual-mode support (Polish/Compare), Monaco editor integration, and offline processing.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { polishCode, polishJson, formatCodeStructure } from './utils/codePolish';
import { parseCode, extractControlFlow } from './utils/astParser';
import { generateFlowDiagram, getFlowStats } from './utils/flowGenerator';
import FlowNode from './components/FlowNode';
import Icon from './components/Icon';
import TaskBoard from './components/Plan/TaskBoard';
import NoteEditor from './components/Plan/NoteEditor';
import DrawingCanvas from './components/Plan/DrawingCanvas';
import {
  exportAllData,
  importData,
  generateExportFilename,
  downloadAsJson
} from './utils/storage/planStorage';
import { diff } from 'jsondiffpatch';
import * as htmlFormatter from 'jsondiffpatch/formatters/html';
import 'jsondiffpatch/formatters/styles/html.css';

// =============================================================================
// SAMPLE CODE
// =============================================================================
const SAMPLE_JS_CODE = `// Business Rule: Auto-assign incidents
// TODO: Add error handling
(function executeRule(current, previous) {
    var gr = new GlideReocrd('incident');    
    gr.addQeury('state', 1);
    gr.addQuery('assigned_to', '');
    gr.query();;
    
    
    
    while(gr.next()) {
        if(current.active == true) {
            try {
                if(current.priority <= 2) {
                    var user = gr.getValeu('assigned_to');
                    gr.setValeu('assigned_to', gs.getUserID());
                    gr.udpate();;
                }
            } catch(e) {}
        }
    }
    ;
    
    gs.infoo('Auto-assignment complete');;    
})(current, previous);`;

// Sample JSON for demonstration
const SAMPLE_JSON_CODE = `{
    // This is a comment that will be removed
    'name': 'ServiceNow Config',
    "version": "1.0.0",
    settings: {
        "debug": true,
        "timeout": 30000,
        "endpoints": [
            "https://instance.service-now.com/api/now/table/incident",
            "https://instance.service-now.com/api/now/table/problem",
        ],
    },
    /* Multi-line comment
       to be removed */
    "metadata": {
        "created": "2024-01-15",
        "author": null,
        "tags": ["production", "api",]
    }
}`;

// Sample JSONs for diff demonstration
const SAMPLE_DIFF_LEFT = `{
  "name": "ServiceNow Integration",
  "version": "1.0.0",
  "config": {
    "instance": "dev12345",
    "timeout": 30000,
    "debug": false
  },
  "endpoints": [
    "/api/now/table/incident",
    "/api/now/table/problem"
  ],
  "deprecated": true
}`;

const SAMPLE_DIFF_RIGHT = `{
  "name": "ServiceNow Integration",
  "version": "2.0.0",
  "config": {
    "instance": "prod67890",
    "timeout": 60000,
    "debug": true,
    "retries": 3
  },
  "endpoints": [
    "/api/now/table/incident",
    "/api/now/table/change_request"
  ]
}`;

// Sample JavaScript code for Compare mode - Original version
const SAMPLE_JS_DIFF_LEFT = `// Business Rule: Auto-assign incidents
(function executeRule(current, previous) {
    var gr = new GlideRecord('incident');
    gr.addQuery('state', 1);
    gr.addQuery('assigned_to', '');
    gr.query();
    
    while (gr.next()) {
        if (current.active == true) {
            var user = gr.getValue('assigned_to');
            gr.setValue('assigned_to', gs.getUserID());
            gr.update();
        }
    }
    
    gs.info('Auto-assignment complete');
})(current, previous);`;

// Sample JavaScript code for Visualization (valid, clean code)
const SAMPLE_VISUALIZE_CODE = `// Business Rule: Auto-assign high priority incidents
(function executeRule(current, previous) {
    var gr = new GlideRecord('incident');
    gr.addQuery('state', 1);
    gr.addQuery('priority', '<=', 2);
    gr.addQuery('assigned_to', '');
    gr.setLimit(100);
    gr.query();
    
    var count = 0;
    while (gr.next()) {
        if (current.active === true) {
            try {
                gr.setValue('assigned_to', gs.getUserID());
                gr.setWorkflow(false);
                gr.update();
                count++;
            } catch (e) {
                gs.error('Failed to assign: ' + e.message);
            }
        }
    }
    
    gs.info('Auto-assignment complete. Assigned: ' + count);
})(current, previous);`;

// Sample JavaScript code for Compare mode - Modified version
const SAMPLE_JS_DIFF_RIGHT = `// Business Rule: Auto-assign high priority incidents
// Added: Priority filter and error handling
(function executeRule(current, previous) {
    var gr = new GlideRecord('incident');
    gr.addQuery('state', 1);
    gr.addQuery('priority', '<=', 2);
    gr.addQuery('assigned_to', '');
    gr.setLimit(100);
    gr.query();
    
    var count = 0;
    while (gr.next()) {
        if (current.active === true) {
            try {
                gr.setValue('assigned_to', gs.getUserID());
                gr.setWorkflow(false);
                gr.update();
                count++;
            } catch (e) {
                gs.error('Failed to assign: ' + e.message);
            }
        }
    }
    
    gs.info('Auto-assignment complete. Assigned: ' + count);
})(current, previous);`;

// =============================================================================
// MONACO EDITOR THEME
// =============================================================================

const customTheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'FF79C6' },
    { token: 'string', foreground: 'F1FA8C' },
    { token: 'number', foreground: 'BD93F9' },
    { token: 'operator', foreground: 'FF79C6' },
    { token: 'function', foreground: '50FA7B' },
    { token: 'variable', foreground: 'F8F8F2' },
    { token: 'type', foreground: '8BE9FD', fontStyle: 'italic' },
  ],
  colors: {
    'editor.background': '#12121c',
    'editor.foreground': '#F8F8F2',
    'editor.lineHighlightBackground': '#1a1a2e',
    'editor.selectionBackground': '#3d3d5c88',
    'editor.inactiveSelectionBackground': '#2a2a4288',
    'editorCursor.foreground': '#00d4aa',
    'editorLineNumber.foreground': '#606078',
    'editorLineNumber.activeForeground': '#9898b0',
    'editor.selectionHighlightBackground': '#3d3d5c44',
    'editorIndentGuide.background': '#2a2a42',
    'editorIndentGuide.activeBackground': '#3d3d5c',
    'editorBracketMatch.background': '#3d3d5c44',
    'editorBracketMatch.border': '#00d4aa',
    'scrollbarSlider.background': '#2a2a4288',
    'scrollbarSlider.hoverBackground': '#3d3d5c88',
    'scrollbarSlider.activeBackground': '#3d3d5ccc',
  }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Computes line-by-line diff between original and formatted code.
 * Used for highlighting changed lines in the output editor.
 */
function computeLineDiff(original, formatted) {
  const originalLines = original.split('\n');
  const formattedLines = formatted.split('\n');
  const changes = [];
  
  formattedLines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    const originalLine = originalLines[index];
    
    if (originalLine === undefined) {
      changes.push({ line: index + 1, type: 'added' });
    } else if (originalLine !== line) {
      changes.push({ line: index + 1, type: 'modified' });
    }
  });
  
  return changes;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function App() {
  // Top-level app mode: 'plan' or 'development'
  const [appMode, setAppMode] = useState('plan');
  
  // Plan mode state
  const [planSubMode, setPlanSubMode] = useState('tasks'); // 'tasks' or 'notes'
  const [notesSubMode, setNotesSubMode] = useState('docs'); // 'docs' or 'sketch'
  const fileInputRef = useRef(null);
  const taskBoardRef = useRef(null);
  const noteEditorRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  
  // Development mode state
  const [mode, setMode] = useState('javascript');
  const [jsonSubMode, setJsonSubMode] = useState('format');
  const [jsSubMode, setJsSubMode] = useState('format'); // 'format', 'diff', or 'visualize'
  const [inputCode, setInputCode] = useState('');
  
  // Visualization state
  const [visualizeCode, setVisualizeCode] = useState('');
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const [flowStats, setFlowStats] = useState(null);
  const [visualizeError, setVisualizeError] = useState(null);
  const [selectedFlowNode, setSelectedFlowNode] = useState(null);
  const visualizeEditorRef = useRef(null);
  const [visualizeViewMode, setVisualizeViewMode] = useState('fullops'); // 'logic' or 'fullops'
  const [showVisualizeSettings, setShowVisualizeSettings] = useState(false);
  const visualizeSettingsRef = useRef(null);
  const [showModeInfo, setShowModeInfo] = useState(false);
  const modeInfoRef = useRef(null);
  const [outputCode, setOutputCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: 'ready', message: 'Ready to polish' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [fixes, setFixes] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [errors, setErrors] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [changedLines, setChangedLines] = useState([]);
  const [showFixesDropdown, setShowFixesDropdown] = useState(false);
  const fixesDropdownRef = useRef(null);
  const outputEditorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const primaryActionRef = useRef(null);

  // JSON Compare state
  const [diffLeftJson, setDiffLeftJson] = useState('');
  const [diffRightJson, setDiffRightJson] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [diffStats, setDiffStats] = useState(null);

  // JavaScript Compare state
  const [diffLeftJs, setDiffLeftJs] = useState('');
  const [diffRightJs, setDiffRightJs] = useState('');
  const [diffHighlightEnabled, setDiffHighlightEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const settingsDropdownRef = useRef(null);

  // Toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  }, []);

  // -------------------------------------------------------------------------
  // Plan Mode Handlers
  // -------------------------------------------------------------------------

  /**
   * Exports all Plan mode data as JSON file
   */
  const handleExportPlanData = useCallback(async () => {
    try {
      const data = await exportAllData();
      const filename = generateExportFilename();
      downloadAsJson(data, filename);
      showToast('Plan data exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  }, [showToast]);

  /**
   * Imports Plan mode data from JSON file
   */
  const handleImportPlanData = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const summary = await importData(data, true);
      showToast(
        `Imported: ${summary.tasks} tasks, ${summary.notes} notes, ${summary.drawings} sketches`,
        'success'
      );
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Reload page to refresh all components with imported data
      setTimeout(() => window.location.reload(), 500);
      // Force re-render by toggling sub-mode
      const currentSubMode = planSubMode;
      setPlanSubMode('');
      setTimeout(() => setPlanSubMode(currentSubMode), 0);
    } catch (error) {
      showToast('Failed to import data: Invalid file format', 'error');
    }
  }, [showToast, planSubMode]);

  // Compare two JSON objects
  const handleCompareJson = useCallback(() => {
    if (!diffLeftJson.trim() || !diffRightJson.trim()) {
      showToast('Please provide both JSON objects to compare', 'error');
      return;
    }

    try {
      const leftObj = JSON.parse(diffLeftJson);
      const rightObj = JSON.parse(diffRightJson);
      
      const delta = diff(leftObj, rightObj);
      
      if (!delta) {
        setDiffResult(null);
        setDiffStats({ identical: true });
        setStatus({ type: 'ready', message: 'JSONs are identical' });
        showToast('The two JSON objects are identical!', 'success');
        return;
      }

      // Count changes
      let additions = 0;
      let deletions = 0;
      let modifications = 0;
      
      const countChanges = (d, path = '') => {
        if (!d || typeof d !== 'object') return;
        
        for (const key of Object.keys(d)) {
          const value = d[key];
          if (Array.isArray(value)) {
            if (value.length === 1) additions++;
            else if (value.length === 2) modifications++;
            else if (value.length === 3 && value[2] === 0) deletions++;
          } else if (typeof value === 'object') {
            countChanges(value, `${path}.${key}`);
          }
        }
      };
      
      countChanges(delta);
      
      setDiffResult(delta);
      setDiffStats({ 
        identical: false, 
        additions, 
        deletions, 
        modifications,
        total: additions + deletions + modifications
      });
      setStatus({ type: 'ready', message: `Found ${additions + deletions + modifications} differences` });
      showToast(`Comparison complete: ${additions + deletions + modifications} differences found`, 'success');
    } catch (error) {
      showToast(`Invalid JSON: ${error.message}`, 'error');
      setStatus({ type: 'error', message: 'Invalid JSON' });
    }
  }, [diffLeftJson, diffRightJson, showToast]);

  // Load sample diff JSONs
  const handleLoadDiffSample = useCallback(() => {
    setDiffLeftJson(SAMPLE_DIFF_LEFT);
    setDiffRightJson(SAMPLE_DIFF_RIGHT);
    setDiffResult(null);
    setDiffStats(null);
    showToast('Sample JSONs loaded', 'success');
  }, [showToast]);

  // Clear diff
  const handleClearDiff = useCallback(() => {
    setDiffLeftJson('');
    setDiffRightJson('');
    setDiffResult(null);
    setDiffStats(null);
    setStatus({ type: 'ready', message: 'Ready to compare' });
  }, []);

  // Swap left and right JSON
  const handleSwapJson = useCallback(() => {
    const temp = diffLeftJson;
    setDiffLeftJson(diffRightJson);
    setDiffRightJson(temp);
    setDiffResult(null);
    setDiffStats(null);
    showToast('JSONs swapped', 'success');
  }, [diffLeftJson, diffRightJson, showToast]);

  // Polish the right side code in diff mode
  const handlePolishDiffRight = useCallback(async () => {
    if (!diffRightJs.trim()) {
      showToast('Please provide code to polish', 'error');
      return;
    }

    const originalCode = diffRightJs;
    setIsProcessing(true);
    setStatus({ type: 'processing', message: 'Polishing...' });

    try {
      const result = await polishCode(diffRightJs);

      if (result.success) {
        setDiffRightJs(result.output);
        setFixes(result.fixes);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setMetrics(result.metrics);
        
        // Compute changed lines for the badge
        const changes = computeLineDiff(originalCode, result.output);
        setChangedLines(changes);
        
        setStatus({ type: 'ready', message: `Polished with ${result.fixes.length} fixes` });
        
        if (result.fixes.length > 0) {
          showToast(`Code polished! ${result.fixes.length} fixes applied`, 'success');
        } else {
          showToast('Code formatted successfully!', 'success');
        }
      } else {
        setFixes(result.fixes || []);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setChangedLines([]);
        setMetrics(null);
        setStatus({ type: 'error', message: 'Errors found' });
        showToast(result.error, 'error');
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to polish' });
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [diffRightJs, showToast]);

  // Load sample JS diff code
  const handleLoadJsDiffSample = useCallback(() => {
    setDiffLeftJs(SAMPLE_JS_DIFF_LEFT);
    setDiffRightJs(SAMPLE_JS_DIFF_RIGHT);
    showToast('Sample code loaded', 'success');
  }, [showToast]);

  // Clear JS diff
  const handleClearJsDiff = useCallback(() => {
    setDiffLeftJs('');
    setDiffRightJs('');
    setFixes([]);
    setWarnings([]);
    setErrors([]);
    setMetrics(null);
    setChangedLines([]);
    setStatus({ type: 'ready', message: 'Ready' });
  }, []);

  // Swap left and right JS
  const handleSwapJs = useCallback(() => {
    const temp = diffLeftJs;
    setDiffLeftJs(diffRightJs);
    setDiffRightJs(temp);
    showToast('Code swapped', 'success');
  }, [diffLeftJs, diffRightJs, showToast]);

  // Custom node types for React Flow
  const nodeTypes = useMemo(() => ({
    custom: FlowNode
  }), []);

  /**
   * Filters flow nodes based on view mode
   * Logic View: control flow, database interactions, high-impact behavior
   * Full Ops View: everything including variable init, logging, function calls
   */
  const filterFlowNodes = useCallback((nodes, viewMode) => {
    if (viewMode === 'fullops') {
      // Full Ops View shows everything
      return nodes;
    }
    
    // Logic View: filter to show only high-impact nodes
    const logicViewTypes = [
      'function',
      'condition',
      'loop',
      'switch',
      'case',
      'try',
      'catch',
      'finally',
      'return',
      'throw',
      'break',
      'continue',
      'servicenow',
      'servicenow-call',
      'branch'
    ];
    
    // Build set of kept node IDs for parent reference fixing
    const filteredNodes = nodes.filter(node => logicViewTypes.includes(node.type));
    const keptIds = new Set(filteredNodes.map(n => n.id));
    
    // Update parentId references to point to nearest kept ancestor
    return filteredNodes.map(node => {
      if (node.parentId && !keptIds.has(node.parentId)) {
        // Find the nearest ancestor that was kept
        let currentParent = nodes.find(n => n.id === node.parentId);
        while (currentParent && !keptIds.has(currentParent.id)) {
          currentParent = nodes.find(n => n.id === currentParent.parentId);
        }
        return { ...node, parentId: currentParent?.id || null };
      }
      return node;
    });
  }, []);

  // Generate flow diagram from code
  const handleGenerateFlow = useCallback(async () => {
    if (!visualizeCode.trim()) {
      showToast('Please paste some code first', 'error');
      return;
    }

    setVisualizeError(null);
    setSelectedFlowNode(null);

    // Step 1: Light formatting (structural cleanup only, no code changes)
    const formatResult = await formatCodeStructure(visualizeCode);
    
    if (!formatResult.success) {
      setVisualizeError(`Format error: ${formatResult.error}`);
      setFlowNodes([]);
      setFlowEdges([]);
      setFlowStats(null);
      showToast('Code has syntax errors', 'error');
      return;
    }

    const formattedCode = formatResult.output;
    
    // Update the editor with formatted code
    setVisualizeCode(formattedCode);

    // Step 2: Parse the formatted code
    const { ast, error } = parseCode(formattedCode);
    
    if (error) {
      setVisualizeError(`Parse error: ${error}`);
      setFlowNodes([]);
      setFlowEdges([]);
      setFlowStats(null);
      showToast('Failed to parse code', 'error');
      return;
    }

    // Step 3: Extract control flow
    const controlFlowNodes = extractControlFlow(ast, formattedCode);
    
    if (controlFlowNodes.length === 0) {
      setVisualizeError('No control flow structures found in the code');
      setFlowNodes([]);
      setFlowEdges([]);
      setFlowStats(null);
      showToast('No flow structures found', 'error');
      return;
    }

    // Step 4: Filter nodes based on view mode
    const filteredNodes = filterFlowNodes(controlFlowNodes, visualizeViewMode);

    if (filteredNodes.length === 0) {
      setVisualizeError('No nodes to display in current view mode');
      setFlowNodes([]);
      setFlowEdges([]);
      setFlowStats(null);
      showToast('No nodes in current view', 'error');
      return;
    }

    // Step 5: Generate React Flow diagram with view mode for label selection
    const { nodes, edges } = generateFlowDiagram(filteredNodes, visualizeViewMode);
    
    setFlowNodes(nodes);
    setFlowEdges(edges);
    setFlowStats(getFlowStats(filteredNodes));
    showToast(`Flow diagram generated with ${nodes.length} nodes`, 'success');
  }, [visualizeCode, visualizeViewMode, filterFlowNodes, showToast, setFlowNodes, setFlowEdges, setVisualizeCode]);

  // Handle node click in flow diagram (click-to-code)
  const handleFlowNodeClick = useCallback((event, node) => {
    setSelectedFlowNode(node);
    
    // Highlight the corresponding code in the editor
    // Use loc (line/column) from AST for accurate positioning
    if (visualizeEditorRef.current && monacoRef.current && node.data.loc) {
      const editor = visualizeEditorRef.current;
      const monaco = monacoRef.current;
      const { start, end } = node.data.loc;
      
      const model = editor.getModel();
      if (model) {
        // Use line numbers directly from AST loc property
        // Acorn uses 1-based line numbers, which matches Monaco
        const startLine = start.line;
        const endLine = end.line;
        
        // Create selection range for exact text
        const selectionRange = new monaco.Range(
          startLine,
          start.column + 1, // Acorn uses 0-based columns, Monaco uses 1-based
          endLine,
          end.column + 1
        );
        
        // Create whole-line range for highlighting
        const highlightRange = new monaco.Range(
          startLine,
          1,
          endLine,
          model.getLineMaxColumn(endLine)
        );
        
        // Set selection and reveal
        editor.setSelection(selectionRange);
        editor.revealRangeInCenter(highlightRange);
        
        // Add temporary highlight decoration (whole lines)
        const decorations = editor.deltaDecorations([], [{
          range: highlightRange,
          options: {
            className: 'flow-highlight',
            isWholeLine: true,
            overviewRuler: {
              color: '#00d4aa',
              position: monaco.editor.OverviewRulerLane.Full
            }
          }
        }]);
        
        // Remove decoration after 2 seconds
        setTimeout(() => {
          editor.deltaDecorations(decorations, []);
        }, 2000);
      }
    }
  }, []);

  // Load sample for visualization
  const handleLoadVisualizeSample = useCallback(() => {
    setVisualizeCode(SAMPLE_VISUALIZE_CODE);
    setFlowNodes([]);
    setFlowEdges([]);
    setFlowStats(null);
    setVisualizeError(null);
    setSelectedFlowNode(null);
    showToast('Sample code loaded', 'success');
  }, [showToast, setFlowNodes, setFlowEdges]);

  // Clear visualization
  const handleClearVisualize = useCallback(() => {
    setVisualizeCode('');
    setFlowNodes([]);
    setFlowEdges([]);
    setFlowStats(null);
    setVisualizeError(null);
    setSelectedFlowNode(null);
  }, [setFlowNodes, setFlowEdges]);

  // Re-generate flow when view mode changes (if there's code)
  useEffect(() => {
    if (visualizeCode.trim() && flowNodes.length > 0) {
      handleGenerateFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualizeViewMode]);

  // Download both JS diff files
  const handleDownloadJsDiff = useCallback(() => {
    if (!diffLeftJs.trim() && !diffRightJs.trim()) {
      showToast('No code to download', 'error');
      return;
    }
    
    // Generate timestamp: YYYYMMDD_HHMMSS
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    
    const downloadFile = (content, filename) => {
      const blob = new Blob([content], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    
    let filesDownloaded = 0;
    
    if (diffLeftJs.trim()) {
      downloadFile(diffLeftJs, `original_${timestamp}.js`);
      filesDownloaded++;
    }
    
    if (diffRightJs.trim()) {
      // Small delay to avoid browser blocking multiple downloads
      setTimeout(() => {
        downloadFile(diffRightJs, `revised_${timestamp}.js`);
      }, 100);
      filesDownloaded++;
    }
    
    showToast(`Downloaded ${filesDownloaded} file${filesDownloaded > 1 ? 's' : ''}`, 'success');
  }, [diffLeftJs, diffRightJs, showToast]);

  // Render diff result as formatted output
  const renderDiffHtml = useCallback(() => {
    if (!diffResult) return null;
    
    try {
      const leftObj = JSON.parse(diffLeftJson);
      const html = htmlFormatter.format(diffResult, leftObj);
      return html;
    } catch {
      return null;
    }
  }, [diffResult, diffLeftJson]);

  // Apply highlighting decorations to output editor
  const applyHighlighting = useCallback((editor, monaco, changes) => {
    if (!editor || !monaco) return;

    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    
    // If highlighting is disabled or no changes, just clear and return
    if (!diffHighlightEnabled || !changes.length) return;

    // Create new decorations for changed lines
    const decorations = changes.map(change => ({
      range: new monaco.Range(change.line, 1, change.line, 1),
      options: {
        isWholeLine: true,
        className: change.type === 'added' ? 'line-added' : 'line-modified',
        glyphMarginClassName: change.type === 'added' ? 'glyph-added' : 'glyph-modified',
        overviewRuler: {
          color: change.type === 'added' ? '#22c55e' : '#00d4aa',
          position: monaco.editor.OverviewRulerLane.Full
        }
      }
    }));

    decorationsRef.current = editor.deltaDecorations([], decorations);
  }, [diffHighlightEnabled]);

  // Polish the code
  const handlePolish = useCallback(async () => {
    if (!inputCode.trim()) {
      showToast(`Please paste some ${mode === 'json' ? 'JSON' : 'code'} first`, 'error');
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'processing', message: mode === 'json' ? 'Formatting...' : 'Polishing...' });

    try {
      // Use appropriate polisher based on mode
      const result = mode === 'json' 
        ? await polishJson(inputCode)
        : await polishCode(inputCode);

      if (result.success) {
        setOutputCode(result.output);
        setFixes(result.fixes);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setMetrics(result.metrics);
        
        // Compute diff for highlighting
        const changes = computeLineDiff(inputCode, result.output);
        setChangedLines(changes);
        
        setStatus({ type: 'ready', message: mode === 'json' ? `Formatted with ${result.fixes.length} fixes` : `Polished with ${result.fixes.length} fixes` });
        
        if (result.fixes.length > 0) {
          showToast(`${mode === 'json' ? 'JSON formatted' : 'Code polished'}! ${result.fixes.length} fixes applied`, 'success');
        } else {
          showToast(`${mode === 'json' ? 'JSON' : 'Code'} formatted successfully!`, 'success');
        }
      } else {
        setOutputCode(result.output || inputCode);
        setFixes(result.fixes);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setChangedLines([]);
        setStatus({ type: 'error', message: 'Errors found' });
        showToast(result.error, 'error');
      }
    } catch (error) {
      setStatus({ type: 'error', message: mode === 'json' ? 'Failed to format' : 'Failed to polish' });
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [inputCode, mode, showToast]);

  // Load sample code
  const handleLoadSample = useCallback(() => {
    const sampleCode = mode === 'json' ? SAMPLE_JSON_CODE : SAMPLE_JS_CODE;
    setInputCode(sampleCode);
    setOutputCode('');
    setFixes([]);
    setWarnings([]);
    setErrors([]);
    setMetrics(null);
    setChangedLines([]);
    showToast(`Sample ${mode === 'json' ? 'JSON' : 'code'} loaded`, 'success');
  }, [mode, showToast]);

  // Clear all
  const handleClear = useCallback(() => {
    setInputCode('');
    setOutputCode('');
    setFixes([]);
    setWarnings([]);
    setErrors([]);
    setMetrics(null);
    setChangedLines([]);
    setStatus({ type: 'ready', message: 'Ready to polish' });
  }, []);

  // Copy output to clipboard
  const handleCopyOutput = useCallback(async () => {
    if (!outputCode) {
      showToast('No output to copy', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(outputCode);
      showToast('Copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy', 'error');
    }
  }, [outputCode, showToast]);

  // Download both original and polished files
  const handleDownload = useCallback(() => {
    if (!outputCode) {
      showToast('No output to download', 'error');
      return;
    }
    
    const extension = mode === 'json' ? 'json' : 'js';
    const mimeType = mode === 'json' ? 'application/json' : 'text/javascript';
    
    // Generate timestamp: YYYYMMDD_HHMMSS
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');
    
    const downloadFile = (content, filename) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    
    let filesDownloaded = 0;
    
    // Download original file if available
    if (inputCode.trim()) {
      downloadFile(inputCode, `original_${timestamp}.${extension}`);
      filesDownloaded++;
    }
    
    // Download polished file with small delay to avoid browser blocking
    setTimeout(() => {
      downloadFile(outputCode, `polished_${timestamp}.${extension}`);
    }, 100);
    filesDownloaded++;
    
    showToast(`Downloaded ${filesDownloaded} file${filesDownloaded > 1 ? 's' : ''}`, 'success');
  }, [inputCode, outputCode, mode, showToast]);

  // Handle mode toggle
  const handleModeToggle = useCallback((newMode) => {
    if (newMode === mode) return;
    
    setMode(newMode);
    setJsonSubMode('format');
    setJsSubMode('format');
    setInputCode('');
    setOutputCode('');
    setFixes([]);
    setWarnings([]);
    setErrors([]);
    setMetrics(null);
    setChangedLines([]);
    setDiffLeftJson('');
    setDiffRightJson('');
    setDiffResult(null);
    setDiffStats(null);
    setDiffLeftJs('');
    setDiffRightJs('');
    setStatus({ type: 'ready', message: 'Ready to polish' });
    showToast(`Switched to ${newMode === 'json' ? 'JSON' : 'JavaScript'} mode`, 'success');
  }, [mode, showToast]);

  // Handle JSON sub-mode toggle
  const handleJsonSubModeToggle = useCallback((newSubMode) => {
    if (newSubMode === jsonSubMode) return;
    
    setJsonSubMode(newSubMode);
    if (newSubMode === 'diff') {
      setStatus({ type: 'ready', message: 'Ready to compare' });
    } else {
      setStatus({ type: 'ready', message: 'Ready to polish' });
    }
  }, [jsonSubMode]);

  // Handle JavaScript sub-mode toggle
  const handleJsSubModeToggle = useCallback((newSubMode) => {
    if (newSubMode === jsSubMode) return;
    
    setJsSubMode(newSubMode);
    if (newSubMode === 'diff') {
      setStatus({ type: 'ready', message: 'Ready to compare' });
    } else if (newSubMode === 'visualize') {
      setStatus({ type: 'ready', message: 'Ready to visualize' });
    } else {
      setStatus({ type: 'ready', message: 'Ready to polish' });
    }
  }, [jsSubMode]);

  // Configure Monaco editor
  const handleEditorMount = useCallback((editor, monaco, isInput) => {
    // Store monaco reference
    monacoRef.current = monaco;
    
    // Define custom theme
    monaco.editor.defineTheme('sn-dark', customTheme);
    monaco.editor.setTheme('sn-dark');

    // Store editor reference
    if (!isInput) {
      outputEditorRef.current = editor;
      
      // Apply highlighting if we have changes
      if (changedLines.length > 0) {
        applyHighlighting(editor, monaco, changedLines);
      }
    }

    // Add keyboard shortcut for primary action (Ctrl/Cmd + Enter)
    if (isInput) {
      editor.addAction({
        id: 'primary-action',
        label: 'Polish/Compare',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        run: () => {
          if (primaryActionRef.current) {
            primaryActionRef.current();
          }
        }
      });
    }
  }, [changedLines, applyHighlighting]);

  // Apply highlighting when output changes or highlighting setting changes
  useEffect(() => {
    if (outputEditorRef.current && monacoRef.current) {
      applyHighlighting(outputEditorRef.current, monacoRef.current, changedLines);
    }
  }, [changedLines, outputCode, applyHighlighting, diffHighlightEnabled]);

  // Keep refs updated so Monaco action always has latest version
  useEffect(() => {
    // Primary action depends on current mode and sub-mode
    if (mode === 'json' && jsonSubMode === 'diff') {
      primaryActionRef.current = handleCompareJson;
    } else if (mode === 'javascript' && jsSubMode === 'diff') {
      primaryActionRef.current = handlePolishDiffRight;
    } else if (mode === 'javascript' && jsSubMode === 'visualize') {
      primaryActionRef.current = handleGenerateFlow;
    } else {
      primaryActionRef.current = handlePolish;
    }
  }, [handlePolish, handleCompareJson, handlePolishDiffRight, handleGenerateFlow, mode, jsonSubMode, jsSubMode]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        // Call appropriate action based on mode and sub-mode
        if (mode === 'json' && jsonSubMode === 'diff') {
          handleCompareJson();
        } else if (mode === 'javascript' && jsSubMode === 'diff') {
          handlePolishDiffRight();
        } else if (mode === 'javascript' && jsSubMode === 'visualize') {
          handleGenerateFlow();
        } else {
          handlePolish();
        }
      }
      // Close dropdown on Escape
      if (e.key === 'Escape') {
        setShowFixesDropdown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePolish, handleCompareJson, handlePolishDiffRight, handleGenerateFlow, mode, jsonSubMode, jsSubMode]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fixesDropdownRef.current && !fixesDropdownRef.current.contains(e.target)) {
        setShowFixesDropdown(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(e.target)) {
        setShowSettings(false);
      }
      if (visualizeSettingsRef.current && !visualizeSettingsRef.current.contains(e.target)) {
        setShowVisualizeSettings(false);
      }
      if (modeInfoRef.current && !modeInfoRef.current.contains(e.target)) {
        setShowModeInfo(false);
      }
    };

    if (showFixesDropdown || showSettings || showVisualizeSettings || showModeInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFixesDropdown, showSettings, showVisualizeSettings, showModeInfo]);

  // Update status message based on current app mode and sub-modes
  useEffect(() => {
    if (appMode === 'plan') {
      if (planSubMode === 'tasks') {
        setStatus({ type: 'ready', message: 'Ready to manage tasks' });
      } else if (notesSubMode === 'docs') {
        setStatus({ type: 'ready', message: 'Ready to take notes' });
      } else {
        setStatus({ type: 'ready', message: 'Ready to sketch' });
      }
    } else {
      // Development mode - set appropriate status based on sub-mode
      if (mode === 'json') {
        if (jsonSubMode === 'diff') {
          setStatus({ type: 'ready', message: 'Ready to compare' });
        } else {
          setStatus({ type: 'ready', message: 'Ready to format' });
        }
      } else {
        if (jsSubMode === 'diff') {
          setStatus({ type: 'ready', message: 'Ready to compare' });
        } else if (jsSubMode === 'visualize') {
          setStatus({ type: 'ready', message: 'Ready to visualize' });
        } else {
          setStatus({ type: 'ready', message: 'Ready to polish' });
        }
      }
    }
  }, [appMode, planSubMode, notesSubMode, mode, jsonSubMode, jsSubMode]);

  const editorOptions = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    contextmenu: true,
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    bracketPairColorization: { enabled: true },
    glyphMargin: true,
    guides: {
      indentation: true,
      bracketPairs: true
    }
  };

  // Get editor language based on mode
  const editorLanguage = mode === 'json' ? 'json' : 'javascript';

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                <path d="M24 16 L8 32 L24 48" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M40 16 L56 32 L40 48" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M38 12 L26 52" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.7"/>
              </svg>
            </div>
            <span className="logo-text">GlideAware Studio</span>
          </div>
          
          {/* Top-level App Mode Toggle */}
          <div className="app-mode-toggle">
            <button
              className={`app-mode-btn ${appMode === 'plan' ? 'active' : ''}`}
              onClick={() => setAppMode('plan')}
              title="Plan Mode"
            >
              <Icon name="plan" size={16} />
              <span>Plan</span>
            </button>
            <button
              className={`app-mode-btn ${appMode === 'development' ? 'active' : ''}`}
              onClick={() => setAppMode('development')}
              title="Development Mode"
            >
              <Icon name="terminal" size={16} />
              <span>Develop</span>
            </button>
          </div>
        </div>

        <div className="header-center">
          {appMode === 'plan' && (
            <>
              {/* Plan Sub-mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${planSubMode === 'tasks' ? 'active' : ''}`}
                  onClick={() => setPlanSubMode('tasks')}
                  title="Tasks - Kanban Board"
                >
                  <span className="mode-icon"><Icon name="clipboard" size={14} /></span>
                  <span className="mode-label">Tasks</span>
                </button>
                <button
                  className={`mode-btn ${planSubMode === 'notes' ? 'active' : ''}`}
                  onClick={() => setPlanSubMode('notes')}
                  title="Notes & Sketches"
                >
                  <span className="mode-icon"><Icon name="document" size={14} /></span>
                  <span className="mode-label">Notes</span>
                </button>
              </div>
              
              {/* Notes Sub-mode Toggle */}
              {planSubMode === 'notes' && (
                <div className="sub-mode-toggle">
                  <button
                    className={`sub-mode-btn ${notesSubMode === 'docs' ? 'active' : ''}`}
                    onClick={() => setNotesSubMode('docs')}
                    title="Rich Text Notes"
                  >
                    <Icon name="document" size={14} /> Docs
                  </button>
                  <button
                    className={`sub-mode-btn ${notesSubMode === 'sketch' ? 'active' : ''}`}
                    onClick={() => setNotesSubMode('sketch')}
                    title="Drawing Canvas"
                  >
                    <Icon name="brush" size={14} /> Sketch
                  </button>
                </div>
              )}
            </>
          )}
          {appMode === 'development' && (
            <>
              {/* Mode Toggle */}
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === 'javascript' ? 'active' : ''}`}
                  onClick={() => handleModeToggle('javascript')}
                  title="JavaScript / ServiceNow Mode"
                >
                  <span className="mode-icon">JS</span>
                  <span className="mode-label">JavaScript</span>
                </button>
                <button
                  className={`mode-btn ${mode === 'json' ? 'active' : ''}`}
                  onClick={() => handleModeToggle('json')}
                  title="JSON Mode"
                >
                  <span className="mode-icon">{'{}'}</span>
                  <span className="mode-label">JSON</span>
                </button>
              </div>
              
              {/* Sub-mode Toggle */}
              {mode === 'json' && (
                <div className="sub-mode-toggle">
                  <button
                    className={`sub-mode-btn ${jsonSubMode === 'format' ? 'active' : ''}`}
                    onClick={() => handleJsonSubModeToggle('format')}
                    title="Format & Validate JSON"
                  >
                    <Icon name="sparkles" size={14} /> Format
                  </button>
                  <button
                    className={`sub-mode-btn ${jsonSubMode === 'diff' ? 'active' : ''}`}
                    onClick={() => handleJsonSubModeToggle('diff')}
                    title="Compare two JSON objects"
                  >
                    <Icon name="compare" size={14} /> Compare
                  </button>
                </div>
              )}
              {mode === 'javascript' && (
                <div className="sub-mode-toggle">
                  <button
                    className={`sub-mode-btn ${jsSubMode === 'format' ? 'active' : ''}`}
                    onClick={() => handleJsSubModeToggle('format')}
                    title="Format & Polish Code"
                  >
                    <Icon name="sparkles" size={14} /> Polish
                  </button>
                  <button
                    className={`sub-mode-btn ${jsSubMode === 'diff' ? 'active' : ''}`}
                    onClick={() => handleJsSubModeToggle('diff')}
                    title="Compare two code snippets"
                  >
                    <Icon name="compare" size={14} /> Compare
                  </button>
                  <button
                    className={`sub-mode-btn ${jsSubMode === 'visualize' ? 'active' : ''}`}
                    onClick={() => handleJsSubModeToggle('visualize')}
                    title="Visualize code flow"
                  >
                    <Icon name="flow" size={14} /> Visualize
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="header-right">
          {appMode === 'plan' && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportPlanData}
                accept=".json"
                style={{ display: 'none' }}
              />
              <button 
                className="panel-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Import Plan Data"
              >
                <Icon name="download" size={14} /> Import
              </button>
              <button 
                className="panel-btn"
                onClick={handleExportPlanData}
                title="Export Plan Data"
              >
                <Icon name="copy" size={14} /> Export
              </button>
              <button 
                className="polish-btn"
                onClick={() => {
                  if (planSubMode === 'tasks') {
                    taskBoardRef.current?.createTask();
                  } else if (notesSubMode === 'docs') {
                    noteEditorRef.current?.createNote();
                  } else {
                    drawingCanvasRef.current?.createDrawing();
                  }
                }}
                title={planSubMode === 'tasks' ? 'Create New Task' : (notesSubMode === 'docs' ? 'Create New Note' : 'Create New Sketch')}
              >
                <span className="icon">
                  <Icon name={planSubMode === 'tasks' ? 'plus' : (notesSubMode === 'docs' ? 'pencil' : 'brush')} size={16} />
                </span>
                {planSubMode === 'tasks' ? 'New Task' : (notesSubMode === 'docs' ? 'New Note' : 'New Sketch')}
              </button>
            </>
          )}
          {appMode === 'development' && (
            <>
              <div className="shortcut-hint">
                <span className="kbd">Ctrl</span>
                <span>+</span>
                <span className="kbd">Enter</span>
              </div>
              {mode === 'json' && jsonSubMode === 'diff' ? (
            <button 
              className="polish-btn compare-btn" 
              onClick={handleCompareJson}
              disabled={isProcessing || !diffLeftJson.trim() || !diffRightJson.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" />
                  Comparing...
                </>
              ) : (
                <>
                  <span className="icon"><Icon name="compare" size={16} /></span>
                  Compare JSON
                </>
              )}
            </button>
          ) : mode === 'javascript' && jsSubMode === 'diff' ? (
            <button 
              className="polish-btn" 
              onClick={handlePolishDiffRight}
              disabled={isProcessing || !diffRightJs.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" />
                  Polishing...
                </>
              ) : (
                <>
                  <span className="icon"><Icon name="sparkles" size={16} /></span>
                  Polish Revised Code
                </>
              )}
            </button>
          ) : mode === 'javascript' && jsSubMode === 'visualize' ? (
            <button 
              className="polish-btn visualize-btn" 
              onClick={handleGenerateFlow}
              disabled={isProcessing || !visualizeCode.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <span className="icon"><Icon name="flow" size={16} /></span>
                  Generate Flow
                </>
              )}
            </button>
          ) : (
            <button 
              className="polish-btn" 
              onClick={handlePolish}
              disabled={isProcessing || !inputCode.trim()}
            >
              {isProcessing ? (
                <>
                  <div className="spinner" />
                  {mode === 'json' ? 'Formatting...' : 'Polishing...'}
                </>
              ) : (
                <>
                  <span className="icon"><Icon name="sparkles" size={16} /></span>
                  {mode === 'json' ? 'Format JSON' : 'Polish Code'}
                </>
              )}
            </button>
          )}
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {appMode === 'plan' ? (
          /* Plan Mode */
          <div className="plan-mode-content">
            {planSubMode === 'tasks' ? (
              <TaskBoard ref={taskBoardRef} onToast={showToast} />
            ) : planSubMode === 'notes' ? (
              notesSubMode === 'docs' ? (
                <NoteEditor ref={noteEditorRef} onToast={showToast} />
              ) : (
                <DrawingCanvas ref={drawingCanvasRef} onToast={showToast} />
              )
            ) : null}
          </div>
        ) : mode === 'javascript' && jsSubMode === 'visualize' ? (
          /* JavaScript Visualize View */
          <div className="visualize-layout">
            {/* Code Editor Panel */}
            <section className="visualize-editor-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot input" />
                  Code to Visualize
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={handleLoadVisualizeSample}>
                    <Icon name="clipboard" size={14} /> Load Sample
                  </button>
                  <button className="panel-btn" onClick={handleClearVisualize}>
                    <Icon name="trash" size={14} /> Clear
                  </button>
                  {/* View Mode Settings Dropdown */}
                  <div className="settings-dropdown-container" ref={visualizeSettingsRef}>
                    <button 
                      className={`panel-btn settings-btn ${showVisualizeSettings ? 'active' : ''}`}
                      onClick={() => setShowVisualizeSettings(!showVisualizeSettings)}
                      title="View Settings"
                    >
                      <Icon name="settings" size={14} />
                    </button>
                    {showVisualizeSettings && (
                      <div className="settings-dropdown">
                        <div className="settings-dropdown-header">
                          <span className="settings-dropdown-title"><Icon name="settings" size={14} /> View Mode</span>
                        </div>
                        <div className="settings-list">
                          <label className="settings-item">
                            <span className="settings-label">
                              <strong>Full Ops View</strong>
                              <small>
                                {visualizeViewMode === 'fullops' 
                                  ? 'Showing everything that executes' 
                                  : 'Currently showing control flow only'}
                              </small>
                            </span>
                            <button
                              className={`settings-toggle ${visualizeViewMode === 'fullops' ? 'on' : 'off'}`}
                              onClick={() => setVisualizeViewMode(visualizeViewMode === 'fullops' ? 'logic' : 'fullops')}
                            >
                              <span className="toggle-track">
                                <span className="toggle-thumb" />
                              </span>
                              <span className="toggle-label">{visualizeViewMode === 'fullops' ? 'On' : 'Off'}</span>
                            </button>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="editor-container">
                <Editor
                  key="visualize-input"
                  height="100%"
                  language="javascript"
                  value={visualizeCode}
                  onChange={(value) => setVisualizeCode(value || '')}
                  onMount={(editor, monaco) => {
                    monacoRef.current = monaco;
                    visualizeEditorRef.current = editor;
                    monaco.editor.defineTheme('sn-dark', customTheme);
                    monaco.editor.setTheme('sn-dark');
                  }}
                  theme="vs-dark"
                  options={editorOptions}
                />
              </div>
            </section>

            {/* Flow Diagram Panel */}
            <section className="visualize-flow-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot output" />
                  Flow Diagram
                  <span className={`view-mode-badge ${visualizeViewMode}`}>
                    {visualizeViewMode === 'logic' ? 'Logic View' : 'Full Ops'}
                  </span>
                  {flowStats && (
                    <span className="flow-stats-badge">
                      {flowStats.total} nodes
                    </span>
                  )}
                </div>
                <div className="panel-actions">
                  {flowStats && (
                    <div className="flow-stats">
                      {flowStats.functions > 0 && (
                        <span className="flow-stat functions">{flowStats.functions} functions</span>
                      )}
                      {flowStats.conditions > 0 && (
                        <span className="flow-stat conditions">{flowStats.conditions} conditions</span>
                      )}
                      {flowStats.loops > 0 && (
                        <span className="flow-stat loops">{flowStats.loops} loops</span>
                      )}
                      {flowStats.servicenowCalls > 0 && (
                        <span className="flow-stat servicenow">{flowStats.servicenowCalls} SN calls</span>
                      )}
                      {/* Full Ops view additional stats */}
                      {visualizeViewMode === 'fullops' && (
                        <>
                          {flowStats.variables > 0 && (
                            <span className="flow-stat variables">{flowStats.variables} vars</span>
                          )}
                          {flowStats.calls > 0 && (
                            <span className="flow-stat calls">{flowStats.calls} calls</span>
                          )}
                          {flowStats.assignments > 0 && (
                            <span className="flow-stat assignments">{flowStats.assignments} assigns</span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flow-container">
                {visualizeError ? (
                  <div className="empty-state error-state">
                    <div className="icon"><Icon name="warning" size={48} /></div>
                    <h3>Error</h3>
                    <p>{visualizeError}</p>
                  </div>
                ) : flowNodes.length > 0 ? (
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleFlowNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                    nodesConnectable={false}
                    nodesDraggable={true}
                    elementsSelectable={true}
                    panActivationKeyCode={null}
                    deleteKeyCode={null}
                    selectionKeyCode={null}
                    multiSelectionKeyCode={null}
                    defaultEdgeOptions={{
                      type: 'smoothstep',
                      animated: false
                    }}
                  >
                    <Background color="#2a2a42" gap={20} />
                    <Controls 
                      showZoom={true}
                      showFitView={true}
                      showInteractive={false}
                    />
                    <MiniMap
                      nodeColor={(node) => node.data?.style?.borderColor || '#4a4a6a'}
                      maskColor="rgba(13, 13, 20, 0.8)"
                      style={{ background: '#12121c' }}
                    />
                    {/* Legend Panel */}
                    <div className="flow-legend">
                      <div className="flow-legend-section">
                        <div className="flow-legend-title">Nodes</div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#7c3aed' }}></span>
                          <span>Function</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#f59e0b' }}></span>
                          <span>Condition</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#06b6d4' }}></span>
                          <span>Loop</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#00d4aa' }}></span>
                          <span>ServiceNow</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#3b82f6' }}></span>
                          <span>Try</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#ef4444' }}></span>
                          <span>Catch/Throw</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-color" style={{ background: '#22c55e' }}></span>
                          <span>Return</span>
                        </div>
                        {/* Full Ops view additional node types */}
                        {visualizeViewMode === 'fullops' && (
                          <>
                            <div className="flow-legend-item">
                              <span className="flow-legend-color" style={{ background: '#475569' }}></span>
                              <span>Variable</span>
                            </div>
                            <div className="flow-legend-item">
                              <span className="flow-legend-color" style={{ background: '#4b5563' }}></span>
                              <span>Call</span>
                            </div>
                            <div className="flow-legend-item">
                              <span className="flow-legend-color" style={{ background: '#525252' }}></span>
                              <span>Assignment</span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flow-legend-section">
                        <div className="flow-legend-title">Edges</div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-line solid"></span>
                          <span>Flow</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-line solid green"></span>
                          <span>True path</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-line solid red"></span>
                          <span>False path</span>
                        </div>
                        <div className="flow-legend-item">
                          <span className="flow-legend-line dashed"></span>
                          <span>Exception</span>
                        </div>
                      </div>
                    </div>
                  </ReactFlow>
                ) : (
                  <div className="empty-state">
                    <div className="icon"><Icon name="flow" size={48} /></div>
                    <h3>No flow diagram yet</h3>
                    <p>Paste your code on the left and click "Generate Flow" to visualize the control flow.</p>
                  </div>
                )}
              </div>
              
              {/* Selected Node Info Panel */}
              {selectedFlowNode && (
                <div className="selected-node-info">
                  <div className="selected-node-header">
                    <span className="selected-node-type">{selectedFlowNode.data.nodeType}</span>
                  </div>
                  <div className="selected-node-label">{selectedFlowNode.data.genericLabel}</div>
                  {selectedFlowNode.data.snippet && (
                    <pre className="selected-node-snippet">{selectedFlowNode.data.snippet}</pre>
                  )}
                </div>
              )}
            </section>
          </div>
        ) : mode === 'javascript' && jsSubMode === 'diff' ? (
          /* JavaScript Diff View */
          <div className="js-diff-layout">
            {/* Panel Headers Row */}
            <div className="js-diff-headers">
              {/* Left Panel Header */}
              <div className="js-diff-panel-header">
                <div className="panel-title">
                  <span className="dot input" />
                  Original Code
                </div>
              </div>

              {/* Right Panel Header */}
              <div className="js-diff-panel-header">
                <div className="panel-title">
                  <span className="dot output" />
                  Revised Code
                  {/* Fixes/Warnings/Errors Dropdown */}
                  {(fixes.length > 0 || warnings.length > 0 || errors.length > 0) && (
                    <div className="fixes-dropdown-container" ref={fixesDropdownRef}>
                      <button 
                        className={`fixes-badge clickable ${showFixesDropdown ? 'active' : ''}`}
                        onClick={() => setShowFixesDropdown(!showFixesDropdown)}
                      >
                        <span className="fixes-badge-icon"><Icon name="check" size={12} /></span>
                        <span>{fixes.length} fixes</span>
                        {errors.length > 0 && (
                          <span className="error-count"><Icon name="x" size={10} /> {errors.length}</span>
                        )}
                        {warnings.length > 0 && (
                          <span className="warning-count"><Icon name="warning" size={10} /> {warnings.length}</span>
                        )}
                        <span className={`fixes-badge-arrow ${showFixesDropdown ? 'open' : ''}`}>▾</span>
                      </button>
                      
                      {showFixesDropdown && (
                        <div className="fixes-dropdown">
                          {fixes.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header">
                                <span className="fixes-dropdown-title"><Icon name="wrench" size={14} /> Fixes Applied</span>
                              </div>
                              <ul className="fixes-list">
                                {fixes.map((fix, index) => (
                                  <li key={index} className="fix-item">
                                    <span className="fix-icon"><Icon name="check" size={12} /></span>
                                    <span className="fix-text">{fix}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {errors.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header errors-header">
                                <span className="fixes-dropdown-title"><Icon name="x" size={14} /> Errors</span>
                              </div>
                              <ul className="fixes-list errors-list">
                                {errors.map((error, index) => (
                                  <li key={index} className="fix-item error-item">
                                    <span className="fix-icon error-icon"><Icon name="x" size={12} /></span>
                                    <span className="fix-text">{error}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {warnings.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header warnings-header">
                                <span className="fixes-dropdown-title"><Icon name="warning" size={14} /> Warnings</span>
                              </div>
                              <ul className="fixes-list warnings-list">
                                {warnings.map((warning, index) => (
                                  <li key={index} className="fix-item warning-item">
                                    <span className="fix-icon warning-icon"><Icon name="warning" size={12} /></span>
                                    <span className="fix-text">{warning}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {changedLines.length > 0 && (
                    <span className="changes-badge">
                      {changedLines.length} lines changed
                    </span>
                  )}
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={handleLoadJsDiffSample}>
                    <Icon name="clipboard" size={14} /> Load Sample
                  </button>
                  <button 
                    className="panel-btn" 
                    onClick={handleDownloadJsDiff}
                    disabled={!diffLeftJs.trim() && !diffRightJs.trim()}
                  >
                    <Icon name="download" size={14} /> Download
                  </button>
                  <button className="panel-btn" onClick={handleClearJsDiff}>
                    <Icon name="trash" size={14} /> Clear
                  </button>
                  {/* Settings Dropdown */}
                  <div className="settings-dropdown-container" ref={settingsDropdownRef}>
                    <button 
                      className={`panel-btn settings-btn ${showSettings ? 'active' : ''}`}
                      onClick={() => setShowSettings(!showSettings)}
                      title="Settings"
                    >
                      <Icon name="settings" size={14} />
                    </button>
                    {showSettings && (
                      <div className="settings-dropdown">
                        <div className="settings-dropdown-header">
                          <span className="settings-dropdown-title"><Icon name="settings" size={14} /> Settings</span>
                        </div>
                        <div className="settings-list">
                          <label className="settings-item">
                            <span className="settings-label">Diff Highlighting</span>
                            <button
                              className={`settings-toggle ${diffHighlightEnabled ? 'on' : 'off'}`}
                              onClick={() => setDiffHighlightEnabled(!diffHighlightEnabled)}
                            >
                              <span className="toggle-track">
                                <span className="toggle-thumb" />
                              </span>
                              <span className="toggle-label">{diffHighlightEnabled ? 'On' : 'Off'}</span>
                            </button>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Swap Button (Centered) */}
              <div className="js-diff-swap-container">
                <button 
                  className="diff-swap-btn" 
                  onClick={handleSwapJs}
                  title="Swap left and right code"
                >
                  ⇄
                </button>
              </div>
            </div>

            {/* Side-by-Side Diff Editor */}
            <div className={`js-diff-editor-container ${!diffHighlightEnabled ? 'diff-highlight-disabled' : ''}`}>
              <DiffEditor
                height="100%"
                language="javascript"
                original={diffLeftJs}
                modified={diffRightJs}
                theme="vs-dark"
                onMount={(editor, monaco) => {
                  // Apply custom theme
                  monaco.editor.defineTheme('sn-dark', customTheme);
                  monaco.editor.setTheme('sn-dark');
                  
                  // Track content changes for both editors
                  const originalEditor = editor.getOriginalEditor();
                  const modifiedEditor = editor.getModifiedEditor();
                  
                  originalEditor.onDidChangeModelContent(() => {
                    setDiffLeftJs(originalEditor.getValue());
                  });
                  
                  modifiedEditor.onDidChangeModelContent(() => {
                    setDiffRightJs(modifiedEditor.getValue());
                  });
                }}
                options={{
                  ...editorOptions,
                  renderSideBySide: true,
                  originalEditable: true,
                  enableSplitViewResizing: false,
                  renderOverviewRuler: true,
                  diffWordWrap: 'on',
                  ignoreTrimWhitespace: false,
                  splitViewDefaultRatio: 0.517,
                }}
                originalModelPath="original.js"
                modifiedModelPath="modified.js"
              />
            </div>
          </div>
        ) : mode === 'json' && jsonSubMode === 'diff' ? (
          /* JSON Diff View */
          <>
            {/* Left JSON Panel */}
            <section className="editor-panel diff-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot input" />
                  Original JSON (Left)
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={handleLoadDiffSample}>
                    <Icon name="clipboard" size={14} /> Load Sample
                  </button>
                  <button className="panel-btn" onClick={handleClearDiff}>
                    <Icon name="trash" size={14} /> Clear
                  </button>
                </div>
              </div>
              <div className="editor-container">
                <Editor
                  key="diff-left"
                  height="100%"
                  language="json"
                  value={diffLeftJson}
                  onChange={(value) => setDiffLeftJson(value || '')}
                  onMount={(editor, monaco) => handleEditorMount(editor, monaco, true)}
                  theme="vs-dark"
                  options={editorOptions}
                />
              </div>
            </section>

            {/* Swap Button */}
            <div className="diff-swap-container">
              <button 
                className="diff-swap-btn" 
                onClick={handleSwapJson}
                title="Swap left and right JSON"
              >
                <Icon name="swap" size={18} />
              </button>
            </div>

            {/* Right JSON Panel */}
            <section className="editor-panel diff-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot output" />
                  Modified JSON (Right)
                </div>
                <div className="panel-actions">
                  {diffStats && !diffStats.identical && (
                    <span className="diff-stats">
                      <span className="diff-stat additions">+{diffStats.additions}</span>
                      <span className="diff-stat deletions">-{diffStats.deletions}</span>
                      <span className="diff-stat modifications">~{diffStats.modifications}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="editor-container">
                <Editor
                  key="diff-right"
                  height="100%"
                  language="json"
                  value={diffRightJson}
                  onChange={(value) => setDiffRightJson(value || '')}
                  onMount={(editor, monaco) => handleEditorMount(editor, monaco, false)}
                  theme="vs-dark"
                  options={editorOptions}
                />
              </div>
            </section>

            {/* Diff Result Panel */}
            <section className="editor-panel diff-result-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot diff" />
                  Differences
                  {diffStats && !diffStats.identical && (
                    <span className="diff-badge">
                      {diffStats.total} change{diffStats.total !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="diff-result-container">
                {diffStats?.identical ? (
                  <div className="empty-state identical-state">
                    <div className="icon"><Icon name="check" size={48} /></div>
                    <h3>JSONs are identical</h3>
                    <p>No differences found between the two JSON objects.</p>
                  </div>
                ) : diffResult ? (
                  <div 
                    className="diff-output"
                    dangerouslySetInnerHTML={{ __html: renderDiffHtml() }}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="icon"><Icon name="compare" size={48} /></div>
                    <h3>No comparison yet</h3>
                    <p>Paste JSON in both panels and click "Compare JSON" to see the differences.</p>
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          /* Normal Polish View */
          <>
            {/* Input Panel */}
            <section className="editor-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot input" />
                  Original {mode === 'json' ? 'JSON' : 'Code'}
                </div>
                <div className="panel-actions">
                  <button className="panel-btn" onClick={handleLoadSample}>
                    <Icon name="clipboard" size={14} /> Load Sample
                  </button>
                  <button className="panel-btn" onClick={handleClear}>
                    <Icon name="trash" size={14} /> Clear
                  </button>
                </div>
              </div>
              <div className="editor-container">
                <Editor
                  key={`input-${mode}`}
                  height="100%"
                  language={editorLanguage}
                  value={inputCode}
                  onChange={(value) => setInputCode(value || '')}
                  onMount={(editor, monaco) => handleEditorMount(editor, monaco, true)}
                  theme="vs-dark"
                  options={editorOptions}
                />
              </div>
            </section>

            {/* Output Panel */}
            <section className="editor-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <span className="dot output" />
                  {mode === 'json' ? 'Formatted JSON' : 'Polished Code'}
                  {(fixes.length > 0 || warnings.length > 0 || errors.length > 0) && (
                    <div className="fixes-dropdown-container" ref={fixesDropdownRef}>
                      <button 
                        className={`fixes-badge clickable ${showFixesDropdown ? 'active' : ''}`}
                        onClick={() => setShowFixesDropdown(!showFixesDropdown)}
                      >
                        <span className="fixes-badge-icon"><Icon name="check" size={12} /></span>
                        <span>{fixes.length} fixes</span>
                        {errors.length > 0 && (
                          <span className="error-count"><Icon name="x" size={10} /> {errors.length}</span>
                        )}
                        {warnings.length > 0 && (
                          <span className="warning-count"><Icon name="warning" size={10} /> {warnings.length}</span>
                        )}
                        <span className={`fixes-badge-arrow ${showFixesDropdown ? 'open' : ''}`}>▾</span>
                      </button>
                      
                      {showFixesDropdown && (
                        <div className="fixes-dropdown">
                          {fixes.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header">
                                <span className="fixes-dropdown-title"><Icon name="wrench" size={14} /> Fixes Applied</span>
                              </div>
                              <ul className="fixes-list">
                                {fixes.map((fix, index) => (
                                  <li key={index} className="fix-item">
                                    <span className="fix-icon"><Icon name="check" size={12} /></span>
                                    <span className="fix-text">{fix}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {errors.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header errors-header">
                                <span className="fixes-dropdown-title"><Icon name="x" size={14} /> Errors</span>
                              </div>
                              <ul className="fixes-list errors-list">
                                {errors.map((error, index) => (
                                  <li key={index} className="fix-item error-item">
                                    <span className="fix-icon error-icon"><Icon name="x" size={12} /></span>
                                    <span className="fix-text">{error}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                          {warnings.length > 0 && (
                            <>
                              <div className="fixes-dropdown-header warnings-header">
                                <span className="fixes-dropdown-title"><Icon name="warning" size={14} /> Warnings</span>
                              </div>
                              <ul className="fixes-list warnings-list">
                                {warnings.map((warning, index) => (
                                  <li key={index} className="fix-item warning-item">
                                    <span className="fix-icon warning-icon"><Icon name="warning" size={12} /></span>
                                    <span className="fix-text">{warning}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {changedLines.length > 0 && (
                    <span className="changes-badge">
                      {changedLines.length} lines changed
                    </span>
                  )}
                </div>
                <div className="panel-actions">
                  <button 
                    className="panel-btn" 
                    onClick={handleCopyOutput}
                    disabled={!outputCode}
                  >
                    <Icon name="copy" size={14} /> Copy
                  </button>
                  <button 
                    className="panel-btn" 
                    onClick={handleDownload}
                    disabled={!outputCode}
                  >
                    <Icon name="download" size={14} /> Download
                  </button>
                  {/* Settings Dropdown */}
                  <div className="settings-dropdown-container" ref={settingsDropdownRef}>
                    <button 
                      className={`panel-btn settings-btn ${showSettings ? 'active' : ''}`}
                      onClick={() => setShowSettings(!showSettings)}
                      title="Settings"
                    >
                      <Icon name="settings" size={14} />
                    </button>
                    {showSettings && (
                      <div className="settings-dropdown">
                        <div className="settings-dropdown-header">
                          <span className="settings-dropdown-title"><Icon name="settings" size={14} /> Settings</span>
                        </div>
                        <div className="settings-list">
                          <label className="settings-item">
                            <span className="settings-label">Diff Highlighting</span>
                            <button
                              className={`settings-toggle ${diffHighlightEnabled ? 'on' : 'off'}`}
                              onClick={() => setDiffHighlightEnabled(!diffHighlightEnabled)}
                            >
                              <span className="toggle-track">
                                <span className="toggle-thumb" />
                              </span>
                              <span className="toggle-label">{diffHighlightEnabled ? 'On' : 'Off'}</span>
                            </button>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="editor-container">
                {outputCode ? (
                  <Editor
                    key={`output-${mode}`}
                    height="100%"
                    language={editorLanguage}
                    value={outputCode}
                    onMount={(editor, monaco) => handleEditorMount(editor, monaco, false)}
                    theme="vs-dark"
                    options={{
                      ...editorOptions,
                      readOnly: true
                    }}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="icon">{mode === 'json' ? <Icon name="json" size={48} /> : <Icon name="code" size={48} />}</div>
                    <h3>No output yet</h3>
                    <p>
                      {mode === 'json' 
                        ? 'Paste your JSON on the left and click "Format JSON" to see the formatted result here.'
                        : 'Paste your ServiceNow code on the left and click "Polish Code" to see the formatted result here.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Status Bar */}
      <footer className="status-bar">
        <div className="status-left">
          <div className="status-item">
            <span className={`status-dot ${status.type}`} />
            <span>{status.message}</span>
          </div>
          {/* Show before→after metrics only in Polish/Compare modes (where transformation happens) */}
          {metrics && jsSubMode !== 'visualize' && (
            <>
              <div className="status-item">
                Lines: {metrics.originalLines} → {metrics.formattedLines}
              </div>
              <div className="status-item">
                Chars: {metrics.originalChars} → {metrics.formattedChars}
              </div>
            </>
          )}
          {/* Show simple stats in Visualize mode */}
          {jsSubMode === 'visualize' && visualizeCode && (
            <>
              <div className="status-item">
                Lines: {visualizeCode.split('\n').length}
              </div>
              <div className="status-item">
                Chars: {visualizeCode.length}
              </div>
            </>
          )}
        </div>
        <div className="status-center">
          Copyright (c) 2026 Ioannis E. Kosmadakis
        </div>
        <div className="status-right">
          <div className="status-item status-description">
            {appMode === 'plan' 
              ? (planSubMode === 'tasks' 
                  ? 'Task Management & Kanban'
                  : (notesSubMode === 'docs' ? 'Notes & Documentation' : 'Sketches & Diagrams'))
              : mode === 'json' 
                ? (jsonSubMode === 'diff' ? 'JSON Comparison & Analysis' : 'JSON Formatter & Validator')
                : (jsSubMode === 'visualize' 
                    ? 'Code Flow Visualization' 
                    : (jsSubMode === 'diff' ? 'Script Comparison & Polish' : 'Script Analysis & Refinement'))
            }
          </div>
          <div className="mode-info-container" ref={modeInfoRef}>
            <button 
              className={`mode-info-btn ${showModeInfo ? 'active' : ''}`}
              onClick={() => setShowModeInfo(!showModeInfo)}
              title="Mode Information"
            >
              <Icon name="info" size={14} />
            </button>
            {showModeInfo && (
              <div className="mode-info-dropdown">
                <div className="mode-info-header">
                  {appMode === 'plan' 
                    ? (planSubMode === 'tasks' 
                        ? <><Icon name="clipboard" size={14} /> Task Management</>
                        : (notesSubMode === 'docs' 
                            ? <><Icon name="document" size={14} /> Notes & Docs</>
                            : <><Icon name="brush" size={14} /> Sketches</>))
                    : mode === 'json' 
                      ? (jsonSubMode === 'diff' ? <><Icon name="compare" size={14} /> JSON Diff</> : <><Icon name="json" size={14} /> JSON Format</>)
                      : (jsSubMode === 'visualize' ? <><Icon name="flow" size={14} /> Flow Visualization</> : (jsSubMode === 'diff' ? <><Icon name="compare" size={14} /> Compare & Polish</> : <><Icon name="sparkles" size={14} /> Polish Mode</>))
                  }
                </div>
                <div className="mode-info-content">
                  {/* Plan Mode - Tasks */}
                  {appMode === 'plan' && planSubMode === 'tasks' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Kanban Board</div>
                        <ul>
                          <li>Drag & drop tasks between columns</li>
                          <li>Columns: To Do, In Progress, On Hold, In Review, Completed</li>
                          <li>Collapsible Backlog for future items</li>
                          <li>Priority levels with color coding</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Task Details</div>
                        <ul>
                          <li>Title, description, and tags</li>
                          <li>Link to external systems (Jira, ServiceNow, etc.)</li>
                          <li>All changes auto-save to IndexedDB</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* Plan Mode - Notes (Docs) */}
                  {appMode === 'plan' && planSubMode === 'notes' && notesSubMode === 'docs' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Rich Text Editor</div>
                        <ul>
                          <li>Markdown support for formatting</li>
                          <li>Bold, italic, headings, lists</li>
                          <li>Code blocks and inline code</li>
                          <li>Checklists and quotes</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Organization</div>
                        <ul>
                          <li>Search notes by title or content</li>
                          <li>Auto-save with debounced persistence</li>
                          <li>Notes stored locally in IndexedDB</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* Plan Mode - Notes (Sketch) */}
                  {appMode === 'plan' && planSubMode === 'notes' && notesSubMode === 'sketch' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Drawing Tools</div>
                        <ul>
                          <li>Pen, Line, Rectangle, Ellipse, Arrow</li>
                          <li>9 color options</li>
                          <li>4 stroke width settings</li>
                          <li>Eraser for corrections</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Canvas Features</div>
                        <ul>
                          <li>Multiple sketches with sidebar navigation</li>
                          <li>Grid background for alignment</li>
                          <li>Auto-save drawings to IndexedDB</li>
                          <li>Clear canvas to start fresh</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* JSON Format Mode */}
                  {appMode === 'development' && mode === 'json' && jsonSubMode !== 'diff' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Auto-Fixes</div>
                        <ul>
                          <li>Strip comments (single & multi-line)</li>
                          <li>Remove trailing commas</li>
                          <li>Convert single to double quotes</li>
                          <li>Quote unquoted object keys</li>
                          <li>Fix multiple consecutive commas</li>
                          <li>Add missing closing braces/brackets</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Warnings</div>
                        <ul>
                          <li>Duplicate keys detection</li>
                          <li>Deep nesting (10+ levels)</li>
                          <li>Long strings & large files</li>
                          <li>Excessive nulls or empty containers</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* JSON Diff Mode */}
                  {appMode === 'development' && mode === 'json' && jsonSubMode === 'diff' && (
                    <div className="mode-info-section">
                      <div className="mode-info-section-title">Features</div>
                      <ul>
                        <li>Side-by-side JSON editors</li>
                        <li>Visual diff with color-coded changes</li>
                        <li>Statistics: additions, deletions, modifications</li>
                        <li>Swap button to reverse comparison</li>
                        <li>Load sample data to try it out</li>
                      </ul>
                    </div>
                  )}
                  {/* JavaScript Polish Mode */}
                  {appMode === 'development' && mode === 'javascript' && jsSubMode === 'format' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Formatting</div>
                        <ul>
                          <li>Prettier with ServiceNow-friendly settings</li>
                          <li>Normalize line endings & whitespace</li>
                          <li>Fix keyword spacing & semicolons</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">ServiceNow Fixes</div>
                        <ul>
                          <li>Typo detection with fuzzy matching</li>
                          <li>Context-aware: knows GlideRecord, g_form, gs...</li>
                          <li>60+ classes, 400+ methods supported</li>
                          <li>gs.now() → GlideDateTime conversion</li>
                          <li>getValue(&apos;sys_id&apos;) → getUniqueValue()</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Warnings</div>
                        <ul>
                          <li>Performance: update() in loops, N+1 queries</li>
                          <li>Security: eval(), hardcoded sys_ids</li>
                          <li>Best practices: empty catch, deep nesting</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* JavaScript Compare Mode */}
                  {appMode === 'development' && mode === 'javascript' && jsSubMode === 'diff' && (
                    <div className="mode-info-section">
                      <div className="mode-info-section-title">Features</div>
                      <ul>
                        <li>Monaco DiffEditor with real-time comparison</li>
                        <li>Color-coded additions, deletions, changes</li>
                        <li>Polish the revised code while keeping original</li>
                        <li>Toggle diff highlighting on/off</li>
                        <li>Download both files with timestamps</li>
                        <li>Swap panels to reverse comparison</li>
                      </ul>
                    </div>
                  )}
                  {/* JavaScript Visualize Mode */}
                  {appMode === 'development' && mode === 'javascript' && jsSubMode === 'visualize' && (
                    <>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">Flow Diagrams</div>
                        <ul>
                          <li>Interactive canvas with React Flow</li>
                          <li>Zoom, pan, and minimap navigation</li>
                          <li>Click any node to see code details</li>
                          <li>Color-coded by type: loops, conditions, calls</li>
                        </ul>
                      </div>
                      <div className="mode-info-section">
                        <div className="mode-info-section-title">ServiceNow-Aware</div>
                        <ul>
                          <li>Recognizes GlideRecord, gs.*, g_form, g_user</li>
                          <li>Parses IIFE patterns & Business Rules</li>
                          <li>Full Ops View: all operations</li>
                          <li>Logic View: control flow only</li>
                        </ul>
                      </div>
                    </>
                  )}
                  {/* Privacy Section - Always visible */}
                  <div className="mode-info-section mode-info-privacy">
                    <div className="mode-info-section-title">
                      <Icon name="check" size={10} /> Privacy
                    </div>
                    <ul>
                      <li><strong>100% client-side</strong> — works without internet</li>
                      <li>Your code never leaves your browser</li>
                      <li>No server, no tracking, no data collection</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`}>
        {toast.message}
      </div>
    </div>
  );
}

export default App;
