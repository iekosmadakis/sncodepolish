/**
 * @fileoverview Drawing Canvas Component - Sketch/Diagram Tool
 * @description Provides a canvas-based drawing tool for creating diagrams,
 * sketches, and visual notes. Supports shapes, freehand drawing, and text.
 * All data persists to IndexedDB automatically.
 */

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import Icon from '../Icon';
import {
  getAllDrawings,
  createDrawing,
  updateDrawing,
  deleteDrawing
} from '../../utils/storage/planStorage';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Available drawing tools
 */
const TOOLS = {
  TEXT: 'text',
  PEN: 'pen',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  ARROW: 'arrow',
  ERASER: 'eraser'
};

/**
 * Default colors palette
 */
const COLORS = [
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#00d4aa',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899'
];

/**
 * Stroke width options
 */
const STROKE_WIDTHS = [2, 4, 6, 8];

// =============================================================================
// DRAWING CANVAS COMPONENT
// =============================================================================

/**
 * DrawingCanvas - Canvas-based drawing/sketching tool
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onToast - Toast notification callback
 * @param {React.Ref} ref - Forwarded ref for external method access
 */
const DrawingCanvas = forwardRef(function DrawingCanvas({ onToast }, ref) {
  // State
  const [drawings, setDrawings] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [tool, setTool] = useState(TOOLS.PEN);
  const [color, setColor] = useState('#00d4aa');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDrawingsList, setShowDrawingsList] = useState(true);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'oldest', 'alphabetical'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
  
  const canvasRef = useRef(null);
  const sortDropdownRef = useRef(null);
  const contextRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const textInputRef = useRef(null);

  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------

  /**
   * Loads all drawings from IndexedDB on mount
   */
  useEffect(() => {
    const loadDrawings = async () => {
      try {
        const loadedDrawings = await getAllDrawings();
        const sorted = loadedDrawings.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setDrawings(sorted);
        if (sorted.length > 0) {
          setSelectedDrawing(sorted[0]);
        }
      } catch (error) {
        onToast?.('Failed to load drawings', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadDrawings();
  }, [onToast]);

  /**
   * Initialize canvas context
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Configure context
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;

    // Redraw elements
    if (selectedDrawing) {
      redrawCanvas();
    }
  }, [selectedDrawing]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      if (selectedDrawing) {
        redrawCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedDrawing]);

  /**
   * Close sort dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    };
    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortDropdown]);

  /**
   * Memoized filtered and sorted drawings
   */
  const sortedDrawings = useMemo(() => 
    drawings
      .filter(drawing => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (drawing.title || 'Untitled').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'oldest':
            return new Date(a.updatedAt) - new Date(b.updatedAt);
          case 'alphabetical':
            return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
          case 'recent':
          default:
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
      }),
    [drawings, searchQuery, sortBy]
  );

  // -------------------------------------------------------------------------
  // Drawing Operations
  // -------------------------------------------------------------------------

  /**
   * Creates a new drawing
   */
  const handleCreateDrawing = useCallback(async () => {
    try {
      const newDrawing = await createDrawing({
        title: 'Untitled Sketch',
        elements: []
      });
      setDrawings(prev => [newDrawing, ...prev]);
      setSelectedDrawing(newDrawing);
      onToast?.('New sketch created', 'success');
    } catch (error) {
      onToast?.('Failed to create sketch', 'error');
    }
  }, [onToast]);

  /**
   * Exposes methods to parent via ref
   */
  useImperativeHandle(ref, () => ({
    createDrawing: handleCreateDrawing
  }), [handleCreateDrawing]);

  /**
   * Saves current drawing to IndexedDB
   */
  const saveDrawing = useCallback(async (elements) => {
    if (!selectedDrawing) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDrawing(selectedDrawing.id, { elements });
        setDrawings(prev => prev.map(d => 
          d.id === selectedDrawing.id 
            ? { ...d, elements, updatedAt: new Date().toISOString() } 
            : d
        ));
      } catch (error) {
        onToast?.('Failed to save sketch', 'error');
      }
    }, 300);
  }, [selectedDrawing, onToast]);

  /**
   * Shows delete confirmation dialog
   */
  const confirmDeleteDrawing = useCallback((id, title) => {
    setDeleteConfirm({ show: true, id, title: title || 'Untitled Sketch' });
  }, []);

  /**
   * Deletes a drawing after confirmation
   */
  const handleDeleteDrawing = useCallback(async () => {
    const { id } = deleteConfirm;
    if (!id) return;

    try {
      await deleteDrawing(id);
      setDrawings(prev => {
        const updated = prev.filter(d => d.id !== id);
        if (selectedDrawing?.id === id) {
          setSelectedDrawing(updated[0] || null);
        }
        return updated;
      });
      onToast?.('Sketch deleted', 'success');
    } catch (error) {
      onToast?.('Failed to delete sketch', 'error');
    } finally {
      setDeleteConfirm({ show: false, id: null, title: '' });
    }
  }, [deleteConfirm, selectedDrawing, onToast]);

  /**
   * Updates drawing title
   */
  const handleUpdateTitle = useCallback(async (title) => {
    if (!selectedDrawing) return;
    try {
      await updateDrawing(selectedDrawing.id, { title });
      setSelectedDrawing(prev => ({ ...prev, title }));
      setDrawings(prev => prev.map(d => 
        d.id === selectedDrawing.id ? { ...d, title } : d
      ));
    } catch (error) {
      onToast?.('Failed to update title', 'error');
    }
  }, [selectedDrawing, onToast]);

  // -------------------------------------------------------------------------
  // Canvas Drawing
  // -------------------------------------------------------------------------

  /**
   * Redraws all elements on canvas
   * Note: Grid is rendered via CSS background, not on canvas
   */
  const redrawCanvas = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !selectedDrawing) return;

    // Clear canvas (transparent so CSS grid shows through)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    selectedDrawing.elements?.forEach(element => {
      drawElement(ctx, element);
    });
  }, [selectedDrawing]);

  /**
   * Draws a single element
   */
  const drawElement = (ctx, element) => {
    ctx.strokeStyle = element.color;
    ctx.fillStyle = element.color;
    ctx.lineWidth = element.strokeWidth;

    switch (element.type) {
      case 'pen':
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(element.startX, element.startY);
        ctx.lineTo(element.endX, element.endY);
        ctx.stroke();
        break;

      case 'rectangle':
        ctx.strokeRect(
          element.x, element.y,
          element.width, element.height
        );
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(
          element.x + element.width / 2,
          element.y + element.height / 2,
          Math.abs(element.width / 2),
          Math.abs(element.height / 2),
          0, 0, Math.PI * 2
        );
        ctx.stroke();
        break;

      case 'arrow':
        // Draw line
        ctx.beginPath();
        ctx.moveTo(element.startX, element.startY);
        ctx.lineTo(element.endX, element.endY);
        ctx.stroke();
        // Draw arrowhead
        const angle = Math.atan2(element.endY - element.startY, element.endX - element.startX);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(element.endX, element.endY);
        ctx.lineTo(
          element.endX - headLen * Math.cos(angle - Math.PI / 6),
          element.endY - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(element.endX, element.endY);
        ctx.lineTo(
          element.endX - headLen * Math.cos(angle + Math.PI / 6),
          element.endY - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
        break;

      case 'text':
        // Draw text
        ctx.font = `${element.fontSize || 16}px 'Inter', sans-serif`;
        ctx.fillStyle = element.color;
        ctx.fillText(element.text, element.x, element.y);
        break;
    }
  };

  /**
   * Gets mouse position relative to canvas
   */
  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  /**
   * Mouse down handler
   */
  const handleMouseDown = (e) => {
    if (!selectedDrawing) return;
    
    const pos = getMousePos(e);
    
    // Handle text tool
    if (tool === TOOLS.TEXT) {
      // Submit existing text before creating new input
      const existingValue = textInputRef.current?.value;
      if (textInput.show && existingValue?.trim()) {
        const newElement = {
          type: 'text',
          x: textInput.x,
          y: textInput.y,
          text: existingValue,
          color,
          fontSize: strokeWidth * 4
        };
        const newElements = [...(selectedDrawing.elements || []), newElement];
        setSelectedDrawing(prev => ({ ...prev, elements: newElements }));
        saveDrawing(newElements);
      }
      
      setTextInput({ show: true, x: pos.x, y: pos.y, value: '' });
      // Focus the input after it renders
      setTimeout(() => textInputRef.current?.focus(), 10);
      return;
    }
    
    setIsDrawing(true);

    if (tool === TOOLS.PEN || tool === TOOLS.ERASER) {
      setCurrentPath([pos]);
    } else {
      setCurrentPath([pos]);
    }
  };

  /**
   * Mouse move handler
   */
  const handleMouseMove = (e) => {
    if (!isDrawing || !selectedDrawing) return;

    const pos = getMousePos(e);
    const ctx = contextRef.current;

    if (tool === TOOLS.PEN) {
      // Draw stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.beginPath();
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setCurrentPath(prev => [...prev, pos]);
    } else if (tool === TOOLS.ERASER) {
      // Erase by making pixels transparent (reveals CSS grid behind)
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = strokeWidth * 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over'; // Reset to normal
      setCurrentPath(prev => [...prev, pos]);
    } else {
      // Shape preview - redraw and show preview
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      const start = currentPath[0];

      if (tool === TOOLS.LINE || tool === TOOLS.ARROW) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (tool === TOOLS.ARROW) {
          const angle = Math.atan2(pos.y - start.y, pos.x - start.x);
          const headLen = 15;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.stroke();
        }
      } else if (tool === TOOLS.RECTANGLE) {
        ctx.strokeRect(start.x, start.y, pos.x - start.x, pos.y - start.y);
      } else if (tool === TOOLS.ELLIPSE) {
        ctx.beginPath();
        const w = pos.x - start.x;
        const h = pos.y - start.y;
        ctx.ellipse(start.x + w/2, start.y + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  /**
   * Mouse up handler - finalize element
   */
  const handleMouseUp = (e) => {
    if (!isDrawing || !selectedDrawing) return;
    
    const pos = getMousePos(e);
    const start = currentPath[0];
    let newElement = null;

    if (tool === TOOLS.PEN) {
      newElement = {
        type: 'pen',
        points: [...currentPath, pos],
        color,
        strokeWidth
      };
    } else if (tool === TOOLS.LINE) {
      newElement = {
        type: 'line',
        startX: start.x, startY: start.y,
        endX: pos.x, endY: pos.y,
        color,
        strokeWidth
      };
    } else if (tool === TOOLS.ARROW) {
      newElement = {
        type: 'arrow',
        startX: start.x, startY: start.y,
        endX: pos.x, endY: pos.y,
        color,
        strokeWidth
      };
    } else if (tool === TOOLS.RECTANGLE) {
      newElement = {
        type: 'rectangle',
        x: start.x, y: start.y,
        width: pos.x - start.x,
        height: pos.y - start.y,
        color,
        strokeWidth
      };
    } else if (tool === TOOLS.ELLIPSE) {
      newElement = {
        type: 'ellipse',
        x: start.x, y: start.y,
        width: pos.x - start.x,
        height: pos.y - start.y,
        color,
        strokeWidth
      };
    }

    if (newElement) {
      const newElements = [...(selectedDrawing.elements || []), newElement];
      setSelectedDrawing(prev => ({ ...prev, elements: newElements }));
      saveDrawing(newElements);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  /**
   * Clears the canvas
   */
  const handleClearCanvas = useCallback(() => {
    if (!selectedDrawing) return;
    setSelectedDrawing(prev => ({ ...prev, elements: [] }));
    saveDrawing([]);
    redrawCanvas();
  }, [selectedDrawing, saveDrawing, redrawCanvas]);

  /**
   * Handles text input submission
   */
  const handleTextSubmit = useCallback(() => {
    // Read from DOM directly to avoid stale closure issues
    const currentValue = textInputRef.current?.value || textInput.value;
    
    if (!currentValue.trim() || !selectedDrawing) {
      setTextInput({ show: false, x: 0, y: 0, value: '' });
      return;
    }

    const newElement = {
      type: 'text',
      x: textInput.x,
      y: textInput.y,
      text: currentValue,
      color,
      fontSize: strokeWidth * 4 // Scale font size with stroke width
    };

    const newElements = [...(selectedDrawing.elements || []), newElement];
    setSelectedDrawing(prev => ({ ...prev, elements: newElements }));
    saveDrawing(newElements);
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  }, [textInput, selectedDrawing, color, strokeWidth, saveDrawing]);

  /**
   * Handles text input key down (Enter to submit, Escape to cancel)
   */
  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTextSubmit();
    } else if (e.key === 'Escape') {
      setTextInput({ show: false, x: 0, y: 0, value: '' });
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="drawing-canvas-loading">
        <div className="spinner" />
        <span>Loading sketches...</span>
      </div>
    );
  }

  return (
    <div className="drawing-canvas-container">
      {/* Drawings Sidebar */}
      <div className={`drawings-sidebar ${showDrawingsList ? 'open' : ''}`}>
        {showDrawingsList ? (
          <>
            <div className="drawings-sidebar-header">
              <button 
                className="sidebar-collapse-btn"
                onClick={() => setShowDrawingsList(false)}
                title="Collapse Sidebar"
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <div className="sidebar-search">
                <Icon name="search" size={14} />
                <input
                  type="text"
                  placeholder="Search sketches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="drawings-sort-container" ref={sortDropdownRef}>
                <button 
                  className={`drawings-sort-btn ${showSortDropdown ? 'active' : ''}`}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  title="Sort sketches"
                >
                  <Icon name="filter" size={14} />
                </button>
                {showSortDropdown && (
                  <div className="drawings-sort-dropdown">
                    <button 
                      className={`sort-option ${sortBy === 'recent' ? 'active' : ''}`}
                      onClick={() => { setSortBy('recent'); setShowSortDropdown(false); }}
                    >
                      <Icon name="check" size={12} />
                      Recent first
                    </button>
                    <button 
                      className={`sort-option ${sortBy === 'oldest' ? 'active' : ''}`}
                      onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); }}
                    >
                      <Icon name="check" size={12} />
                      Oldest first
                    </button>
                    <button 
                      className={`sort-option ${sortBy === 'alphabetical' ? 'active' : ''}`}
                      onClick={() => { setSortBy('alphabetical'); setShowSortDropdown(false); }}
                    >
                      <Icon name="check" size={12} />
                      Alphabetical
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="drawings-list">
              {sortedDrawings.map(drawing => (
                <div
                  key={drawing.id}
                  className={`drawing-list-item ${selectedDrawing?.id === drawing.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDrawing(drawing)}
                >
                  <Icon name="brush" size={14} />
                  <span className="drawing-title">{drawing.title}</span>
                  <button
                    className="delete-item-btn"
                    onClick={(e) => { e.stopPropagation(); confirmDeleteDrawing(drawing.id, drawing.title); }}
                    title="Delete"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
              {drawings.length === 0 && (
                <div className="drawings-empty">
                  No sketches yet
                </div>
              )}
            </div>
          </>
        ) : (
          <button 
            className="sidebar-expand-btn"
            onClick={() => setShowDrawingsList(true)}
            title="Show Sketches"
          >
            <Icon name="chevronRight" size={16} />
            {drawings.length > 0 && (
              <span className="sidebar-badge">{drawings.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div className="drawing-area">
        {selectedDrawing ? (
          <>
            {/* Title Row */}
            <div className="sketch-title-row">
              <input
                type="text"
                className="sketch-title-input"
                value={selectedDrawing.title}
                onChange={(e) => handleUpdateTitle(e.target.value)}
                placeholder="Sketch title..."
              />
              <button 
                className="delete-sketch-btn"
                onClick={() => confirmDeleteDrawing(selectedDrawing.id, selectedDrawing.title)}
                title="Delete Sketch"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>

            {/* Toolbar */}
            <div className="drawing-toolbar">
              <div className="toolbar-section tools">
                {Object.entries({
                  [TOOLS.TEXT]: 'Text',
                  [TOOLS.PEN]: 'Pen',
                  [TOOLS.LINE]: 'Line',
                  [TOOLS.RECTANGLE]: 'Rectangle',
                  [TOOLS.ELLIPSE]: 'Ellipse',
                  [TOOLS.ARROW]: 'Arrow',
                  [TOOLS.ERASER]: 'Eraser'
                }).map(([t, label]) => (
                  <button
                    key={t}
                    className={`tool-btn ${tool === t ? 'active' : ''}`}
                    onClick={() => setTool(t)}
                    title={label}
                  >
                    {t === TOOLS.TEXT && <Icon name="text" size={14} />}
                    {t === TOOLS.PEN && <Icon name="pencil" size={14} />}
                    {t === TOOLS.LINE && '—'}
                    {t === TOOLS.RECTANGLE && '□'}
                    {t === TOOLS.ELLIPSE && '○'}
                    {t === TOOLS.ARROW && '→'}
                    {t === TOOLS.ERASER && <Icon name="eraser" size={14} />}
                  </button>
                ))}
              </div>

              <div className="toolbar-section colors">
                {COLORS.map(c => (
                  <button
                    key={c}
                    className={`color-btn ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>

              <div className="toolbar-section stroke-widths">
                {STROKE_WIDTHS.map(w => (
                  <button
                    key={w}
                    className={`stroke-btn ${strokeWidth === w ? 'active' : ''}`}
                    onClick={() => setStrokeWidth(w)}
                    title={`${w}px`}
                  >
                    <span style={{ width: w * 2, height: w * 2 }} className="stroke-preview" />
                  </button>
                ))}
              </div>

              <div className="toolbar-section">
                <button className="clear-canvas-btn" onClick={handleClearCanvas} title="Clear Canvas">
                  <Icon name="trash" size={14} />
                  Clear
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                className="drawing-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {/* Text input overlay */}
              {textInput.show && (
                <input
                  ref={textInputRef}
                  type="text"
                  className="canvas-text-input"
                  style={{
                    left: textInput.x,
                    top: textInput.y - 10,
                    color: color,
                    fontSize: `${strokeWidth * 4}px`
                  }}
                  value={textInput.value}
                  onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={handleTextKeyDown}
                  onBlur={handleTextSubmit}
                  placeholder="Type text..."
                />
              )}
            </div>
          </>
        ) : (
          <div className="drawing-empty">
            <Icon name="brush" size={48} />
            <h3>No Sketch Selected</h3>
            <p>Select a sketch from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <Icon name="warning" size={32} />
            </div>
            <h3>Delete Sketch</h3>
            <p>Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={handleDeleteDrawing}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas;
