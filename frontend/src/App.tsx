import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import './App.css';

export interface Document {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
}

function App() {
  const [currentUserId, setCurrentUserId] = useState<string>('user1');
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');

  return (
    <div className="app">
      <div className="user-switcher">
        <span>Current User:</span>
        <button
          onClick={() => setCurrentUserId('user1')}
          className={currentUserId === 'user1' ? 'active' : ''}
        >
          Alice (user1)
        </button>
        <button
          onClick={() => setCurrentUserId('user2')}
          className={currentUserId === 'user2' ? 'active' : ''}
        >
          Bob (user2)
        </button>
      </div>

      {view === 'dashboard' && (
        <Dashboard
          userId={currentUserId}
          onSelectDoc={(doc) => {
            setCurrentDoc(doc);
            setView('editor');
          }}
          onCreateNew={() => {
            setCurrentDoc(null);
            setView('editor');
          }}
        />
      )}

      {view === 'editor' && (
        <Editor
          userId={currentUserId}
          document={currentDoc}
          onBack={() => setView('dashboard')}
          onSaved={() => setView('dashboard')}
        />
      )}
    </div>
  );
}

export default App;