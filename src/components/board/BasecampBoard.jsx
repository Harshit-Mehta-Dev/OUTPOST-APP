import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Smile, MessageSquare } from 'lucide-react';
import './BasecampBoard.css';


const BasecampBoard = ({ campsiteId, currentUser }) => {
  const [notes, setNotes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newColor, setNewColor] = useState('#fef3c7');
  const [isLoading, setIsLoading] = useState(true);

  const colors = ['#fef3c7', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff'];
  const emojis = ['👍', '❤️', '🔥', '😂', '👀'];

  const API_BASE = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };


  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/board/${campsiteId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch sticky notes:', err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (campsiteId) {
      fetchNotes();
    }
  }, [campsiteId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/api/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campsiteId,
          title: newTitle,
          body: newBody,
          author: currentUser?.username || 'Anonymous',
          color: newColor
        })
      });

      if (res.ok) {
        const savedNote = await res.json();
        setNotes([savedNote, ...notes]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewBody('');
        setNewColor('#fef3c7');
      }
    } catch (err) {
      console.error('Failed to create sticky note:', err);
    }
  };

  const handleReact = async (noteId, emoji) => {
    try {
      const res = await fetch(`${API_BASE}/api/board/${noteId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, username: currentUser?.username || 'Anonymous' })
      });

      if (res.ok) {
        const updatedNote = await res.json();
        setNotes(notes.map(n => n._id === noteId ? updatedNote : n));
      }
    } catch (err) {
      console.error('Failed to react to note:', err);
    }
  };

  const handleDelete = async (noteId) => {
    try {
      const res = await fetch(`${API_BASE}/api/board/${noteId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setNotes(notes.filter(n => n._id !== noteId));
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="basecamp-board-container">
      <div className="board-header">
        <div className="board-title">
          <h2>Basecamp Board</h2>
          <p>The Daily Digital Sticky Wall for casual sharing</p>
        </div>
        <button className="add-note-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          <span>New Note</span>
        </button>
      </div>

      {isLoading ? (
        <div className="board-loading">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="board-empty">
          <div className="empty-state">
            <MessageSquare size={48} className="empty-icon" />
            <h3>It's quiet here...</h3>
            <p>Be the first to pin a sticky note to the board!</p>
            <button onClick={() => setIsModalOpen(true)}>Post a Note</button>
          </div>
        </div>
      ) : (
        <div className="board-grid">
          <AnimatePresence>
            {notes.map(note => (
              <motion.div
                key={note._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="sticky-note"
                style={{ backgroundColor: note.color }}
              >
                {(currentUser?.username === note.author || currentUser?.isAdmin) && (
                  <button className="delete-note-btn" onClick={() => handleDelete(note._id)}>
                    <X size={14} />
                  </button>
                )}
                
                <h4 className="note-title">{note.title}</h4>
                <p className="note-body">{note.body}</p>
                
                <div className="note-footer">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="note-author">By {note.author}</span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.45)', fontStyle: 'italic' }}>
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <div className="note-reactions">
                    {note.reactions?.map(reaction => (
                      <button
                        key={reaction.emoji}
                        className={`reaction-btn ${reaction.users.includes(currentUser?.username) ? 'active' : ''}`}
                        onClick={() => handleReact(note._id, reaction.emoji)}
                      >
                        {reaction.emoji} <span className="reaction-count">{reaction.users.length}</span>
                      </button>
                    ))}
                    
                    <div className="reaction-picker-container">
                      <button className="add-reaction-btn">
                        <Smile size={14} />
                      </button>
                      <div className="reaction-picker">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            className="picker-emoji"
                            onClick={() => handleReact(note._id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content new-note-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Sticky Note</h3>
              <button onClick={() => setIsModalOpen(false)} className="close-btn"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  maxLength={50}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Hiking this weekend!"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea
                  maxLength={200}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Write something short and sweet..."
                  required
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-picker">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${newColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={!newTitle.trim() || !newBody.trim()}>Post Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasecampBoard;
