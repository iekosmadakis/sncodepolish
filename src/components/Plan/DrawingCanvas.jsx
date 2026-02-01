/**
 * @fileoverview Drawing Canvas Component - Sketch/Diagram Tool
 * @description Provides a canvas-based drawing tool for creating diagrams,
 * sketches, and visual notes. Supports shapes, freehand drawing, and text.
 * All data persists to IndexedDB automatically.
 */

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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
  SELECT: 'select',
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
  
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const saveTimeoutRef = useRef(null);

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
   * Deletes a drawing
   */
  const handleDeleteDrawing = useCallback(async (id) => {
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
    }
  }, [selectedDrawing, onToast]);

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
   */
  const redrawCanvas = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !selectedDrawing) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

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
    }
  };

  /**
   * Gets mouse position relative to canvas
   */
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  /**
   * Mouse down handler
   */
  const handleMouseDown = (e) => {
    if (!selectedDrawing || tool === TOOLS.SELECT) return;
    
    const pos = getMousePos(e);
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
      // Erase (draw with background color)
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = strokeWidth * 3;
      ctx.beginPath();
      const lastPoint = currentPath[currentPath.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
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
        <div className="drawings-sidebar-header">
          <span>Sketches</span>
          <button 
            className="new-drawing-btn"
            onClick={handleCreateDrawing}
            title="New Sketch"
          >
            <Icon name="sparkles" size={16} />
          </button>
        </div>
        <div className="drawings-list">
          {drawings.map(drawing => (
            <div
              key={drawing.id}
              className={`drawing-list-item ${selectedDrawing?.id === drawing.id ? 'selected' : ''}`}
              onClick={() => setSelectedDrawing(drawing)}
            >
              <Icon name="flow" size={14} />
              <span className="drawing-title">{drawing.title}</span>
              <button
                className="delete-drawing-btn"
                onClick={(e) => { e.stopPropagation(); handleDeleteDrawing(drawing.id); }}
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
        <button 
          className="toggle-sidebar-btn"
          onClick={() => setShowDrawingsList(!showDrawingsList)}
        >
          <Icon name={showDrawingsList ? 'x' : 'clipboard'} size={14} />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="drawing-area">
        {selectedDrawing ? (
          <>
            {/* Toolbar */}
            <div className="drawing-toolbar">
              <div className="toolbar-section">
                <input
                  type="text"
                  className="drawing-title-input"
                  value={selectedDrawing.title}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  placeholder="Sketch title..."
                />
              </div>

              <div className="toolbar-section tools">
                {Object.entries({
                  [TOOLS.SELECT]: 'Select',
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
                    {t === TOOLS.SELECT && <Icon name="compare" size={14} />}
                    {t === TOOLS.PEN && <Icon name="sparkles" size={14} />}
                    {t === TOOLS.LINE && '—'}
                    {t === TOOLS.RECTANGLE && '□'}
                    {t === TOOLS.ELLIPSE && '○'}
                    {t === TOOLS.ARROW && '→'}
                    {t === TOOLS.ERASER && <Icon name="trash" size={14} />}
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
            </div>
          </>
        ) : (
          <div className="drawing-empty">
            <Icon name="flow" size={48} />
            <h3>No Sketch Selected</h3>
            <p>Select a sketch or create a new one</p>
            <button className="create-drawing-btn" onClick={handleCreateDrawing}>
              <Icon name="sparkles" size={16} />
              Create New Sketch
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default DrawingCanvas;
