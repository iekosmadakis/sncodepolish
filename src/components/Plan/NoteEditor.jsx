/**
 * @fileoverview Note Editor Component - WYSIWYG Rich Text Notes (Docs)
 * @description Provides a WYSIWYG rich text editor using TipTap for taking notes
 * with formatting, code snippets, and checklists. All data persists to IndexedDB.
 */

import { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import Icon from '../Icon';
import {
  getAllNotes,
  createNote,
  updateNote,
  deleteNote
} from '../../utils/storage/planStorage';

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

// =============================================================================
// TIPTAP EDITOR COMPONENT
// =============================================================================

/**
 * TipTapEditor - WYSIWYG editor instance with toolbar
 * 
 * @param {Object} props - Component props
 * @param {Object} props.note - The note being edited
 * @param {Function} props.onUpdate - Callback when content changes
 * @param {boolean} props.isSaving - Whether content is being saved
 */
function TipTapEditor({ note, onUpdate, isSaving }) {
  // Force re-render when editor state changes (for toolbar active states)
  const [, setForceUpdate] = useState(0);
  const [linkModal, setLinkModal] = useState({ show: false, url: '', isEdit: false });
  const linkInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default, use lowlight version
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link'
        }
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Placeholder.configure({
        placeholder: 'Start writing...'
      }),
      CodeBlockLowlight.configure({
        lowlight
      })
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    onSelectionUpdate: () => {
      // Re-render toolbar when selection changes
      setForceUpdate(n => n + 1);
    },
    onTransaction: () => {
      // Re-render toolbar when any transaction occurs (formatting changes)
      setForceUpdate(n => n + 1);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content'
      }
    }
  });

  // Update editor content when note changes
  useEffect(() => {
    if (editor && note) {
      const currentContent = editor.getHTML();
      if (currentContent !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [editor, note?.id]);

  if (!editor) {
    return null;
  }

  /**
   * Opens the link modal (for inserting or editing a link)
   */
  const openLinkModal = () => {
    const existingUrl = editor.getAttributes('link').href || '';
    setLinkModal({ show: true, url: existingUrl, isEdit: !!existingUrl });
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  /**
   * Confirms the link from the modal input
   */
  const handleLinkSubmit = () => {
    const url = linkModal.url.trim();
    if (!url) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkModal({ show: false, url: '', isEdit: false });
  };

  /**
   * Removes an existing link
   */
  const handleLinkRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkModal({ show: false, url: '', isEdit: false });
  };

  return (
    <>
      <div className="tiptap-wrapper">
        {/* Editor Toolbar */}
        <div className="note-editor-toolbar">
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'active' : ''}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'active' : ''}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
              title="Heading"
            >
              H
            </button>
          </div>
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'active' : ''}
              title="Bullet List"
            >
              <Icon name="list" size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? 'active' : ''}
              title="Checklist"
            >
              <Icon name="check" size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'active' : ''}
              title="Quote"
            >
              <Icon name="quote" size={14} />
            </button>
          </div>
          <div className="toolbar-group">
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'active' : ''}
              title="Inline Code"
            >
              <Icon name="code" size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'active' : ''}
              title="Code Block"
            >
              <Icon name="terminal" size={14} />
            </button>
            <button
              onClick={openLinkModal}
              className={editor.isActive('link') ? 'active' : ''}
              title="Link"
            >
              <Icon name="link" size={14} />
            </button>
          </div>
          <div className="toolbar-right">
            {isSaving && <span className="save-indicator">Saving...</span>}
          </div>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </div>

      {/* Link Modal - rendered outside tiptap-wrapper to avoid toolbar style bleed */}
      {linkModal.show && (
        <div className="link-modal-overlay" onClick={() => setLinkModal({ show: false, url: '', isEdit: false })}>
          <div className="link-modal" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-icon">
              <Icon name="link" size={32} />
            </div>
            <h3>{linkModal.isEdit ? 'Edit Link' : 'Insert Link'}</h3>
            <p>{linkModal.isEdit ? 'Update the URL or remove the link.' : 'Enter the URL for the selected text.'}</p>
            <input
              ref={linkInputRef}
              type="url"
              className="link-modal-input"
              value={linkModal.url}
              onChange={(e) => setLinkModal(prev => ({ ...prev, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLinkSubmit();
                if (e.key === 'Escape') setLinkModal({ show: false, url: '', isEdit: false });
              }}
              placeholder="https://..."
            />
            <div className="link-modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setLinkModal({ show: false, url: '', isEdit: false })}
              >
                Cancel
              </button>
              {linkModal.isEdit && (
                <button 
                  className="remove-link-btn"
                  onClick={handleLinkRemove}
                >
                  Remove Link
                </button>
              )}
              <button 
                className="confirm-link-btn"
                onClick={handleLinkSubmit}
                disabled={!linkModal.url.trim()}
              >
                {linkModal.isEdit ? 'Update' : 'Insert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// =============================================================================
// NOTE EDITOR COMPONENT
// =============================================================================

/**
 * NoteEditor - Notes management with WYSIWYG editing
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
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'oldest', 'alphabetical'
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: '' });
  const saveTimeoutRef = useRef(null);
  const sortDropdownRef = useRef(null);

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
   * Handles content update from TipTap editor
   */
  const handleContentUpdate = useCallback((content) => {
    if (selectedNote) {
      handleUpdateNote(selectedNote.id, { content });
    }
  }, [selectedNote, handleUpdateNote]);

  /**
   * Shows delete confirmation dialog
   */
  const confirmDeleteNote = useCallback((id, title) => {
    setDeleteConfirm({ show: true, id, title: title || 'Untitled' });
  }, []);

  /**
   * Deletes a note after confirmation
   */
  const handleDeleteNote = useCallback(async () => {
    const { id } = deleteConfirm;
    if (!id) return;

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
    } finally {
      setDeleteConfirm({ show: false, id: null, title: '' });
    }
  }, [deleteConfirm, selectedNote, onToast]);

  // -------------------------------------------------------------------------
  // Filtering & Sorting
  // -------------------------------------------------------------------------

  /**
   * Strips HTML tags for search and preview
   */
  const stripHtml = useCallback((html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
  }, []);

  /**
   * Memoized filtered and sorted notes
   */
  const filteredNotes = useMemo(() => 
    notes
      .filter(note => {
        const plainContent = stripHtml(note.content);
        return note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          plainContent.toLowerCase().includes(searchQuery.toLowerCase());
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
    [notes, searchQuery, sortBy, stripHtml]
  );

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
            <Icon name="search" size={14} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="notes-sort-container" ref={sortDropdownRef}>
            <button 
              className={`notes-sort-btn ${showSortDropdown ? 'active' : ''}`}
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              title="Sort notes"
            >
              <Icon name="filter" size={14} />
            </button>
            {showSortDropdown && (
              <div className="notes-sort-dropdown">
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
        <div className="notes-list">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`note-list-item ${selectedNote?.id === note.id ? 'selected' : ''}`}
              onClick={() => setSelectedNote(note)}
            >
              <div className="note-item-content">
                <div className="note-list-title">{note.title || 'Untitled'}</div>
                <div className="note-list-preview">
                  {stripHtml(note.content)?.substring(0, 60) || 'Empty note...'}
                </div>
                <div className="note-list-date">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className="delete-item-btn"
                onClick={(e) => { e.stopPropagation(); confirmDeleteNote(note.id, note.title); }}
                title="Delete"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="notes-empty">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="note-editor-panel">
        {selectedNote ? (
          <>
            {/* Title Row */}
            <div className="note-title-row">
              <input
                type="text"
                className="note-title-input"
                value={selectedNote.title}
                onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                placeholder="Note title..."
              />
              <button 
                className="delete-note-btn"
                onClick={() => confirmDeleteNote(selectedNote.id, selectedNote.title)}
                title="Delete Note"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>

            {/* TipTap WYSIWYG Editor */}
            <TipTapEditor
              key={selectedNote.id}
              note={selectedNote}
              onUpdate={handleContentUpdate}
              isSaving={isSaving}
            />
          </>
        ) : (
          <div className="note-editor-empty">
            <Icon name="document" size={48} />
            <h3>No Note Selected</h3>
            <p>Select a note from the sidebar or create a new one</p>
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
            <h3>Delete Note</h3>
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
                onClick={handleDeleteNote}
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

export default NoteEditor;
