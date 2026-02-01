/**
 * @fileoverview Note Editor Component - Rich Text Notes (Docs)
 * @description Provides a rich text editor for taking notes with markdown support,
 * code snippets, and checklists. All data persists to IndexedDB automatically.
 */

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Icon from '../Icon';
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote
} from '../../utils/storage/planStorage';

// =============================================================================
// NOTE EDITOR COMPONENT
// =============================================================================

/**
 * NoteEditor - Notes management with rich text editing
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onToast - Toast notification callback
 * @param {React.Ref} ref - Forwarded ref for external method access
 */
const NoteEditor = forwardRef(function NoteEditor({ onToast }, ref) {
  // State
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // -------------------------------------------------------------------------
  // Data Loading
  // -------------------------------------------------------------------------

  /**
   * Loads all notes from IndexedDB on mount
   */
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const loadedNotes = await getAllNotes();
        const sorted = loadedNotes.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setNotes(sorted);
        // Auto-select first note if exists
        if (sorted.length > 0 && !selectedNote) {
          setSelectedNote(sorted[0]);
        }
      } catch (error) {
        onToast?.('Failed to load notes', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadNotes();
  }, [onToast]);

  // -------------------------------------------------------------------------
  // Note Operations
  // -------------------------------------------------------------------------

  /**
   * Creates a new note
   */
  const handleCreateNote = useCallback(async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: ''
      });
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      onToast?.('New note created', 'success');
    } catch (error) {
      onToast?.('Failed to create note', 'error');
    }
  }, [onToast]);

  /**
   * Exposes methods to parent via ref
   */
  useImperativeHandle(ref, () => ({
    createNote: handleCreateNote
  }), [handleCreateNote]);

  /**
   * Updates a note with debounced auto-save
   */
  const handleUpdateNote = useCallback(async (id, updates) => {
    // Update local state immediately
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    ));
    if (selectedNote?.id === id) {
      setSelectedNote(prev => ({ ...prev, ...updates }));
    }

    // Debounced save to IndexedDB
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote(id, updates);
      } catch (error) {
        onToast?.('Failed to save note', 'error');
      } finally {
        setIsSaving(false);
      }
    }, 500);
  }, [selectedNote, onToast]);

  /**
   * Deletes a note
   */
  const handleDeleteNote = useCallback(async (id) => {
    try {
      await deleteNote(id);
      setNotes(prev => {
        const updated = prev.filter(n => n.id !== id);
        // Select next note if deleting current
        if (selectedNote?.id === id) {
          setSelectedNote(updated[0] || null);
        }
        return updated;
      });
      onToast?.('Note deleted', 'success');
    } catch (error) {
      onToast?.('Failed to delete note', 'error');
    }
  }, [selectedNote, onToast]);

  // -------------------------------------------------------------------------
  // Editor Actions
  // -------------------------------------------------------------------------

  /**
   * Inserts text at cursor position
   */
  const insertAtCursor = useCallback((before, after = '') => {
    const textarea = editorRef.current;
    if (!textarea || !selectedNote) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = selectedNote.content;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      before + selectedText + after + 
      content.substring(end);
    
    handleUpdateNote(selectedNote.id, { content: newContent });
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [selectedNote, handleUpdateNote]);

  /**
   * Toolbar actions
   */
  const toolbarActions = {
    bold: () => insertAtCursor('**', '**'),
    italic: () => insertAtCursor('*', '*'),
    heading: () => insertAtCursor('## ', ''),
    list: () => insertAtCursor('- ', ''),
    checklist: () => insertAtCursor('- [ ] ', ''),
    code: () => insertAtCursor('`', '`'),
    codeBlock: () => insertAtCursor('\n```\n', '\n```\n'),
    link: () => insertAtCursor('[', '](url)'),
    quote: () => insertAtCursor('> ', '')
  };

  // -------------------------------------------------------------------------
  // Filtering
  // -------------------------------------------------------------------------

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="note-editor-loading">
        <div className="spinner" />
        <span>Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="note-editor">
      {/* Notes Sidebar */}
      <div className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div className="notes-search">
            <Icon name="info" size={14} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="new-note-btn"
            onClick={handleCreateNote}
            title="New Note"
          >
            <Icon name="sparkles" size={16} />
          </button>
        </div>
        <div className="notes-list">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
              onClick={() => setSelectedNote(note)}
            >
              <div className="note-list-title">{note.title || 'Untitled'}</div>
              <div className="note-list-preview">
                {note.content?.substring(0, 60) || 'Empty note...'}
              </div>
              <div className="note-list-date">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="notes-empty">
              {searchQuery ? 'No notes found' : 'No notes yet. Create one!'}
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="note-editor-panel">
        {selectedNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="note-editor-toolbar">
              <div className="toolbar-group">
                <button onClick={toolbarActions.bold} title="Bold (Ctrl+B)">
                  <strong>B</strong>
                </button>
                <button onClick={toolbarActions.italic} title="Italic (Ctrl+I)">
                  <em>I</em>
                </button>
                <button onClick={toolbarActions.heading} title="Heading">
                  H
                </button>
              </div>
              <div className="toolbar-group">
                <button onClick={toolbarActions.list} title="Bullet List">
                  <Icon name="clipboard" size={14} />
                </button>
                <button onClick={toolbarActions.checklist} title="Checklist">
                  <Icon name="check" size={14} />
                </button>
                <button onClick={toolbarActions.quote} title="Quote">
                  <Icon name="info" size={14} />
                </button>
              </div>
              <div className="toolbar-group">
                <button onClick={toolbarActions.code} title="Inline Code">
                  <Icon name="code" size={14} />
                </button>
                <button onClick={toolbarActions.codeBlock} title="Code Block">
                  <Icon name="terminal" size={14} />
                </button>
                <button onClick={toolbarActions.link} title="Link">
                  <Icon name="download" size={14} />
                </button>
              </div>
              <div className="toolbar-right">
                {isSaving && <span className="save-indicator">Saving...</span>}
                <button 
                  className="delete-note-btn"
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  title="Delete Note"
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>

            {/* Title Input */}
            <input
              type="text"
              className="note-title-input"
              value={selectedNote.title}
              onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
              placeholder="Note title..."
            />

            {/* Content Editor */}
            <textarea
              ref={editorRef}
              className="note-content-editor"
              value={selectedNote.content}
              onChange={(e) => handleUpdateNote(selectedNote.id, { content: e.target.value })}
              placeholder="Start writing... (Markdown supported)"
            />
          </>
        ) : (
          <div className="note-editor-empty">
            <Icon name="clipboard" size={48} />
            <h3>No Note Selected</h3>
            <p>Select a note from the sidebar or create a new one</p>
            <button className="create-note-btn" onClick={handleCreateNote}>
              <Icon name="sparkles" size={16} />
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default NoteEditor;
