/**
 * @fileoverview Task Board Component - Kanban-style Task Management
 * @description Provides a drag-and-drop Kanban board for managing tasks.
 * Supports columns: Backlog, TODO, In Progress, On Hold, In Review, Completed.
 * All data persists to IndexedDB automatically.
 */

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import Icon from '../Icon';
import {
  TASK_STATUS,
  LINK_TYPES,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask
} from '../../utils/storage/planStorage';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Column definitions with display properties
 */
const COLUMNS = [
  { id: TASK_STATUS.TODO, title: 'To Do', icon: 'clipboard' },
  { id: TASK_STATUS.IN_PROGRESS, title: 'In Progress', icon: 'terminal' },
  { id: TASK_STATUS.ON_HOLD, title: 'On Hold', icon: 'warning' },
  { id: TASK_STATUS.IN_REVIEW, title: 'In Review', icon: 'compare' },
  { id: TASK_STATUS.COMPLETED, title: 'Completed', icon: 'check' }
];

/**
 * Priority options with colors
 */
const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'critical', label: 'Critical', color: '#ef4444' }
];

/**
 * External link type labels
 */
const LINK_TYPE_LABELS = {
  [LINK_TYPES.JIRA]: 'Jira',
  [LINK_TYPES.SERVICENOW]: 'ServiceNow',
  [LINK_TYPES.MONDAY]: 'Monday',
  [LINK_TYPES.CLICKUP]: 'ClickUp',
  [LINK_TYPES.ASANA]: 'Asana',
  [LINK_TYPES.TRELLO]: 'Trello',
  [LINK_TYPES.MOTION]: 'Motion',
  [LINK_TYPES.OTHER]: 'Other'
};

// =============================================================================
// TASK BOARD COMPONENT
// =============================================================================

/**
 * TaskBoard - Main Kanban board component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onToast - Toast notification callback
 * @param {React.Ref} ref - Forwarded ref for external method access
 */
const TaskBoard = forwardRef(function TaskBoard({ onToast }, ref) {
  // State
  const [tasks, setTasks] = useState([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backlogSearchQuery, setBacklogSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
  const modalRef = useRef(null);

  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------

  /**
   * Loads all tasks from IndexedDB on mount
   */
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const loadedTasks = await getAllTasks();
        setTasks(loadedTasks.sort((a, b) => a.order - b.order));
      } catch (error) {
        onToast?.('Failed to load tasks', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, [onToast]);

  /**
   * Close modal on outside click
   */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowTaskModal(false);
        setEditingTask(null);
      }
    };
    if (showTaskModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTaskModal]);

  // -------------------------------------------------------------------------
  // Task Operations
  // -------------------------------------------------------------------------

  /**
   * Creates a new task
   */
  const handleCreateTask = useCallback(async (status = TASK_STATUS.TODO) => {
    try {
      const newTask = await createTask({
        title: '',
        status,
        order: tasks.filter(t => t.status === status).length
      });
      setTasks(prev => [...prev, newTask]);
      setEditingTask(newTask);
      setShowTaskModal(true);
    } catch (error) {
      onToast?.('Failed to create task', 'error');
    }
  }, [tasks, onToast]);

  /**
   * Exposes methods to parent via ref
   */
  useImperativeHandle(ref, () => ({
    createTask: () => handleCreateTask(TASK_STATUS.TODO)
  }), [handleCreateTask]);

  /**
   * Updates a task
   */
  const handleUpdateTask = useCallback(async (id, updates) => {
    try {
      const updated = await updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      onToast?.('Failed to update task', 'error');
    }
  }, [onToast]);

  /**
   * Shows delete confirmation dialog
   */
  const confirmDeleteTask = useCallback((id, title) => {
    setDeleteConfirm({ show: true, id, title: title || 'Untitled Task' });
  }, []);

  /**
   * Deletes a task after confirmation
   */
  const handleDeleteTask = useCallback(async () => {
    const { id } = deleteConfirm;
    if (!id) return;

    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setShowTaskModal(false);
      setEditingTask(null);
      onToast?.('Task deleted', 'success');
    } catch (error) {
      onToast?.('Failed to delete task', 'error');
    } finally {
      setDeleteConfirm({ show: false, id: null, title: '' });
    }
  }, [deleteConfirm, onToast]);

  // -------------------------------------------------------------------------
  // Drag and Drop
  // -------------------------------------------------------------------------

  const handleDragStart = useCallback((e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(async (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== columnId) {
      await handleUpdateTask(draggedTask.id, { status: columnId });
      onToast?.(`Moved to ${COLUMNS.find(c => c.id === columnId)?.title}`, 'success');
    }
    setDraggedTask(null);
  }, [draggedTask, handleUpdateTask, onToast]);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Gets tasks for a specific column
   */
  const getColumnTasks = useCallback((columnId) => {
    return tasks
      .filter(t => t.status === columnId)
      .sort((a, b) => a.order - b.order);
  }, [tasks]);

  /**
   * Memoized filtered backlog tasks
   */
  const backlogTasks = useMemo(() => 
    tasks
      .filter(t => t.status === TASK_STATUS.BACKLOG)
      .filter(t => {
        if (!backlogSearchQuery.trim()) return true;
        const query = backlogSearchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.order - b.order),
    [tasks, backlogSearchQuery]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="task-board-loading">
        <div className="spinner" />
        <span>Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="task-board">
      {/* Backlog Panel */}
      <div className={`backlog-panel ${showBacklog ? 'open' : ''}`}>
        {showBacklog ? (
          <>
            <div className="backlog-header">
              <button 
                className="backlog-collapse-btn"
                onClick={() => setShowBacklog(false)}
                title="Collapse Backlog"
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <div className="backlog-search">
                <Icon name="search" size={14} />
                <input
                  type="text"
                  placeholder="Search backlog..."
                  value={backlogSearchQuery}
                  onChange={(e) => setBacklogSearchQuery(e.target.value)}
                />
              </div>
              <button 
                className="add-task-btn small"
                onClick={() => handleCreateTask(TASK_STATUS.BACKLOG)}
                title="Add to Backlog"
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
            <div className="backlog-list">
              {backlogTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => { setEditingTask(task); setShowTaskModal(true); }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  compact
                />
              ))}
              {backlogTasks.length === 0 && (
                <div className="empty-backlog">No backlog items</div>
              )}
            </div>
          </>
        ) : (
          <button 
            className="backlog-expand-btn"
            onClick={() => setShowBacklog(true)}
            title="Show Backlog"
          >
            <Icon name="chevronRight" size={16} />
            {backlogTasks.length > 0 && (
              <span className="backlog-badge">{backlogTasks.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Kanban Columns */}
      <div className="kanban-columns">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className={`kanban-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <div className="column-title">
                <Icon name={column.icon} size={14} />
                <span>{column.title}</span>
                <span className="column-count">{getColumnTasks(column.id).length}</span>
              </div>
              <button
                className="add-task-btn"
                onClick={() => handleCreateTask(column.id)}
                title={`Add task to ${column.title}`}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
            <div className="column-content">
              {getColumnTasks(column.id).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => { setEditingTask(task); setShowTaskModal(true); }}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Edit Modal */}
      {showTaskModal && editingTask && (
        <div className="task-modal-overlay">
          <div className="task-modal" ref={modalRef}>
            <TaskEditForm
              task={editingTask}
              onUpdate={handleUpdateTask}
              onDelete={confirmDeleteTask}
              onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="delete-confirm-overlay" onClick={() => setDeleteConfirm({ show: false, id: null, title: '' })}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <Icon name="warning" size={32} />
            </div>
            <h3>Delete Task</h3>
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
                onClick={handleDeleteTask}
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

// =============================================================================
// TASK CARD COMPONENT
// =============================================================================

/**
 * TaskCard - Individual task card in the Kanban board
 */
function TaskCard({ task, onEdit, onDragStart, onDragEnd, compact = false }) {
  const priority = PRIORITIES.find(p => p.id === task.priority);
  const hasLinks = task.externalLinks && task.externalLinks.length > 0;

  return (
    <div
      className={`task-card ${compact ? 'compact' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onEdit}
    >
      <div className="task-card-header">
        <span 
          className="task-priority-dot"
          style={{ backgroundColor: priority?.color || '#64748b' }}
          title={priority?.label || 'Medium'}
        />
        <span className="task-title">{task.title || 'Untitled Task'}</span>
      </div>
      {!compact && task.description && (
        <div className="task-description">{task.description.substring(0, 80)}{task.description.length > 80 ? '...' : ''}</div>
      )}
      <div className="task-card-footer">
        {hasLinks && (
          <div className="task-links">
            {task.externalLinks.slice(0, 2).map((link, i) => (
              <span key={i} className="task-link-badge" title={link.url}>
                {LINK_TYPE_LABELS[link.type]?.substring(0, 2) || 'LK'}
              </span>
            ))}
            {task.externalLinks.length > 2 && (
              <span className="task-link-badge more">+{task.externalLinks.length - 2}</span>
            )}
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="task-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TASK EDIT FORM COMPONENT
// =============================================================================

/**
 * TaskEditForm - Modal form for editing task details
 */
function TaskEditForm({ task, onUpdate, onDelete, onClose }) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [status, setStatus] = useState(task.status);
  const [tags, setTags] = useState(task.tags?.join(', ') || '');
  const [links, setLinks] = useState(task.externalLinks || []);
  const [newLinkType, setNewLinkType] = useState(LINK_TYPES.JIRA);
  const [newLinkUrl, setNewLinkUrl] = useState('');

  /**
   * Auto-save on field changes
   */
  const handleFieldChange = useCallback((field, value) => {
    const updates = { [field]: value };
    if (field === 'tags') {
      updates.tags = value.split(',').map(t => t.trim()).filter(Boolean);
    }
    onUpdate(task.id, updates);
  }, [task.id, onUpdate]);

  /**
   * Adds an external link
   */
  const handleAddLink = useCallback(() => {
    if (!newLinkUrl.trim()) return;
    const newLinks = [...links, { type: newLinkType, url: newLinkUrl.trim() }];
    setLinks(newLinks);
    onUpdate(task.id, { externalLinks: newLinks });
    setNewLinkUrl('');
  }, [links, newLinkType, newLinkUrl, task.id, onUpdate]);

  /**
   * Removes an external link
   */
  const handleRemoveLink = useCallback((index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
    onUpdate(task.id, { externalLinks: newLinks });
  }, [links, task.id, onUpdate]);

  return (
    <div className="task-edit-form">
      <div className="task-edit-header">
        <input
          type="text"
          className="task-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => handleFieldChange('title', title)}
          placeholder="Task title..."
          autoFocus
        />
        <button className="close-btn" onClick={onClose} title="Close">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="task-edit-body">
        {/* Status & Priority Row */}
        <div className="task-edit-row">
          <div className="task-edit-field">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); handleFieldChange('status', e.target.value); }}
            >
              <option value={TASK_STATUS.BACKLOG}>Backlog</option>
              {COLUMNS.map(col => (
                <option key={col.id} value={col.id}>{col.title}</option>
              ))}
            </select>
          </div>
          <div className="task-edit-field">
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); handleFieldChange('priority', e.target.value); }}
            >
              {PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="task-edit-field full">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleFieldChange('description', description)}
            placeholder="Add a description..."
            rows={4}
          />
        </div>

        {/* Tags */}
        <div className="task-edit-field full">
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={() => handleFieldChange('tags', tags)}
            placeholder="frontend, bug, urgent..."
          />
        </div>

        {/* External Links */}
        <div className="task-edit-field full">
          <label>External Links</label>
          <div className="external-links-list">
            {links.map((link, i) => (
              <div key={i} className="external-link-item">
                <span className="link-type-badge">{LINK_TYPE_LABELS[link.type]}</span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url">
                  {link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                </a>
                <button className="remove-link-btn" onClick={() => handleRemoveLink(i)}>
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="add-link-row">
            <select value={newLinkType} onChange={(e) => setNewLinkType(e.target.value)}>
              {Object.entries(LINK_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
            />
            <button className="add-link-btn" onClick={handleAddLink} disabled={!newLinkUrl.trim()}>
              <Icon name="plus" size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="task-edit-footer">
        <button className="delete-task-btn" onClick={() => onDelete(task.id, task.title)}>
          <Icon name="trash" size={14} />
          Delete Task
        </button>
        <div className="task-timestamps">
          <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

export default TaskBoard;
