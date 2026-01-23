/**
 * @fileoverview Flow Generator for React Flow Visualization
 * @description Converts AST control flow nodes into React Flow nodes and edges
 * with proper layout and styling for ServiceNow code visualization.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Node dimensions and spacing
 */
const LAYOUT = {
  NODE_WIDTH: 200,
  NODE_HEIGHT: 50,
  HORIZONTAL_GAP: 80,
  VERTICAL_GAP: 60,
  BRANCH_OFFSET: 120,
  INITIAL_X: 100,
  INITIAL_Y: 50
};

/**
 * Node type to style mapping
 * Minimal design - color-coded by type
 */
const NODE_STYLES = {
  function: {
    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
    borderColor: '#7c3aed',
    color: '#ffffff'
  },
  condition: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    borderColor: '#f59e0b',
    color: '#ffffff',
    shape: 'diamond'
  },
  loop: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    borderColor: '#06b6d4',
    color: '#ffffff'
  },
  switch: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    borderColor: '#8b5cf6',
    color: '#ffffff'
  },
  case: {
    background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    borderColor: '#a78bfa',
    color: '#ffffff'
  },
  try: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    borderColor: '#3b82f6',
    color: '#ffffff'
  },
  catch: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderColor: '#ef4444',
    color: '#ffffff'
  },
  finally: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    borderColor: '#64748b',
    color: '#ffffff'
  },
  return: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    borderColor: '#22c55e',
    color: '#ffffff'
  },
  throw: {
    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    borderColor: '#ef4444',
    color: '#ffffff'
  },
  break: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    borderColor: '#f97316',
    color: '#ffffff'
  },
  continue: {
    background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    borderColor: '#14b8a6',
    color: '#ffffff'
  },
  servicenow: {
    background: 'linear-gradient(135deg, #00d4aa 0%, #059669 100%)',
    borderColor: '#00d4aa',
    color: '#ffffff'
  },
  'servicenow-call': {
    background: 'linear-gradient(135deg, #00d4aa 0%, #10b981 100%)',
    borderColor: '#00d4aa',
    color: '#ffffff'
  },
  call: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    borderColor: '#64748b',
    color: '#ffffff'
  },
  assignment: {
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    borderColor: '#6366f1',
    color: '#ffffff'
  },
  // Full Ops view node types (lower visual priority)
  variable: {
    background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    borderColor: '#475569',
    color: '#cbd5e1'
  },
  'call-generic': {
    background: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
    borderColor: '#4b5563',
    color: '#d1d5db'
  },
  'assignment-generic': {
    background: 'linear-gradient(135deg, #525252 0%, #404040 100%)',
    borderColor: '#525252',
    color: '#d4d4d8'
  },
  branch: {
    background: 'transparent',
    borderColor: 'transparent',
    color: '#9898b0'
  },
  default: {
    background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    borderColor: '#374151',
    color: '#ffffff'
  }
};

/**
 * Edge styles based on type
 */
const EDGE_STYLES = {
  default: {
    stroke: '#4a4a6a',
    strokeWidth: 2
  },
  true: {
    stroke: '#22c55e',
    strokeWidth: 2,
    label: 'true'
  },
  false: {
    stroke: '#ef4444',
    strokeWidth: 2,
    label: 'false'
  },
  loop: {
    stroke: '#06b6d4',
    strokeWidth: 2,
    animated: true
  },
  catch: {
    stroke: '#ef4444',
    strokeWidth: 2,
    strokeDasharray: '5,5'
  }
};

// =============================================================================
// LAYOUT ALGORITHM
// =============================================================================

/**
 * Calculates positions for all nodes using a hierarchical layout
 * Sequential statements are arranged vertically, branches horizontally
 * @param {Array} flowNodes - Array of flow nodes from AST parser
 * @returns {Object} - Map of node IDs to positions { x, y }
 */
function calculateLayout(flowNodes) {
  const positions = {};
  const nodeMap = new Map(flowNodes.map(n => [n.id, n]));
  
  // Build parent-child relationships
  const nodeChildren = {};
  const rootNodes = [];

  flowNodes.forEach(node => {
    if (node.parentId) {
      if (!nodeChildren[node.parentId]) {
        nodeChildren[node.parentId] = [];
      }
      nodeChildren[node.parentId].push(node.id);
    } else {
      rootNodes.push(node.id);
    }
  });

  // Track the current Y position for sequential layout
  let currentY = LAYOUT.INITIAL_Y;
  
  // Track column widths for branch layouts
  const columnWidths = new Map();

  /**
   * Recursively position nodes
   * @returns {Object} - { width, height } of the subtree
   */
  const positionNode = (nodeId, baseX, startY, depth = 0) => {
    const node = nodeMap.get(nodeId);
    if (!node) return { width: 0, height: 0 };

    const children = nodeChildren[nodeId] || [];
    const nonBranchChildren = children.filter(id => nodeMap.get(id)?.type !== 'branch');
    const branchChildren = children.filter(id => nodeMap.get(id)?.type === 'branch');

    let nodeX = baseX;
    let nodeY = startY;
    let totalHeight = LAYOUT.NODE_HEIGHT + LAYOUT.VERTICAL_GAP;
    let maxWidth = LAYOUT.NODE_WIDTH;

    // Handle branch nodes (true/false paths for conditions)
    if (branchChildren.length > 0) {
      // Position the condition node
      positions[nodeId] = { x: nodeX, y: nodeY };
      
      let branchY = nodeY + LAYOUT.NODE_HEIGHT + LAYOUT.VERTICAL_GAP;
      let leftWidth = 0;
      let rightWidth = 0;
      let maxBranchHeight = 0;

      branchChildren.forEach((branchId, index) => {
        const branchNode = nodeMap.get(branchId);
        const branchChildIds = nodeChildren[branchId] || [];
        
        // Calculate offset for left (false) vs right (true) branch
        const isLeftBranch = branchNode?.branchType === 'false' || index === 1;
        const branchOffsetX = isLeftBranch 
          ? baseX - LAYOUT.BRANCH_OFFSET 
          : baseX + LAYOUT.BRANCH_OFFSET;

        let branchHeight = 0;
        let branchWidth = 0;

        // Position children of this branch vertically
        let childY = branchY;
        branchChildIds.forEach(childId => {
          const result = positionNode(childId, branchOffsetX, childY, depth + 1);
          childY += result.height;
          branchHeight += result.height;
          branchWidth = Math.max(branchWidth, result.width);
        });

        if (isLeftBranch) {
          leftWidth = branchWidth;
        } else {
          rightWidth = branchWidth;
        }
        maxBranchHeight = Math.max(maxBranchHeight, branchHeight);
      });

      totalHeight += maxBranchHeight;
      maxWidth = Math.max(maxWidth, leftWidth + rightWidth + LAYOUT.BRANCH_OFFSET * 2);
    } else {
      // No branches - position this node
      positions[nodeId] = { x: nodeX, y: nodeY };
    }

    // Position non-branch children sequentially (vertically)
    if (nonBranchChildren.length > 0 && branchChildren.length === 0) {
      let childY = nodeY + LAYOUT.NODE_HEIGHT + LAYOUT.VERTICAL_GAP;
      
      nonBranchChildren.forEach(childId => {
        const result = positionNode(childId, baseX, childY, depth + 1);
        childY += result.height;
        totalHeight += result.height;
        maxWidth = Math.max(maxWidth, result.width);
      });
    }

    return { width: maxWidth, height: totalHeight };
  };

  // Position all root nodes
  // If there's only one root, center it; otherwise stack them
  if (rootNodes.length === 1) {
    positionNode(rootNodes[0], LAYOUT.INITIAL_X + 200, LAYOUT.INITIAL_Y);
  } else {
    // Stack multiple roots vertically
    let y = LAYOUT.INITIAL_Y;
    rootNodes.forEach(nodeId => {
      const result = positionNode(nodeId, LAYOUT.INITIAL_X + 200, y);
      y += result.height + LAYOUT.VERTICAL_GAP;
    });
  }

  return positions;
}

// =============================================================================
// REACT FLOW CONVERSION
// =============================================================================

/**
 * Converts AST flow nodes to React Flow nodes
 * @param {Array} flowNodes - Array of flow nodes from AST parser
 * @param {Object} positions - Map of node IDs to positions
 * @returns {Array} - Array of React Flow node objects
 */
function generateReactFlowNodes(flowNodes, positions) {
  return flowNodes
    .filter(node => node.type !== 'branch') // Filter out branch markers
    .map(node => {
      const style = NODE_STYLES[node.type] || NODE_STYLES.default;
      const position = positions[node.id] || { x: 0, y: 0 };

      // Truncate label if too long
      let displayLabel = node.label || node.type;
      if (displayLabel.length > 35) {
        displayLabel = displayLabel.substring(0, 32) + '...';
      }

      return {
        id: node.id,
        type: 'custom',
        position,
        data: {
          label: displayLabel,
          fullLabel: node.label,
          nodeType: node.type,
          subtype: node.subtype,
          snippet: node.snippet,
          range: node.range,
          loc: node.loc,
          style: {
            background: style.background,
            borderColor: style.borderColor,
            color: style.color,
            shape: style.shape
          }
        },
        // Styling passed to React Flow
        style: {
          width: node.type === 'condition' ? LAYOUT.NODE_WIDTH + 20 : LAYOUT.NODE_WIDTH,
          minHeight: LAYOUT.NODE_HEIGHT
        }
      };
    });
}

/**
 * Generates edges between React Flow nodes
 * @param {Array} flowNodes - Array of flow nodes from AST parser
 * @returns {Array} - Array of React Flow edge objects
 */
function generateReactFlowEdges(flowNodes) {
  const edges = [];
  const nodeMap = new Map(flowNodes.map(n => [n.id, n]));
  const addedEdges = new Set(); // Track added edges to avoid duplicates

  // Group children by parent
  const childrenByParent = {};
  flowNodes.forEach(node => {
    if (node.parentId) {
      if (!childrenByParent[node.parentId]) {
        childrenByParent[node.parentId] = [];
      }
      childrenByParent[node.parentId].push(node);
    }
  });

  /**
   * Adds an edge if it doesn't already exist
   */
  const addEdge = (source, target, style, label = undefined) => {
    const edgeKey = `${source}_${target}`;
    if (addedEdges.has(edgeKey)) return;
    addedEdges.add(edgeKey);

    edges.push({
      id: `edge_${edgeKey}`,
      source,
      target,
      type: 'smoothstep',
      animated: style.animated || false,
      label,
      labelStyle: label ? { fill: style.stroke, fontWeight: 600, fontSize: 11 } : undefined,
      labelBgStyle: label ? { fill: '#12121c', fillOpacity: 0.8 } : undefined,
      style: {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeDasharray: style.strokeDasharray
      }
    });
  };

  // Create edges from parents to first children
  flowNodes.forEach(node => {
    if (!node.parentId) return;

    const parent = nodeMap.get(node.parentId);
    if (!parent) return;

    // Skip branch nodes themselves, but process their children
    if (node.type === 'branch') {
      const branchChildren = childrenByParent[node.id] || [];
      if (branchChildren.length > 0) {
        // Connect parent to first child of each branch
        const firstChild = branchChildren[0];
        const edgeStyle = node.branchType === 'true' ? EDGE_STYLES.true : EDGE_STYLES.false;
        addEdge(parent.id, firstChild.id, edgeStyle, edgeStyle.label);
      }
      return;
    }

    // For non-branch nodes, check if this is the first child
    const siblings = childrenByParent[node.parentId] || [];
    const nonBranchSiblings = siblings.filter(s => s.type !== 'branch');
    const isFirstChild = nonBranchSiblings.length > 0 && nonBranchSiblings[0].id === node.id;

    // Only create edge from parent to first child (others get sequential edges)
    if (isFirstChild) {
      let edgeStyle = EDGE_STYLES.default;
      
      if (parent.type === 'loop') {
        edgeStyle = EDGE_STYLES.loop;
      } else if (node.type === 'catch') {
        edgeStyle = EDGE_STYLES.catch;
      }

      addEdge(parent.id, node.id, edgeStyle);
    }
  });

  // Create sequential edges for siblings at the same level
  Object.entries(childrenByParent).forEach(([, children]) => {
    // Filter out branch nodes for sequential edges
    const nonBranchChildren = children.filter(c => c.type !== 'branch');
    
    for (let i = 0; i < nonBranchChildren.length - 1; i++) {
      const current = nonBranchChildren[i];
      const next = nonBranchChildren[i + 1];
      
      // Don't create sequential edge if current is a terminator
      if (['return', 'throw', 'break', 'continue'].includes(current.type)) {
        continue;
      }

      addEdge(current.id, next.id, EDGE_STYLES.default);
    }
  });

  // Handle catch/finally edges from try blocks
  flowNodes.forEach(node => {
    if (node.type === 'catch' || node.type === 'finally') {
      const parent = nodeMap.get(node.parentId);
      if (parent && parent.type === 'try') {
        addEdge(parent.id, node.id, node.type === 'catch' ? EDGE_STYLES.catch : EDGE_STYLES.default);
      }
    }
  });

  return edges;
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

/**
 * Generates React Flow diagram data from AST flow nodes
 * @param {Array} flowNodes - Array of flow nodes from AST parser
 * @returns {Object} - { nodes: Array, edges: Array }
 */
export function generateFlowDiagram(flowNodes) {
  if (!flowNodes || flowNodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Calculate layout positions
  const positions = calculateLayout(flowNodes);

  // Generate React Flow nodes and edges
  const nodes = generateReactFlowNodes(flowNodes, positions);
  const edges = generateReactFlowEdges(flowNodes);

  return { nodes, edges };
}

/**
 * Gets statistics about the flow diagram
 * @param {Array} flowNodes - Array of flow nodes
 * @returns {Object} - Statistics object
 */
export function getFlowStats(flowNodes) {
  const stats = {
    functions: 0,
    conditions: 0,
    loops: 0,
    servicenowCalls: 0,
    tryCatch: 0,
    returns: 0,
    variables: 0,
    calls: 0,
    assignments: 0,
    total: flowNodes.length
  };

  flowNodes.forEach(node => {
    switch (node.type) {
      case 'function':
        stats.functions++;
        break;
      case 'condition':
      case 'switch':
        stats.conditions++;
        break;
      case 'loop':
        stats.loops++;
        break;
      case 'servicenow':
      case 'servicenow-call':
        stats.servicenowCalls++;
        break;
      case 'try':
        stats.tryCatch++;
        break;
      case 'return':
        stats.returns++;
        break;
      case 'variable':
        stats.variables++;
        break;
      case 'call':
      case 'call-generic':
        stats.calls++;
        break;
      case 'assignment':
      case 'assignment-generic':
        stats.assignments++;
        break;
    }
  });

  return stats;
}

export default {
  generateFlowDiagram,
  getFlowStats,
  NODE_STYLES,
  EDGE_STYLES
};
