import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import type { Document, User } from '../App';
import { FileText, Plus, Share2, Trash2, Upload } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

interface DashboardProps {
  userId: string;
  onSelectDoc: (doc: Document) => void;
  onCreateNew: () => void;
}

export default function Dashboard({ userId, onSelectDoc, onCreateNew }: DashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents?userId=${userId}`);
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users?currentUserId=${userId}`);
      setUsers(res.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleShare = async (docId: string, sharedWithUserId: string) => {
    try {
      await axios.post(`${API_URL}/documents/${docId}/share`, { sharedWithUserId });
      setShowShareModal(null);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Delete this document?')) {
      try {
        await axios.delete(`${API_URL}/documents/${docId}`);
        fetchDocuments();
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleCreateNew = async () => {
    try {
      const res = await axios.post(`${API_URL}/documents`, {
        title: 'Untitled',
        content: '<p>Start writing...</p>',
        ownerId: userId
      });
      onCreateNew();
      onSelectDoc(res.data);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt')) {
      alert('Please upload a .txt file');
      return;
    }
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const htmlContent = lines.map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
      const res = await axios.post(`${API_URL}/documents`, {
        title: file.name.replace('.txt', ''),
        content: htmlContent || '<p>Empty file</p>',
        ownerId: userId
      });
      onSelectDoc(res.data);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file');
    }
    e.target.value = '';
  };

  const ownedDocs = documents.filter(d => d.owner_id === userId);
  const sharedDocs = documents.filter(d => d.owner_id !== userId);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        aria-label="Upload text file"
        title="Upload text file"
      />

      <div className="dashboard-header">
        <h1>My Documents</h1>
        <div className="dashboard-actions">
          <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Upload .txt
          </button>
          <button className="btn-primary" onClick={handleCreateNew}>
            <Plus size={16} /> New Document
          </button>
        </div>
      </div>

      {ownedDocs.length > 0 && (
        <div className="doc-section">
          <h2>Owned by me</h2>
          <div className="doc-list">
            {ownedDocs.map(doc => (
              <div key={doc.id} className="doc-card">
                <div className="doc-card-content" onClick={() => onSelectDoc(doc)}>
                  <FileText size={20} />
                  <div>
                    <div className="doc-title">{doc.title}</div>
                    <div className="doc-date">
                      Updated: {new Date(doc.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="doc-card-actions">
                  <button onClick={() => setShowShareModal(doc.id)} className="btn-icon" title="Share">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="btn-icon btn-danger" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sharedDocs.length > 0 && (
        <div className="doc-section">
          <h2>Shared with me</h2>
          <div className="doc-list">
            {sharedDocs.map(doc => (
              <div key={doc.id} className="doc-card">
                <div className="doc-card-content" onClick={() => onSelectDoc(doc)}>
                  <FileText size={20} />
                  <div>
                    <div className="doc-title">{doc.title}</div>
                    <div className="doc-date">Owner: {doc.owner_id === 'user1' ? 'Alice' : 'Bob'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && (
        <div className="empty-state">
          <p>No documents yet. Create your first document or upload a .txt file!</p>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Share Document</h3>
            <div className="share-options">
              {users.map(user => (
                <button key={user.id} onClick={() => handleShare(showShareModal, user.id)}>
                  Share with {user.name}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setShowShareModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}