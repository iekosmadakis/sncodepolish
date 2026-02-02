/**
 * @fileoverview Plan Mode Storage - IndexedDB Persistence Layer
 * @description Provides offline-first storage for Plan mode data (tasks, notes, drawings).
 * All data persists across browser sessions, restarts, and power cycles.
 * No network calls - fully client-side storage using IndexedDB.
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const DB_NAME = 'GlideAwarePlanDB';
const DB_VERSION = 1;

/**
 * Store names for different data collections
 */
const STORES = {
  TASKS: 'tasks',
  NOTES: 'notes',
  DRAWINGS: 'drawings'
};

/**
 * Task status values matching Kanban columns
 */
export const TASK_STATUS = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  ON_HOLD: 'on-hold',
  IN_REVIEW: 'in-review',
  COMPLETED: 'completed'
};

/**
 * External link types for task associations
 */
export const LINK_TYPES = {
  JIRA: 'jira',
  SERVICENOW: 'servicenow',
  MONDAY: 'monday',
  CLICKUP: 'clickup',
  ASANA: 'asana',
  TRELLO: 'trello',
  MOTION: 'motion',
  OTHER: 'other'
};

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

let dbInstance = null;

/**
 * Opens or creates the IndexedDB database.
 * Creates object stores on first run or version upgrade.
 * 
 * @returns {Promise<IDBDatabase>} The database instance
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database: ' + request.error));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Tasks store with indexes for filtering
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        taskStore.createIndex('status', 'status', { unique: false });
        taskStore.createIndex('createdAt', 'createdAt', { unique: false });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Notes store with indexes
      if (!db.objectStoreNames.contains(STORES.NOTES)) {
        const noteStore = db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        noteStore.createIndex('createdAt', 'createdAt', { unique: false });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Drawings store with indexes
      if (!db.objectStoreNames.contains(STORES.DRAWINGS)) {
        const drawingStore = db.createObjectStore(STORES.DRAWINGS, { keyPath: 'id' });
        drawingStore.createIndex('createdAt', 'createdAt', { unique: false });
        drawingStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

// =============================================================================
// GENERIC CRUD OPERATIONS
// =============================================================================

/**
 * Generates a unique ID for new records.
 * Uses timestamp + random string for uniqueness.
 * 
 * @returns {string} Unique identifier
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Retrieves all items from a store.
 * 
 * @param {string} storeName - The object store name
 * @returns {Promise<Array>} Array of all items
 */
async function getAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a single item by ID.
 * 
 * @param {string} storeName - The object store name
 * @param {string} id - The item ID
 * @returns {Promise<Object|undefined>} The item or undefined
 */
async function getById(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Creates or updates an item in a store.
 * 
 * @param {string} storeName - The object store name
 * @param {Object} item - The item to save
 * @returns {Promise<Object>} The saved item
 */
async function put(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes an item by ID.
 * 
 * @param {string} storeName - The object store name
 * @param {string} id - The item ID
 * @returns {Promise<void>}
 */
async function deleteById(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// =============================================================================
// TASK OPERATIONS
// =============================================================================

/**
 * Creates a new task with default values.
 * 
 * @param {Object} taskData - Partial task data
 * @returns {Object} Complete task object
 */
function createTaskObject(taskData) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: '',
    description: '',
    status: TASK_STATUS.TODO,
    priority: 'medium',
    externalLinks: [],
    tags: [],
    order: 0,
    createdAt: now,
    updatedAt: now,
    ...taskData
  };
}

/**
 * Gets all tasks from storage.
 * 
 * @returns {Promise<Array>} Array of tasks
 */
export async function getAllTasks() {
  return getAll(STORES.TASKS);
}

/**
 * Gets a single task by ID.
 * 
 * @param {string} id - Task ID
 * @returns {Promise<Object|undefined>} The task
 */
export async function getTask(id) {
  return getById(STORES.TASKS, id);
}

/**
 * Creates a new task.
 * 
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>} The created task
 */
export async function createTask(taskData) {
  const task = createTaskObject(taskData);
  return put(STORES.TASKS, task);
}

/**
 * Updates an existing task.
 * 
 * @param {string} id - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated task
 */
export async function updateTask(id, updates) {
  const existing = await getTask(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return put(STORES.TASKS, updated);
}

/**
 * Deletes a task.
 * 
 * @param {string} id - Task ID
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  return deleteById(STORES.TASKS, id);
}

// =============================================================================
// NOTE OPERATIONS
// =============================================================================

/**
 * Creates a new note with default values.
 * 
 * @param {Object} noteData - Partial note data
 * @returns {Object} Complete note object
 */
function createNoteObject(noteData) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...noteData
  };
}

/**
 * Gets all notes from storage.
 * 
 * @returns {Promise<Array>} Array of notes
 */
export async function getAllNotes() {
  return getAll(STORES.NOTES);
}

/**
 * Gets a single note by ID.
 * 
 * @param {string} id - Note ID
 * @returns {Promise<Object|undefined>} The note
 */
export async function getNote(id) {
  return getById(STORES.NOTES, id);
}

/**
 * Creates a new note.
 * 
 * @param {Object} noteData - Note data
 * @returns {Promise<Object>} The created note
 */
export async function createNote(noteData) {
  const note = createNoteObject(noteData);
  return put(STORES.NOTES, note);
}

/**
 * Updates an existing note.
 * 
 * @param {string} id - Note ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated note
 */
export async function updateNote(id, updates) {
  const existing = await getNote(id);
  if (!existing) {
    throw new Error(`Note not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return put(STORES.NOTES, updated);
}

/**
 * Deletes a note.
 * 
 * @param {string} id - Note ID
 * @returns {Promise<void>}
 */
export async function deleteNote(id) {
  return deleteById(STORES.NOTES, id);
}

// =============================================================================
// DRAWING OPERATIONS
// =============================================================================

/**
 * Creates a new drawing with default values.
 * 
 * @param {Object} drawingData - Partial drawing data
 * @returns {Object} Complete drawing object
 */
function createDrawingObject(drawingData) {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: 'Untitled Sketch',
    elements: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    createdAt: now,
    updatedAt: now,
    ...drawingData
  };
}

/**
 * Gets all drawings from storage.
 * 
 * @returns {Promise<Array>} Array of drawings
 */
export async function getAllDrawings() {
  return getAll(STORES.DRAWINGS);
}

/**
 * Gets a single drawing by ID.
 * 
 * @param {string} id - Drawing ID
 * @returns {Promise<Object|undefined>} The drawing
 */
export async function getDrawing(id) {
  return getById(STORES.DRAWINGS, id);
}

/**
 * Creates a new drawing.
 * 
 * @param {Object} drawingData - Drawing data
 * @returns {Promise<Object>} The created drawing
 */
export async function createDrawing(drawingData) {
  const drawing = createDrawingObject(drawingData);
  return put(STORES.DRAWINGS, drawing);
}

/**
 * Updates an existing drawing.
 * 
 * @param {string} id - Drawing ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated drawing
 */
export async function updateDrawing(id, updates) {
  const existing = await getDrawing(id);
  if (!existing) {
    throw new Error(`Drawing not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  return put(STORES.DRAWINGS, updated);
}

/**
 * Deletes a drawing.
 * 
 * @param {string} id - Drawing ID
 * @returns {Promise<void>}
 */
export async function deleteDrawing(id) {
  return deleteById(STORES.DRAWINGS, id);
}

// =============================================================================
// EXPORT / IMPORT
// =============================================================================

/**
 * Exports all Plan mode data as a JSON object.
 * Includes tasks, notes, and drawings.
 * 
 * @returns {Promise<Object>} Complete data export
 */
export async function exportAllData() {
  const [tasks, notes, drawings] = await Promise.all([
    getAllTasks(),
    getAllNotes(),
    getAllDrawings()
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'GlideAware Studio',
    data: {
      tasks,
      notes,
      drawings
    }
  };
}

/**
 * Imports data from a JSON export.
 * Merges with existing data (updates by ID, adds new).
 * 
 * @param {Object} importData - The exported data object
 * @param {boolean} replace - If true, clears existing data before import
 * @returns {Promise<Object>} Import summary
 */
export async function importData(importData, replace = false) {
  if (!importData || !importData.data) {
    throw new Error('Invalid import data format');
  }

  const { tasks = [], notes = [], drawings = [] } = importData.data;
  const summary = { tasks: 0, notes: 0, drawings: 0 };

  // Clear existing data if replace mode
  if (replace) {
    const db = await openDatabase();
    await Promise.all([
      clearStore(db, STORES.TASKS),
      clearStore(db, STORES.NOTES),
      clearStore(db, STORES.DRAWINGS)
    ]);
  }

  // Import tasks
  for (const task of tasks) {
    await put(STORES.TASKS, task);
    summary.tasks++;
  }

  // Import notes
  for (const note of notes) {
    await put(STORES.NOTES, note);
    summary.notes++;
  }

  // Import drawings
  for (const drawing of drawings) {
    await put(STORES.DRAWINGS, drawing);
    summary.drawings++;
  }

  return summary;
}

/**
 * Clears all items from a store.
 * 
 * @param {IDBDatabase} db - Database instance
 * @param {string} storeName - Store to clear
 * @returns {Promise<void>}
 */
function clearStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generates a filename for export with datetime stamp.
 * 
 * @returns {string} Filename like "glideaware-plan-2024-01-15-143052.json"
 */
export function generateExportFilename() {
  const now = new Date();
  const dateStr = now.toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '')
    .replace(/\..+/, '')
    .substring(0, 17);
  return `glideaware-plan-${dateStr}.json`;
}

/**
 * Downloads data as a JSON file.
 * 
 * @param {Object} data - Data to export
 * @param {string} filename - Filename for download
 */
export function downloadAsJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  // Task operations
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  
  // Note operations
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  
  // Drawing operations
  getAllDrawings,
  getDrawing,
  createDrawing,
  updateDrawing,
  deleteDrawing,
  
  // Export/Import
  exportAllData,
  importData,
  generateExportFilename,
  downloadAsJson,
  
  // Utilities
  generateId,
  
  // Constants
  TASK_STATUS,
  LINK_TYPES
};
